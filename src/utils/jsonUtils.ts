
/**
 * Safely parses JSON that might have unquoted keys, literal newlines in strings, 
 * or other AI-generated messiness.
 */
export function relaxedJsonParse(text: string): any {
  if (!text || typeof text !== 'string') return text;
  
  let val = text.trim();
  
  // Remove markdown code blocks
  if (val.startsWith('```')) {
    val = val.replace(/^```(json)?/, '').replace(/```$/, '').trim();
  }

  // Phase 0: Pre-clean nested JSON strings that have unescaped quotes
  const originalVal = val;
  val = val.replace(/:(\s*)"(\s*{[\s\S]*?}\s*)"(?=\s*[,}])/g, (match, space, body) => {
    const escapedBody = body.replace(/(?<!\\)"/g, '\\"');
    return `:${space}"${escapedBody}"`;
  });
  
  if (val !== originalVal) {
    console.log('[relaxedJsonParse] Phase 0 applied: Escaped nested JSON string');
  }

  // Phase 1: Structural Normalization (Character-by-character scan)
  let escaped = "";
  let inString = false;
  let quoteChar = "";

  for (let i = 0; i < val.length; i++) {
    const char = val[i];
    const prev = i > 0 ? val[i - 1] : "";
    
    if ((char === '"' || char === "'") && prev !== '\\') {
      if (!inString) {
        inString = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        const nextChar = val.slice(i + 1).trim()[0];
        const isLikelyClosing = !nextChar || [':', ',', '}', ']'].includes(nextChar);
        if (isLikelyClosing) {
          inString = false;
          quoteChar = "";
        } else {
          escaped += "\\";
        }
      }
    }
    
    if (inString && char !== quoteChar) {
      if (char === '\n') escaped += "\\n";
      else if (char === '\r') escaped += "\\r";
      else if (char === '\t') escaped += "\\t";
      else escaped += char;
    } else {
      escaped += char;
    }
  }

  try {
    const result = JSON.parse(escaped);
    return result;
  } catch (e) {
    // Continue
  }

  // Phase 2: Structural Fixing
  let structuralFix = escaped;
  try {
    structuralFix = structuralFix.replace(/([{,]\s*)([a-zA-Z0-9_]+)(?=\s*:)/g, '$1"$2"');
    structuralFix = structuralFix.replace(/:(\s*)(https?:\/\/[^\s,{}]+)(?=\s*[,}\n]|$)/g, ':$1"$2"');
    structuralFix = structuralFix.replace(/,\s*([\}\]])/g, '$1');

    const result = JSON.parse(structuralFix);
    return result;
  } catch (e) {
    // Continue
  }

  // Phase 3: Final fallback
  try {
    const firstBrace = escaped.indexOf('{');
    const lastBrace = escaped.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const result = JSON.parse(escaped.substring(firstBrace, lastBrace + 1));
      console.log('[relaxedJsonParse] Phase 3 recovered data from substring');
      return result;
    }
  } catch (e) {
    // Fail
  }

  console.error('[relaxedJsonParse] All parsing attempts failed for:', text.substring(0, 100) + '...');
  return null;
}

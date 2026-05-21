import type { MarkdownBlock } from '@/types/presentation';

export const markdownToEditorHtml = (markdown: string): string => {
  const lines = markdown.split('\n');
  const html: string[] = [];
  let inUl = false;
  let inOl = false;

  const closeLists = () => {
    if (inUl) {
      html.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      html.push('</ol>');
      inOl = false;
    }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      closeLists();
      continue;
    }
    if (line.startsWith('# ')) {
      closeLists();
      html.push(`<h1>${line.slice(2)}</h1>`);
      continue;
    }
    if (line.startsWith('## ')) {
      closeLists();
      html.push(`<h2>${line.slice(3)}</h2>`);
      continue;
    }
    if (line.startsWith('### ')) {
      closeLists();
      html.push(`<h3>${line.slice(4)}</h3>`);
      continue;
    }
    if (line.startsWith('- ')) {
      if (!inUl) {
        closeLists();
        html.push('<ul>');
        inUl = true;
      }
      html.push(`<li>${line.slice(2)}</li>`);
      continue;
    }
    if (/^\d+\.\s/.test(line)) {
      if (!inOl) {
        closeLists();
        html.push('<ol>');
        inOl = true;
      }
      html.push(`<li>${line.replace(/^\d+\.\s*/, '')}</li>`);
      continue;
    }
    closeLists();
    html.push(`<p>${line}</p>`);
  }

  closeLists();
  return html.join('');
};

export const editorHtmlToMarkdown = (html: string): string => {
  const normalized = html
    .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n')
    .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n')
    .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n')
    .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
    .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<(strong|b)[^>]*>(.*?)<\/(strong|b)>/gi, '**$2**')
    .replace(/<(em|i)[^>]*>(.*?)<\/(em|i)>/gi, '*$2*')
    .replace(/<[^>]+>/g, '');

  const lines = normalized
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  // Convert consecutive bullet items to numbered list if source line looked like ordered list marker.
  return lines.join('\n');
};

export const blocksToMarkdown = (blocks: MarkdownBlock[]): string => {
  const lines: string[] = [];
  const renderLines = (value: string): string[] =>
    value
      .split('\n')
      .map((line) => line.trimEnd())
      .filter((line) => line.length > 0);

  for (const block of blocks) {
    switch (block.type) {
      case 'heading':
        lines.push(`${'#'.repeat(block.level)} ${block.text}`);
        break;
      case 'paragraph':
        lines.push(block.text);
        break;
      case 'bullet_list':
        lines.push(...block.items.map((item) => `- ${item}`));
        break;
      case 'numbered_list':
        lines.push(...block.items.map((item, index) => `${index + 1}. ${item}`));
        break;
      case 'quote':
        lines.push(`> ${block.text}`);
        if (block.attribution) lines.push(`> - ${block.attribution}`);
        break;
      case 'table':
        if (block.headers.length) {
          lines.push(`| ${block.headers.join(' | ')} |`);
          lines.push(`| ${block.headers.map(() => '---').join(' | ')} |`);
          lines.push(...block.rows.map((row) => `| ${row.join(' | ')} |`));
        }
        break;
      case 'metric_row':
        lines.push(':::metric');
        lines.push(
          ...block.metrics.map((metric) =>
            [metric.value, metric.label, metric.delta].filter(Boolean).join(' | ')
          )
        );
        lines.push(':::');
        break;
      case 'callout':
        lines.push(`:::callout[icon=${block.icon || 'info'}]`);
        if (block.title?.trim()) lines.push(`**${block.title.trim()}**`);
        lines.push(...renderLines(block.body || ''));
        lines.push(':::');
        break;
      case 'chart':
        lines.push(`:::chart[type=${block.chartType}]`);
        if (block.data.headers.length) {
          lines.push(`| ${block.data.headers.join(' | ')} |`);
          lines.push(`| ${block.data.headers.map(() => '---').join(' | ')} |`);
          lines.push(...block.data.rows.map((row) => `| ${row.join(' | ')} |`));
        }
        lines.push(':::');
        break;
      case 'image':
        lines.push(`![${block.alt || ''}](${block.src})`);
        if (block.caption?.trim()) lines.push(block.caption.trim());
        break;
      case 'code':
        lines.push(`\`\`\`${block.language || ''}`.trim());
        lines.push(...(block.code || '').split('\n'));
        lines.push('```');
        break;
      case 'divider':
        lines.push('---');
        break;
      case 'columns': {
        lines.push(':::columns');
        block.columns.forEach((column, idx) => {
          if (idx > 0) lines.push('---');
          const nested = blocksToMarkdown(column);
          if (nested.trim()) lines.push(...nested.split('\n'));
        });
        lines.push(':::');
        break;
      }
      default:
        lines.push('[Unsupported block]');
    }
    lines.push('');
  }
  return lines.join('\n').trim();
};

export function blockToRichHtml(block: MarkdownBlock): string {
  switch (block.type) {
    case 'heading':
      return `<h${block.level}>${markdownToEditorHtml(block.text).replace(/<\/?p>/g, '')}</h${block.level}>`;
    case 'paragraph':
      return markdownToEditorHtml(block.text);
    case 'bullet_list':
      return `<ul>${block.items.map(i => `<li>${markdownToEditorHtml(i).replace(/<\/?p>/g, '')}</li>`).join('')}</ul>`;
    case 'numbered_list':
      return `<ol>${block.items.map(i => `<li>${markdownToEditorHtml(i).replace(/<\/?p>/g, '')}</li>`).join('')}</ol>`;
    case 'quote':
      return `<blockquote>${markdownToEditorHtml(block.text)}</blockquote>`;
    default:
      return '';
  }
}

export function richMarkdownToBlockValue(block: MarkdownBlock, markdown: string): MarkdownBlock {
  const lines = markdown.split('\n').map(l => l.trim()).filter(Boolean);
  switch (block.type) {
    case 'heading':
    case 'paragraph':
      return { ...block, text: markdown.replace(/^#+\s+/, '') };
    case 'bullet_list':
    case 'numbered_list':
      return { ...block, items: lines.map(l => l.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '')) };
    case 'quote':
      return { ...block, text: markdown.replace(/^>\s+/, '') };
    default:
      return block;
  }
}

/**
 * Helper functions for data manipulation and validation
 */

// Helper function to safely render data values (handle objects, arrays, etc.)
export const renderDataValue = (value: any): string => {
  if (typeof value === 'string') {
    return value;
  } else if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.join(', ');
    } else {
      return Object.entries(value)
        .map(([key, val]) => `${key}: ${val}`)
        .join(', ');
    }
  } else if (value === null || value === undefined) {
    return 'N/A';
  } else {
    return String(value);
  }
};

// Helper: get first available property by alias (case-insensitive)
export const getPropByAliases = (source: any, aliases: string[]): any => {
  if (!source || typeof source !== 'object') return undefined;
  
  const normalize = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const keyMap = Object.keys(source).reduce<Record<string, string>>((acc, k) => {
    acc[normalize(k)] = k;
    return acc;
  }, {});
  
  for (const alias of aliases) {
    const normalizedAlias = normalize(alias);
    if (keyMap[normalizedAlias]) return source[keyMap[normalizedAlias]];
  }
  return undefined;
};

// Helper: Parse JSON string safely
export const parseJSONSafely = (data: any): any => {
  if (!data) return null;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to parse JSON:', error);
      return null;
    }
  }
  return data;
};

// Helper: Check if data exists and has content
export const hasDataContent = (data: any): boolean => {
  if (!data) return false;
  
  const parsed = parseJSONSafely(data);
  if (!parsed) return false;
  
  if (parsed.content && typeof parsed.content === 'object') {
    return Object.keys(parsed.content).length > 0;
  }
  
  return false;
};

// Convert value to array
export const toArray = (val: any): any[] => {
  return Array.isArray(val) ? val : (val ? [val] : []);
};

// Aliases for flexible schemas
export const USER_FIELD_ALIASES = {
  demographics: ['Demographics', 'Demographic', 'Profile', 'Demographic Details'],
  amplifiedNeeds: ['Amplified Needs', 'Needs', 'High Needs'],
  painPointExperience: ['Pain Point Experience', 'Pain Points', 'Experience'],
  currentWorkarounds: ['Current Workarounds', 'Workarounds', 'Existing Workarounds'],
  uniqueChallenges: ['Unique Challenges', 'Challenges'],
  researchValue: ['Research Value', 'Value for Research', 'Why Important'],
  interviewFocus: ['Interview Focus', 'Interview Questions', 'Interview Themes'],
  barriersFaced: ['Barriers Faced', 'Barriers', 'Constraints'],
  exclusionFactors: ['Exclusion Factors', 'Exclusion', 'Systemic Exclusion']
};

export const getUserField = (user: any, field: keyof typeof USER_FIELD_ALIASES): string => {
  return renderDataValue(getPropByAliases(user, USER_FIELD_ALIASES[field]) ?? 'N/A');
};

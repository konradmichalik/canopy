/**
 * JQL Helper Functions
 * Utilities for modifying and combining JQL queries
 */

/**
 * Wrap a JQL query in parentheses if it contains OR operators
 */
export function wrapIfNeeded(jql: string): string {
  const trimmed = jql.trim();
  if (!trimmed) return trimmed;

  // Check if the query contains OR at the top level (not inside parentheses)
  let depth = 0;
  const upperJql = trimmed.toUpperCase();

  for (let i = 0; i < upperJql.length; i++) {
    if (upperJql[i] === '(') depth++;
    else if (upperJql[i] === ')') depth--;
    else if (depth === 0 && upperJql.substring(i, i + 4) === ' OR ') {
      return `(${trimmed})`;
    }
  }

  return trimmed;
}

/**
 * Extract ORDER BY clause from JQL
 */
function extractOrderBy(jql: string): { query: string; orderBy: string | null } {
  const upperJql = jql.toUpperCase();
  const orderByIndex = upperJql.lastIndexOf('ORDER BY');

  if (orderByIndex === -1) {
    return { query: jql.trim(), orderBy: null };
  }

  return {
    query: jql.substring(0, orderByIndex).trim(),
    orderBy: jql.substring(orderByIndex).trim()
  };
}

/**
 * Append a condition to a JQL query with AND
 * Handles ORDER BY correctly by inserting conditions before it
 */
export function appendCondition(baseJql: string, condition: string): string {
  const trimmedCondition = condition.trim();

  if (!baseJql.trim()) {
    return trimmedCondition;
  }

  if (!trimmedCondition) {
    return baseJql.trim();
  }

  // Extract ORDER BY if present
  const { query, orderBy } = extractOrderBy(baseJql);

  // Build new query with condition
  const newQuery = `${wrapIfNeeded(query)} AND ${trimmedCondition}`;

  // Re-append ORDER BY if it existed
  return orderBy ? `${newQuery} ${orderBy}` : newQuery;
}

/**
 * Append multiple conditions to a JQL query
 */
export function appendConditions(baseJql: string, conditions: string[]): string {
  return conditions.reduce((jql, condition) => appendCondition(jql, condition), baseJql);
}

/**
 * Apply quick filters to a JQL query
 */
export function applyQuickFilters(baseJql: string, filterConditions: string[]): string {
  return appendConditions(baseJql, filterConditions);
}

/**
 * Add ORDER BY clause if not present
 */
export function ensureOrderBy(jql: string, orderBy = 'created DESC'): string {
  const trimmed = jql.trim();
  const upperJql = trimmed.toUpperCase();

  if (upperJql.includes('ORDER BY')) {
    return trimmed;
  }

  return `${trimmed} ORDER BY ${orderBy}`;
}

/**
 * Extract project keys from JQL (for display purposes)
 */
export function extractProjectKeys(jql: string): string[] {
  const projectPattern = /project\s*(?:=|IN)\s*(?:\(([^)]+)\)|([^\s,)]+))/gi;
  const keys: string[] = [];
  let match;

  while ((match = projectPattern.exec(jql)) !== null) {
    const projectList = match[1] || match[2];
    if (projectList) {
      // Split by comma and clean up
      const projects = projectList.split(',').map((p) => p.trim().replace(/["']/g, ''));
      keys.push(...projects);
    }
  }

  return [...new Set(keys)]; // Remove duplicates
}

/**
 * Validate basic JQL syntax (client-side validation)
 */
export function validateJql(jql: string): { isValid: boolean; error?: string } {
  const trimmed = jql.trim();

  if (!trimmed) {
    return { isValid: false, error: 'JQL query cannot be empty' };
  }

  // Check for balanced parentheses
  let depth = 0;
  for (const char of trimmed) {
    if (char === '(') depth++;
    else if (char === ')') depth--;
    if (depth < 0) {
      return { isValid: false, error: 'Unbalanced parentheses' };
    }
  }
  if (depth !== 0) {
    return { isValid: false, error: 'Unbalanced parentheses' };
  }

  // Check for balanced quotes
  const singleQuotes = (trimmed.match(/'/g) || []).length;
  const doubleQuotes = (trimmed.match(/"/g) || []).length;

  if (singleQuotes % 2 !== 0) {
    return { isValid: false, error: 'Unbalanced single quotes' };
  }
  if (doubleQuotes % 2 !== 0) {
    return { isValid: false, error: 'Unbalanced double quotes' };
  }

  return { isValid: true };
}

/**
 * Truncate JQL for display (preview)
 */
export function truncateJql(jql: string, maxLength = 100): string {
  const trimmed = jql.trim();
  if (trimmed.length <= maxLength) {
    return trimmed;
  }
  return `${trimmed.substring(0, maxLength)}...`;
}

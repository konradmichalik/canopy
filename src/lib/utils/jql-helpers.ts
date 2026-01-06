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
 * JQL validation result with detailed error information
 */
export interface JqlValidationResult {
  isValid: boolean;
  error?: string;
  errorPosition?: number;
  suggestions?: string[];
}

/**
 * Common JQL fields for validation hints
 */
const COMMON_JQL_FIELDS = [
  'project',
  'issuetype',
  'status',
  'assignee',
  'reporter',
  'priority',
  'resolution',
  'created',
  'updated',
  'resolved',
  'due',
  'duedate',
  'summary',
  'description',
  'component',
  'fixVersion',
  'affectedVersion',
  'labels',
  'sprint',
  'parent',
  'epic',
  'text',
  'comment',
  'voter',
  'watcher',
  'category',
  'level',
  'originalEstimate',
  'remainingEstimate',
  'timeSpent',
  'worklogAuthor',
  'worklogComment',
  'worklogDate',
  'issuekey',
  'key',
  'id',
  'filter',
  'savedFilter'
];

/**
 * JQL comparison operators (for future autocomplete)
 */
const _JQL_COMPARISON_OPERATORS = ['=', '!=', '~', '!~', '>', '<', '>=', '<='];

/**
 * JQL keyword operators (for future autocomplete)
 */
const _JQL_KEYWORD_OPERATORS = ['IN', 'NOT IN', 'IS', 'IS NOT', 'WAS', 'WAS NOT', 'CHANGED'];

/**
 * JQL logical operators (for future autocomplete)
 */
const _JQL_LOGICAL_OPERATORS = ['AND', 'OR', 'NOT'];

/**
 * Common JQL functions
 */
const JQL_FUNCTIONS = [
  'currentUser()',
  'currentLogin()',
  'now()',
  'startOfDay()',
  'startOfWeek()',
  'startOfMonth()',
  'startOfYear()',
  'endOfDay()',
  'endOfWeek()',
  'endOfMonth()',
  'endOfYear()',
  'openSprints()',
  'closedSprints()',
  'futureSprints()',
  'membersOf()',
  'issueHistory()',
  'linkedIssues()',
  'subtaskIssuesFromSearchRequest()',
  'issuesWithRemoteLinksByGlobalId()',
  'votedIssues()',
  'watchedIssues()',
  'myApproval()',
  'myPending()',
  'approved()',
  'pending()',
  'cascadeOption()',
  'componentsLeadByUser()',
  'projectsLeadByUser()',
  'projectsWhereUserHasPermission()',
  'projectsWhereUserHasRole()',
  'standardIssueTypes()',
  'subTaskIssueTypes()',
  'unreleasedVersions()',
  'releasedVersions()',
  'latestReleasedVersion()',
  'earliestUnreleasedVersion()'
];

/**
 * Check for balanced delimiters (parentheses, quotes)
 */
function checkBalancedDelimiters(jql: string): JqlValidationResult {
  let parenDepth = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let lastQuotePos = -1;

  for (let i = 0; i < jql.length; i++) {
    const char = jql[i];
    const prevChar = i > 0 ? jql[i - 1] : '';

    // Skip escaped characters
    if (prevChar === '\\') continue;

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
      if (inSingleQuote) lastQuotePos = i;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
      if (inDoubleQuote) lastQuotePos = i;
    } else if (!inSingleQuote && !inDoubleQuote) {
      if (char === '(') {
        parenDepth++;
      } else if (char === ')') {
        parenDepth--;
        if (parenDepth < 0) {
          return {
            isValid: false,
            error: 'Unexpected closing parenthesis',
            errorPosition: i
          };
        }
      }
    }
  }

  if (inSingleQuote) {
    return {
      isValid: false,
      error: 'Unclosed single quote',
      errorPosition: lastQuotePos
    };
  }

  if (inDoubleQuote) {
    return {
      isValid: false,
      error: 'Unclosed double quote',
      errorPosition: lastQuotePos
    };
  }

  if (parenDepth > 0) {
    return {
      isValid: false,
      error: `Missing ${parenDepth} closing parenthes${parenDepth > 1 ? 'es' : 'is'}`
    };
  }

  return { isValid: true };
}

/**
 * Tokenize JQL for validation (simple tokenizer, for future autocomplete)
 */
function _tokenizeJql(jql: string): string[] {
  const tokens: string[] = [];
  let current = '';
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < jql.length; i++) {
    const char = jql[i];

    if ((char === '"' || char === "'") && (i === 0 || jql[i - 1] !== '\\')) {
      if (!inQuote) {
        if (current.trim()) tokens.push(current.trim());
        current = char;
        inQuote = true;
        quoteChar = char;
      } else if (char === quoteChar) {
        current += char;
        tokens.push(current);
        current = '';
        inQuote = false;
      } else {
        current += char;
      }
    } else if (inQuote) {
      current += char;
    } else if (/\s/.test(char)) {
      if (current.trim()) tokens.push(current.trim());
      current = '';
    } else if (['(', ')', ','].includes(char)) {
      if (current.trim()) tokens.push(current.trim());
      tokens.push(char);
      current = '';
    } else if (['=', '!', '~', '<', '>'].includes(char)) {
      if (current.trim()) tokens.push(current.trim());
      // Check for two-character operators
      const next = jql[i + 1];
      if (next === '=' || (char === '!' && next === '~')) {
        tokens.push(char + next);
        i++;
      } else {
        tokens.push(char);
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) tokens.push(current.trim());

  return tokens;
}

/**
 * Check for common JQL syntax errors
 */
function checkSyntaxErrors(jql: string): JqlValidationResult {
  const trimmed = jql.trim();
  const upper = trimmed.toUpperCase();

  // Check for empty query
  if (!trimmed) {
    return { isValid: false, error: 'JQL query cannot be empty' };
  }

  // Check for query starting with operator
  if (/^(AND|OR)\s/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Query cannot start with AND or OR',
      errorPosition: 0
    };
  }

  // Check for double operators (AND AND, OR OR, etc.)
  const doubleOpMatch = upper.match(/\b(AND\s+AND|OR\s+OR|AND\s+OR\s+AND|OR\s+AND\s+OR)\b/);
  if (doubleOpMatch) {
    return {
      isValid: false,
      error: 'Duplicate logical operators',
      errorPosition: upper.indexOf(doubleOpMatch[0])
    };
  }

  // Check for trailing operators
  if (/\s+(AND|OR)\s*$/i.test(trimmed)) {
    return {
      isValid: false,
      error: 'Query cannot end with AND or OR',
      errorPosition: trimmed.length - 3
    };
  }

  // Check for empty parentheses (but allow function calls like openSprints())
  const emptyParensMatch = trimmed.match(/(?<!\w)\(\s*\)/);
  if (emptyParensMatch) {
    return {
      isValid: false,
      error: 'Empty parentheses',
      errorPosition: emptyParensMatch.index ?? trimmed.indexOf('()')
    };
  }

  // Check for operator without value
  const opWithoutValue = trimmed.match(/(=|!=|~|!~|>|<|>=|<=)\s*(AND|OR|\)|$)/i);
  if (opWithoutValue) {
    return {
      isValid: false,
      error: 'Operator missing value',
      errorPosition: trimmed.indexOf(opWithoutValue[0])
    };
  }

  // Check ORDER BY syntax
  const orderByMatch = upper.match(/ORDER\s+BY\s*$/);
  if (orderByMatch) {
    return {
      isValid: false,
      error: 'ORDER BY requires a field name',
      errorPosition: trimmed.length - 8
    };
  }

  // Check for invalid ORDER BY position (in middle of query)
  const orderByIndex = upper.indexOf('ORDER BY');
  if (orderByIndex !== -1) {
    const afterOrderBy = upper.substring(orderByIndex + 8).trim();
    // Check if there's AND/OR after ORDER BY (invalid)
    if (/\b(AND|OR)\b/.test(afterOrderBy.split(/ASC|DESC/i)[0])) {
      return {
        isValid: false,
        error: 'ORDER BY must be at the end of the query',
        errorPosition: orderByIndex
      };
    }
  }

  return { isValid: true };
}

/**
 * Get field suggestions based on partial input
 */
export function getFieldSuggestions(partial: string): string[] {
  const lower = partial.toLowerCase();
  return COMMON_JQL_FIELDS.filter((field) => field.toLowerCase().startsWith(lower)).slice(0, 5);
}

/**
 * Get function suggestions based on partial input
 */
export function getFunctionSuggestions(partial: string): string[] {
  const lower = partial.toLowerCase();
  return JQL_FUNCTIONS.filter((fn) => fn.toLowerCase().startsWith(lower)).slice(0, 5);
}

/**
 * Validate basic JQL syntax (client-side validation)
 */
export function validateJql(jql: string): JqlValidationResult {
  const trimmed = jql.trim();

  if (!trimmed) {
    return { isValid: false, error: 'JQL query cannot be empty' };
  }

  // Check balanced delimiters first
  const delimiterResult = checkBalancedDelimiters(trimmed);
  if (!delimiterResult.isValid) {
    return delimiterResult;
  }

  // Check for syntax errors
  const syntaxResult = checkSyntaxErrors(trimmed);
  if (!syntaxResult.isValid) {
    return syntaxResult;
  }

  return { isValid: true };
}

/**
 * Validate JQL with extended checks (for real-time feedback)
 */
export function validateJqlExtended(jql: string): JqlValidationResult {
  const trimmed = jql.trim();

  // Allow empty for real-time (user still typing)
  if (!trimmed) {
    return { isValid: true };
  }

  // Check balanced delimiters
  const delimiterResult = checkBalancedDelimiters(trimmed);
  if (!delimiterResult.isValid) {
    return delimiterResult;
  }

  // More lenient syntax check for real-time
  // Only flag obvious errors, not incomplete queries

  // Check for empty parentheses (but allow function calls like openSprints())
  const emptyParensMatch = trimmed.match(/(?<!\w)\(\s*\)/);
  if (emptyParensMatch) {
    return {
      isValid: false,
      error: 'Empty parentheses',
      errorPosition: emptyParensMatch.index ?? trimmed.indexOf('()')
    };
  }

  // Check for double operators
  const upper = trimmed.toUpperCase();
  const doubleOpMatch = upper.match(/\b(AND\s+AND|OR\s+OR)\b/);
  if (doubleOpMatch) {
    return {
      isValid: false,
      error: 'Duplicate logical operators',
      errorPosition: upper.indexOf(doubleOpMatch[0])
    };
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

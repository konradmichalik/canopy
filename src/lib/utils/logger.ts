/**
 * Structured Console Logging Utility
 * Provides clean, categorized logging for debugging and monitoring
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogConfig {
  enabled: boolean;
  minLevel: LogLevel;
  showTimestamp: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

const LOG_STYLES = {
  prefix: 'color: #6B7280; font-weight: bold;',
  connection: 'color: #3B82F6;',
  api: 'color: #8B5CF6;',
  hierarchy: 'color: #10B981;',
  store: 'color: #F59E0B;',
  warn: 'color: #F59E0B;',
  error: 'color: #EF4444;',
  success: 'color: #10B981;',
  timing: 'color: #6B7280; font-style: italic;'
};

const ICONS = {
  connection: '\u{1F517}',
  api: '\u{1F4E1}',
  hierarchy: '\u{1F333}',
  store: '\u{1F4BE}',
  success: '\u2713',
  warn: '\u26A0\uFE0F',
  error: '\u274C',
  request: '\u2192',
  response: '\u2190'
};

class Logger {
  private config: LogConfig = {
    enabled: true,
    minLevel: 'debug',
    showTimestamp: true
  };

  private prefix = '[Canopy]';

  configure(config: Partial<LogConfig>): void {
    this.config = { ...this.config, ...config };
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[this.config.minLevel];
  }

  private getTimestamp(): string {
    if (!this.config.showTimestamp) return '';
    const now = new Date();
    return `[${now.toLocaleTimeString('de-DE')}.${now.getMilliseconds().toString().padStart(3, '0')}]`;
  }

  private formatMessage(icon: string, category: string, message: string): string {
    const timestamp = this.getTimestamp();
    return `${this.prefix} ${timestamp} ${icon} ${message}`;
  }

  // Connection Events
  connection(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    console.log(
      `%c${this.formatMessage(ICONS.connection, 'connection', message)}`,
      LOG_STYLES.connection,
      data ?? ''
    );
  }

  connectionSuccess(message: string): void {
    if (!this.shouldLog('info')) return;
    console.log(
      `%c${this.formatMessage(ICONS.success, 'connection', message)}`,
      LOG_STYLES.success
    );
  }

  // API Requests/Responses
  apiRequest(method: string, endpoint: string, details?: Record<string, unknown>): void {
    if (!this.shouldLog('debug')) return;
    console.groupCollapsed(
      `%c${this.formatMessage(ICONS.api, 'api', `${ICONS.request} ${method} ${endpoint}`)}`,
      LOG_STYLES.api
    );
    if (details) {
      Object.entries(details).forEach(([key, value]) => {
        console.log(`%c\u251C\u2500 ${key}:`, 'color: #6B7280;', value);
      });
    }
    console.groupEnd();
  }

  apiResponse(
    method: string,
    endpoint: string,
    status: number,
    duration: number,
    details?: Record<string, unknown>
  ): void {
    if (!this.shouldLog('debug')) return;
    const statusColor = status >= 200 && status < 300 ? LOG_STYLES.success : LOG_STYLES.error;
    console.groupCollapsed(
      `%c${this.formatMessage(ICONS.api, 'api', `${ICONS.response} ${method} ${endpoint}`)} %c${status} %c(${duration}ms)`,
      LOG_STYLES.api,
      statusColor,
      LOG_STYLES.timing
    );
    if (details) {
      Object.entries(details).forEach(([key, value]) => {
        console.log(`%c\u251C\u2500 ${key}:`, 'color: #6B7280;', value);
      });
    }
    console.groupEnd();
  }

  apiError(method: string, endpoint: string, error: unknown): void {
    if (!this.shouldLog('error')) return;
    console.error(
      `%c${this.formatMessage(ICONS.error, 'api', `${method} ${endpoint} failed`)}`,
      LOG_STYLES.error,
      error
    );
  }

  // Hierarchy Building
  hierarchy(message: string, details?: Record<string, unknown>): void {
    if (!this.shouldLog('info')) return;
    console.log(
      `%c${this.formatMessage(ICONS.hierarchy, 'hierarchy', message)}`,
      LOG_STYLES.hierarchy,
      details ?? ''
    );
  }

  // Store Updates
  store(storeName: string, action: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    console.log(
      `%c${this.formatMessage(ICONS.store, 'store', `[${storeName}] ${action}`)}`,
      LOG_STYLES.store,
      data ?? ''
    );
  }

  // Warnings
  warn(message: string, data?: unknown): void {
    if (!this.shouldLog('warn')) return;
    console.warn(
      `%c${this.formatMessage(ICONS.warn, 'warn', message)}`,
      LOG_STYLES.warn,
      data ?? ''
    );
  }

  // Errors
  error(message: string, error?: unknown): void {
    if (!this.shouldLog('error')) return;
    console.error(
      `%c${this.formatMessage(ICONS.error, 'error', message)}`,
      LOG_STYLES.error,
      error ?? ''
    );
  }

  // General Info
  info(message: string, data?: unknown): void {
    if (!this.shouldLog('info')) return;
    console.log(
      `%c${this.formatMessage('\u2139\uFE0F', 'info', message)}`,
      'color: #3B82F6;',
      data ?? ''
    );
  }

  // Debug
  debug(message: string, data?: unknown): void {
    if (!this.shouldLog('debug')) return;
    console.log(
      `%c${this.formatMessage('\u{1F41B}', 'debug', message)}`,
      'color: #6B7280;',
      data ?? ''
    );
  }

  // Timing utility
  time(_label: string): () => number {
    const start = performance.now();
    return () => {
      const duration = Math.round(performance.now() - start);
      return duration;
    };
  }

  // Table output for issue lists
  issueTable(issues: Array<{ key: string; summary: string; status: string; type: string }>): void {
    if (!this.shouldLog('debug')) return;
    console.table(issues);
  }
}

export const logger = new Logger();

// Disable logging in production (can be overridden)
if (import.meta.env.PROD) {
  logger.configure({ minLevel: 'warn' });
}

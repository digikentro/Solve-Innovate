type LogContext = Record<string, unknown>;

const isDev = import.meta.env.DEV;

const normalizeError = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
};

const print = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  context?: LogContext
): void => {
  if (!isDev && level === 'debug') {
    return;
  }

  const prefix = `[SI:${level.toUpperCase()}] ${message}`;
  if (context && Object.keys(context).length > 0) {
    console[level](prefix, context);
    return;
  }
  console[level](prefix);
};

export const logger = {
  debug: (message: string, context?: LogContext): void => {
    print('debug', message, context);
  },
  info: (message: string, context?: LogContext): void => {
    print('info', message, context);
  },
  warn: (message: string, context?: LogContext): void => {
    print('warn', message, context);
  },
  error: (message: string, error?: unknown, context?: LogContext): void => {
    const mergedContext: LogContext = {
      ...(context || {}),
      ...(error === undefined ? {} : { error: normalizeError(error) }),
    };
    print('error', message, mergedContext);

    if (isDev && error !== undefined && !(error instanceof Error)) {
      console.error('[SI:ERROR] Raw error payload', error);
    }
  },
};

/**
 * Structured logging utility for Lambda function
 * Outputs JSON logs for CloudWatch Logs
 */

export interface LogContext {
  userId?: string;
  cognitoSub?: string;
  triggerSource?: string;
  operation?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Structured logger class
 */
class Logger {
  /**
   * Log a message with structured context
   */
  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...context,
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
    };

    // Output as JSON for CloudWatch Logs structured logging
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }
}

/**
 * Singleton logger instance
 */
export const logger = new Logger();

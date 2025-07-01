// Error handling and resilience service for SmartSolve POC

export interface ErrorContext {
  operation: string;
  userId?: string;
  problemId?: string;
  timestamp: string;
  retryCount?: number;
  additionalData?: Record<string, any>;
}

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export class SmartSolveError extends Error {
  public readonly context: ErrorContext;
  public readonly isRetryable: boolean;
  public readonly userMessage: string;
  public readonly originalError?: Error;

  constructor(
    message: string,
    context: ErrorContext,
    isRetryable: boolean = false,
    userMessage?: string,
    originalError?: Error
  ) {
    super(message);
    this.name = 'SmartSolveError';
    this.context = context;
    this.isRetryable = isRetryable;
    this.userMessage = userMessage || 'An unexpected error occurred. Please try again.';
    this.originalError = originalError;
  }
}

export class ValidationError extends SmartSolveError {
  constructor(message: string, context: ErrorContext, userMessage?: string) {
    super(message, context, false, userMessage);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends SmartSolveError {
  constructor(message: string, context: ErrorContext, originalError?: Error) {
    super(message, context, true, 'Network connection issue. Please check your internet connection and try again.', originalError);
    this.name = 'NetworkError';
  }
}

export class APIError extends SmartSolveError {
  public readonly statusCode?: number;
  public readonly responseData?: any;

  constructor(
    message: string,
    context: ErrorContext,
    statusCode?: number,
    responseData?: any,
    isRetryable: boolean = false
  ) {
    super(
      message,
      context,
      isRetryable,
      `API request failed (${statusCode || 'unknown'}). Please try again later.`
    );
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

export class DatabaseError extends SmartSolveError {
  constructor(message: string, context: ErrorContext, originalError?: Error) {
    super(message, context, true, 'Database operation failed. Please try again.', originalError);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends SmartSolveError {
  constructor(message: string, context: ErrorContext) {
    super(message, context, false, 'Authentication failed. Please log in again.');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends SmartSolveError {
  constructor(message: string, context: ErrorContext) {
    super(message, context, true, 'Too many requests. Please wait a moment and try again.');
    this.name = 'RateLimitError';
  }
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second
  private static readonly MAX_DELAY = 30000; // 30 seconds

  /**
   * Execute a function with retry logic and exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: ErrorContext,
    maxRetries: number = this.MAX_RETRIES
  ): Promise<T> {
    let lastError: Error = new Error('Unknown error occurred');

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry if it's not a retryable error or we've reached max retries
        if (attempt === maxRetries || !this.isRetryableError(error)) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempt);
        
        // Log retry attempt
        this.logRetryAttempt(context, attempt + 1, maxRetries, delay, error);
        
        // Wait before retrying
        await this.sleep(delay);
      }
    }

    // Convert to SmartSolveError if it isn't already
    if (lastError instanceof SmartSolveError) {
      throw lastError;
    } else {
      throw new SmartSolveError(
        lastError instanceof Error ? lastError.message : String(lastError),
        context,
        false,
        'Operation failed after multiple attempts. Please try again later.',
        lastError instanceof Error ? lastError : undefined
      );
    }
  }

  /**
   * Calculate delay with exponential backoff and jitter
   */
  private static calculateDelay(attempt: number): number {
    const exponentialDelay = Math.min(
      this.BASE_DELAY * Math.pow(2, attempt),
      this.MAX_DELAY
    );
    
    // Add jitter (±25%)
    const jitter = exponentialDelay * 0.25 * (Math.random() - 0.5);
    
    return Math.max(100, exponentialDelay + jitter);
  }

  /**
   * Determine if an error is retryable
   */
  private static isRetryableError(error: unknown): boolean {
    if (error instanceof SmartSolveError) {
      return error.isRetryable;
    }

    if (error instanceof Error) {
      // Network errors are generally retryable
      if (error.name === 'NetworkError' || error.message.includes('network')) {
        return true;
      }

      // Database connection errors are retryable
      if (error.message.includes('connection') || error.message.includes('timeout')) {
        return true;
      }
    }

    // Check for HTTP status codes if error has status property
    const errorWithStatus = error as any;
    if (errorWithStatus && typeof errorWithStatus.status === 'number') {
      // HTTP 5xx errors are retryable
      if (errorWithStatus.status >= 500 && errorWithStatus.status < 600) {
        return true;
      }

      // Rate limiting errors are retryable
      if (errorWithStatus.status === 429) {
        return true;
      }
    }

    return false;
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log retry attempt
   */
  private static logRetryAttempt(
    context: ErrorContext,
    attempt: number,
    maxRetries: number,
    delay: number,
    error: unknown
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(
      `Retry attempt ${attempt}/${maxRetries} for operation "${context.operation}" after ${delay}ms delay.`,
      {
        context,
        error: errorMessage,
        timestamp: new Date().toISOString()
      }
    );
  }

  /**
   * Log error with context
   */
  static logError(error: SmartSolveError): void {
    const logData = {
      name: error.name,
      message: error.message,
      userMessage: error.userMessage,
      context: error.context,
      stack: error.stack,
      originalError: error.originalError ? {
        name: error.originalError.name,
        message: error.originalError.message,
        stack: error.originalError.stack
      } : undefined,
      timestamp: new Date().toISOString()
    };

    // In production, this would send to a logging service
    console.error('SmartSolve Error:', logData);

    // For POC, we could also store in localStorage for debugging
    try {
      const errorLog = JSON.parse(localStorage.getItem('smartsolve_error_log') || '[]');
      errorLog.push(logData);
      // Keep only last 50 errors
      if (errorLog.length > 50) {
        errorLog.splice(0, errorLog.length - 50);
      }
      localStorage.setItem('smartsolve_error_log', JSON.stringify(errorLog));
    } catch (e) {
      // Ignore localStorage errors
    }
  }

  /**
   * Handle API errors
   */
  static handleAPIError(error: any, context: ErrorContext): SmartSolveError {
    if (error.status === 401) {
      return new AuthenticationError('Unauthorized access', context);
    }
    
    if (error.status === 403) {
      return new SmartSolveError(
        'Access forbidden',
        context,
        false,
        'You do not have permission to perform this action.'
      );
    }
    
    if (error.status === 429) {
      return new RateLimitError('Rate limit exceeded', context);
    }
    
    if (error.status >= 500) {
      return new APIError(
        'Server error',
        context,
        error.status,
        error.response,
        true // Retryable
      );
    }
    
    return new APIError(
      'API request failed',
      context,
      error.status,
      error.response,
      false
    );
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: any, context: ErrorContext): SmartSolveError {
    if (error.code === '23505') { // Unique constraint violation
      return new ValidationError(
        'Duplicate entry',
        context,
        'This item already exists. Please use a different value.'
      );
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      return new ValidationError(
        'Referenced item not found',
        context,
        'The referenced item does not exist. Please check your selection.'
      );
    }
    
    if (error.code === '42P01') { // Table does not exist
      return new DatabaseError(
        'Table not found',
        context,
        error
      );
    }
    
    return new DatabaseError(
      'Database operation failed',
      context,
      error
    );
  }

  /**
   * Validate input data
   */
  static validateInput(data: any, requiredFields: string[], context: ErrorContext): void {
    const missingFields = requiredFields.filter(field => {
      const value = data[field];
      return value === undefined || value === null || value === '';
    });

    if (missingFields.length > 0) {
      throw new ValidationError(
        `Missing required fields: ${missingFields.join(', ')}`,
        context,
        `Please fill in all required fields: ${missingFields.join(', ')}`
      );
    }
  }

  /**
   * Get error log from localStorage (for debugging)
   */
  static getErrorLog(): any[] {
    try {
      return JSON.parse(localStorage.getItem('smartsolve_error_log') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear error log
   */
  static clearErrorLog(): void {
    localStorage.removeItem('smartsolve_error_log');
  }

  /**
   * Create error context
   */
  static createContext(operation: string, userId?: string, additionalData?: Record<string, any>): ErrorContext {
    return {
      operation,
      userId,
      timestamp: new Date().toISOString(),
      additionalData
    };
  }
}

// Common validation schemas
export const VALIDATION_SCHEMAS = {
  problemDescription: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 1000
  },
  
  hmwStatement: {
    required: true,
    type: 'string',
    minLength: 20,
    maxLength: 500
  },
  
  assessmentScores: {
    market_opportunity_score: { type: 'number', min: 0, max: 100 },
    innovation_potential_score: { type: 'number', min: 0, max: 100 },
    feasibility_score: { type: 'number', min: 0, max: 100 },
    impact_potential_score: { type: 'number', min: 0, max: 100 },
    india_context_score: { type: 'number', min: 0, max: 100 },
    global_relevance_score: { type: 'number', min: 0, max: 100 }
  },
  
  sourceVerification: {
    title: { required: true, type: 'string', minLength: 5, maxLength: 200 },
    url: { required: true, type: 'string', pattern: /^https?:\/\/.+/ },
    tier: { required: true, type: 'number', min: 1, max: 5 },
    biasScore: { required: true, type: 'number', min: 0, max: 100 }
  }
};

// Initialize global error handling
// ErrorHandler.setupGlobalErrorHandling();

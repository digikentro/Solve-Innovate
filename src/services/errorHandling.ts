export interface ErrorContext {
  operation: string;
  userId?: string;
  timestamp: string;
}

export class ValidationError extends Error {
  constructor(message: string, context: ErrorContext) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  public readonly statusCode?: number;
  public readonly responseData?: any;

  constructor(
    message: string,
    statusCode?: number,
    responseData?: any
  ) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
    this.responseData = responseData;
  }
}

export class DatabaseError extends Error {
  constructor(message: string, originalError?: Error) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ErrorHandler {
  private static readonly MAX_RETRIES = 3;
  private static readonly BASE_DELAY = 1000; // 1 second

  /**
   * Execute a function with retry logic
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
        
        if (attempt === maxRetries) {
          break;
        }

        // Simple delay with exponential backoff
        const delay = this.BASE_DELAY * Math.pow(2, attempt);
        await this.sleep(delay);
      }
    }

    throw lastError;
  }

  /**
   * Sleep for a given number of milliseconds
   */
  private static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Handle API errors
   */
  static handleAPIError(error: any, context: ErrorContext): Error {
    if (error.status === 401) {
      return new AuthenticationError('Unauthorized access');
    }
    
    if (error.status === 403) {
      return new Error('Access forbidden');
    }
    
    if (error.status === 429) {
      return new RateLimitError('Rate limit exceeded');
    }
    
    if (error.status >= 500) {
      return new APIError('Server error', error.status, error.response);
    }
    
    return new APIError('API request failed', error.status, error.response);
  }

  /**
   * Handle database errors
   */
  static handleDatabaseError(error: any, context: ErrorContext): Error {
    if (error.code === '23505') { // Unique constraint violation
      return new ValidationError('This item already exists', context);
    }
    
    if (error.code === '23503') { // Foreign key constraint violation
      return new ValidationError('Referenced item not found', context);
    }
    
    return new DatabaseError('Database operation failed', error);
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
        context
      );
    }
  }

  /**
   * Create error context
   */
  static createContext(operation: string, userId?: string): ErrorContext {
    return {
      operation,
      userId,
      timestamp: new Date().toISOString()
    };
  }
}

 
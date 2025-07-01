// Basic security service for SmartSolve POC

import { supabase } from '@/lib/supabase';

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  keyGenerator?: (identifier: string) => string;
}

export interface SecurityConfig {
  rateLimits: {
    api: RateLimitConfig;
    auth: RateLimitConfig;
    hmwGeneration: RateLimitConfig;
  };
  inputValidation: {
    maxStringLength: number;
    allowedFileTypes: string[];
    maxFileSize: number;
  };
}

export class SecurityService {
  private static readonly STORAGE_PREFIX = 'smartsolve_security_';
  private static readonly DEFAULT_CONFIG: SecurityConfig = {
    rateLimits: {
      api: { maxRequests: 100, windowMs: 60 * 60 * 1000 }, // 100 requests per hour
      auth: { maxRequests: 5, windowMs: 15 * 60 * 1000 },  // 5 attempts per 15 minutes
      hmwGeneration: { maxRequests: 20, windowMs: 60 * 60 * 1000 } // 20 generations per hour
    },
    inputValidation: {
      maxStringLength: 10000,
      allowedFileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
      maxFileSize: 5 * 1024 * 1024 // 5MB
    }
  };

  /**
   * Check rate limit for a specific operation
   */
  static checkRateLimit(
    identifier: string,
    operation: keyof SecurityConfig['rateLimits']
  ): { allowed: boolean; remaining: number; resetTime: number } {
    try {
      const config = this.DEFAULT_CONFIG.rateLimits[operation];
      const key = this.getRateLimitKey(identifier, operation);
      const now = Date.now();
      
      // Get current requests
      const requests = this.getRateLimitRequests(key);
      const validRequests = requests.filter(timestamp => 
        now - timestamp < config.windowMs
      );

      const remaining = Math.max(0, config.maxRequests - validRequests.length);
      const allowed = remaining > 0;

      if (allowed) {
        // Add current request
        validRequests.push(now);
        this.setRateLimitRequests(key, validRequests);
      } else {
        this.updateSecurityStats('rateLimitBlocks');
      }

      const resetTime = now + config.windowMs;

      return {
        allowed,
        remaining,
        resetTime
      };
    } catch (error) {
      console.warn('Rate limit check error:', error);
      // Allow request if rate limiting fails
      return { allowed: true, remaining: 999, resetTime: Date.now() };
    }
  }

  /**
   * Validate input data
   */
  static validateInput(data: any, rules: {
    required?: string[];
    maxLength?: Record<string, number>;
    pattern?: Record<string, RegExp>;
    custom?: (data: any) => { valid: boolean; message?: string };
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    try {
      // Check required fields
      if (rules.required) {
        rules.required.forEach(field => {
          if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            errors.push(`${field} is required`);
          }
        });
      }

      // Check max length
      if (rules.maxLength) {
        Object.entries(rules.maxLength).forEach(([field, maxLen]) => {
          if (data[field] && typeof data[field] === 'string' && data[field].length > maxLen) {
            errors.push(`${field} must be less than ${maxLen} characters`);
          }
        });
      }

      // Check patterns
      if (rules.pattern) {
        Object.entries(rules.pattern).forEach(([field, pattern]) => {
          if (data[field] && typeof data[field] === 'string' && !pattern.test(data[field])) {
            errors.push(`${field} format is invalid`);
          }
        });
      }

      // Custom validation
      if (rules.custom) {
        const customResult = rules.custom(data);
        if (!customResult.valid && customResult.message) {
          errors.push(customResult.message);
        }
      }

      // General security checks
      const securityErrors = this.performSecurityChecks(data);
      errors.push(...securityErrors);

      if (errors.length > 0) {
        this.updateSecurityStats('validationErrors');
      }

    } catch (error) {
      console.warn('Input validation error:', error);
      errors.push('Input validation failed');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Sanitize input data
   */
  static sanitizeInput(data: any): any {
    if (typeof data === 'string') {
      return this.sanitizeString(data);
    }
    
    if (Array.isArray(data)) {
      return data.map(item => this.sanitizeInput(item));
    }
    
    if (typeof data === 'object' && data !== null) {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(data)) {
        sanitized[key] = this.sanitizeInput(value);
      }
      return sanitized;
    }
    
    return data;
  }

  /**
   * Validate file upload
   */
  static validateFile(file: File): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const config = this.DEFAULT_CONFIG.inputValidation;

    // Check file size
    if (file.size > config.maxFileSize) {
      errors.push(`File size must be less than ${config.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    if (!config.allowedFileTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`);
    }

    // Check for potentially dangerous file extensions
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.com', '.pif', '.scr', '.vbs', '.js'];
    const fileName = file.name.toLowerCase();
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      errors.push('File type is not allowed for security reasons');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate secure random string
   */
  static generateSecureToken(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    // Use crypto.getRandomValues if available, otherwise fallback
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const array = new Uint8Array(length);
      crypto.getRandomValues(array);
      for (let i = 0; i < length; i++) {
        result += chars[array[i] % chars.length];
      }
    } else {
      // Fallback for environments without crypto
      for (let i = 0; i < length; i++) {
        result += chars[Math.floor(Math.random() * chars.length)];
      }
    }
    
    return result;
  }

  /**
   * Hash sensitive data (simple implementation for POC)
   */
  static hashData(data: string): string {
    // In production, use proper hashing libraries
    // This is a simple hash for POC purposes
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      const char = data.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Check if request is from allowed origin
   */
  static isAllowedOrigin(origin: string): boolean {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://smartsolve.vercel.app',
      'https://smartsolve.netlify.app'
    ];
    
    return allowedOrigins.includes(origin);
  }

  /**
   * Validate API key format
   */
  static validateApiKey(apiKey: string): boolean {
    // Basic API key validation for POC
    return Boolean(apiKey && apiKey.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(apiKey));
  }

  /**
   * Get rate limit key
   */
  private static getRateLimitKey(identifier: string, operation: string): string {
    return `${this.STORAGE_PREFIX}rate_limit_${operation}_${this.hashData(identifier)}`;
  }

  /**
   * Get rate limit requests from storage
   */
  private static getRateLimitRequests(key: string): number[] {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Rate limit storage read error:', error);
      return [];
    }
  }

  /**
   * Set rate limit requests in storage
   */
  private static setRateLimitRequests(key: string, requests: number[]): void {
    try {
      localStorage.setItem(key, JSON.stringify(requests));
    } catch (error) {
      console.warn('Rate limit storage write error:', error);
    }
  }

  /**
   * Sanitize string input
   */
  private static sanitizeString(str: string): string {
    return str
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim();
  }

  /**
   * Perform security checks on data
   */
  private static performSecurityChecks(data: any): string[] {
    const errors: string[] = [];

    // Check for potential XSS
    const dataStr = JSON.stringify(data).toLowerCase();
    const xssPatterns = [
      'javascript:',
      'onload=',
      'onerror=',
      'onclick=',
      '<script',
      'data:text/html',
      'vbscript:'
    ];

    xssPatterns.forEach(pattern => {
      if (dataStr.includes(pattern)) {
        errors.push('Potentially unsafe content detected');
        this.updateSecurityStats('securityViolations');
      }
    });

    // Check for SQL injection patterns (basic)
    const sqlPatterns = [
      'union select',
      'drop table',
      'delete from',
      'insert into',
      'update set'
    ];

    sqlPatterns.forEach(pattern => {
      if (dataStr.includes(pattern)) {
        errors.push('Invalid input pattern detected');
        this.updateSecurityStats('securityViolations');
      }
    });

    return errors;
  }

  /**
   * Clear rate limit data for testing
   */
  static clearRateLimitData(): void {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Rate limit clear error:', error);
    }
  }

  /**
   * Get security statistics
   */
  static getSecurityStats(): {
    rateLimitBlocks: number;
    validationErrors: number;
    securityViolations: number;
  } {
    try {
      const stats = localStorage.getItem(`${this.STORAGE_PREFIX}stats`);
      return stats ? JSON.parse(stats) : {
        rateLimitBlocks: 0,
        validationErrors: 0,
        securityViolations: 0
      };
    } catch (error) {
      console.warn('Security stats read error:', error);
      return {
        rateLimitBlocks: 0,
        validationErrors: 0,
        securityViolations: 0
      };
    }
  }

  /**
   * Update security statistics
   */
  private static updateSecurityStats(type: 'rateLimitBlocks' | 'validationErrors' | 'securityViolations'): void {
    try {
      const stats = this.getSecurityStats();
      stats[type]++;
      localStorage.setItem(`${this.STORAGE_PREFIX}stats`, JSON.stringify(stats));
    } catch (error) {
      console.warn('Security stats update error:', error);
    }
  }

  // Authentication check
  static async checkAuthentication(): Promise<{ authenticated: boolean; user?: any }> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        return { authenticated: false };
      }

      return { authenticated: true, user };
    } catch (error) {
      console.warn('Authentication check failed:', error);
      return { authenticated: false };
    }
  }

  // Authorization check
  static async checkAuthorization(
    userId: string,
    resourceId: string,
    resourceType: 'project' | 'assessment' | 'profile'
  ): Promise<{ authorized: boolean; reason?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { authorized: false, reason: 'Not authenticated' };
      }

      // Check if user owns the resource
      const { data, error } = await supabase
        .from(resourceType === 'project' ? 'projects' : 
              resourceType === 'assessment' ? 'enhanced_scoring' : 'profiles')
        .select('user_id')
        .eq('id', resourceId)
        .single();

      if (error || !data) {
        return { authorized: false, reason: 'Resource not found' };
      }

      if (data.user_id !== user.id) {
        return { authorized: false, reason: 'Not authorized' };
      }

      return { authorized: true };
    } catch (error) {
      console.warn('Authorization check failed:', error);
      return { authorized: false, reason: 'Authorization check failed' };
    }
  }

  // CSRF protection (basic implementation)
  static generateCSRFToken(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  static validateCSRFToken(token: string, storedToken: string): boolean {
    return token === storedToken;
  }

  // Security headers helper
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';"
    };
  }

  // Log security events
  static async logSecurityEvent(
    event: string,
    details: any,
    userId?: string,
    ip?: string
  ): Promise<void> {
    try {
      const securityLog = {
        event,
        details: JSON.stringify(details),
        user_id: userId,
        ip_address: ip,
        timestamp: new Date().toISOString()
      };

      // Store in Supabase (you might want to create a security_logs table)
      console.log('Security Event:', securityLog);
      
      // In a real implementation, you'd store this in a dedicated table
      // await supabase.from('security_logs').insert([securityLog]);
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }
}

// Common validation schemas
export const SECURITY_SCHEMAS = {
  problemInput: {
    description: { required: true, type: 'string', minLength: 10, maxLength: 1000, sanitize: true },
    sector: { required: true, type: 'string', pattern: /^(social_impact|business)$/ },
    category: { required: false, type: 'string', maxLength: 100, sanitize: true }
  },
  
  assessmentInput: {
    problem_id: { required: true, type: 'string' },
    market_opportunity_score: { required: true, type: 'number', min: 0, max: 100 },
    innovation_potential_score: { required: true, type: 'number', min: 0, max: 100 },
    feasibility_score: { required: true, type: 'number', min: 0, max: 100 },
    impact_potential_score: { required: true, type: 'number', min: 0, max: 100 },
    india_context_score: { required: true, type: 'number', min: 0, max: 100 },
    global_relevance_score: { required: true, type: 'number', min: 0, max: 100 }
  },
  
  sourceVerificationInput: {
    title: { required: true, type: 'string', minLength: 5, maxLength: 200, sanitize: true },
    url: { required: true, type: 'string', isUrl: true },
    tier: { required: true, type: 'number', min: 1, max: 5 },
    biasScore: { required: true, type: 'number', min: 0, max: 100 }
  }
};

// Rate limit configurations for different operations
export const RATE_LIMIT_CONFIGS = {
  HMW_GENERATION: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  ASSESSMENT_CREATION: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute
  SOURCE_VERIFICATION: { maxRequests: 50, windowMs: 60000 }, // 50 requests per minute
  API_CALLS: { maxRequests: 100, windowMs: 60000 } // 100 requests per minute
}; 
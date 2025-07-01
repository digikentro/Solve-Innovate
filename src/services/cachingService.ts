// Basic caching service for SmartSolve POC using Supabase

import { supabase } from '@/lib/supabase';

export enum CACHE_NAMESPACES {
  USER_PROFILE = 'user_profile',
  PROJECTS = 'projects',
  ASSESSMENTS = 'assessments',
  SOURCES = 'sources',
  HMW_GENERATION = 'hmw_generation',
  IOS_SCORES = 'ios_scores'
}

export enum CACHE_TTL {
  SHORT = 5 * 60 * 1000,    // 5 minutes
  MEDIUM = 30 * 60 * 1000,  // 30 minutes
  LONG = 2 * 60 * 60 * 1000, // 2 hours
  DAY = 24 * 60 * 60 * 1000  // 24 hours
}

export interface CacheOptions {
  namespace: CACHE_NAMESPACES;
  ttl: CACHE_TTL;
  key?: string;
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
  namespace: string;
}

export class CachingService {
  private static readonly STORAGE_PREFIX = 'smartsolve_cache_';
  private static readonly CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data
   */
  static async get<T>(key: string, options: CacheOptions): Promise<T | null> {
    try {
      const fullKey = this.getFullKey(key, options.namespace);
      const cached = localStorage.getItem(fullKey);
      
      if (!cached) {
        return null;
      }

      const entry: CacheEntry<T> = JSON.parse(cached);
      
      // Check if cache is expired
      if (this.isExpired(entry)) {
        this.remove(key, options.namespace);
        return null;
      }

      return entry.data;
    } catch (error) {
      console.warn('Cache read error:', error);
      return null;
    }
  }

  /**
   * Set cached data
   */
  static async set<T>(key: string, data: T, options: CacheOptions): Promise<void> {
    try {
      const fullKey = this.getFullKey(key, options.namespace);
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        ttl: options.ttl,
        namespace: options.namespace
      };

      localStorage.setItem(fullKey, JSON.stringify(entry));
      
      // Schedule cleanup
      this.scheduleCleanup();
    } catch (error) {
      console.warn('Cache write error:', error);
      // If localStorage is full, try to clean up and retry
      if (error instanceof Error && error.name === 'QuotaExceededError') {
        this.cleanup();
        try {
          const fullKey = this.getFullKey(key, options.namespace);
          const entry: CacheEntry<T> = {
            data,
            timestamp: Date.now(),
            ttl: options.ttl,
            namespace: options.namespace
          };
          localStorage.setItem(fullKey, JSON.stringify(entry));
        } catch (retryError) {
          console.error('Cache write failed even after cleanup:', retryError);
        }
      }
    }
  }

  /**
   * Remove cached data
   */
  static remove(key: string, namespace: CACHE_NAMESPACES): void {
    try {
      const fullKey = this.getFullKey(key, namespace);
      localStorage.removeItem(fullKey);
    } catch (error) {
      console.warn('Cache remove error:', error);
    }
  }

  /**
   * Clear all cached data for a namespace
   */
  static clearNamespace(namespace: CACHE_NAMESPACES): void {
    try {
      const keys = Object.keys(localStorage);
      const namespacePrefix = this.getFullKey('', namespace);
      
      keys.forEach(key => {
        if (key.startsWith(namespacePrefix)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache namespace clear error:', error);
    }
  }

  /**
   * Clear all cached data
   */
  static clearAll(): void {
    try {
      const keys = Object.keys(localStorage);
      
      keys.forEach(key => {
        if (key.startsWith(this.STORAGE_PREFIX)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache clear all error:', error);
    }
  }

  /**
   * Get cache statistics
   */
  static getStats(): {
    totalEntries: number;
    totalSize: number;
    namespaceStats: Record<string, { count: number; size: number }>;
    expiredEntries: number;
  } {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      
      let totalSize = 0;
      let expiredEntries = 0;
      const namespaceStats: Record<string, { count: number; size: number }> = {};

      cacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            const size = new Blob([cached]).size;
            
            if (this.isExpired(entry)) {
              expiredEntries++;
            } else {
              totalSize += size;
              
              if (!namespaceStats[entry.namespace]) {
                namespaceStats[entry.namespace] = { count: 0, size: 0 };
              }
              namespaceStats[entry.namespace].count++;
              namespaceStats[entry.namespace].size += size;
            }
          }
        } catch (error) {
          // Skip invalid entries
        }
      });

      return {
        totalEntries: cacheKeys.length - expiredEntries,
        totalSize,
        namespaceStats,
        expiredEntries
      };
    } catch (error) {
      console.warn('Cache stats error:', error);
      return {
        totalEntries: 0,
        totalSize: 0,
        namespaceStats: {},
        expiredEntries: 0
      };
    }
  }

  /**
   * Check if cache entry is expired
   */
  private static isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Get full cache key with namespace
   */
  private static getFullKey(key: string, namespace: CACHE_NAMESPACES): string {
    return `${this.STORAGE_PREFIX}${namespace}:${key}`;
  }

  /**
   * Clean up expired cache entries
   */
  private static cleanup(): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      
      cacheKeys.forEach(key => {
        try {
          const cached = localStorage.getItem(key);
          if (cached) {
            const entry: CacheEntry<any> = JSON.parse(cached);
            if (this.isExpired(entry)) {
              localStorage.removeItem(key);
            }
          }
        } catch (error) {
          // Remove invalid entries
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache cleanup error:', error);
    }
  }

  /**
   * Schedule periodic cleanup
   */
  private static scheduleCleanup(): void {
    // Only schedule if not already scheduled
    if (!(window as any).__smartsolve_cache_cleanup_scheduled) {
      (window as any).__smartsolve_cache_cleanup_scheduled = true;
      
      setInterval(() => {
        this.cleanup();
      }, this.CLEANUP_INTERVAL);
    }
  }

  /**
   * Cache wrapper for expensive operations
   */
  static withCache<T>(
    key: string,
    options: CacheOptions,
    operation: () => Promise<T>
  ): Promise<T> {
    return new Promise(async (resolve, reject) => {
      try {
        // Try to get from cache first
        const cached = await this.get<T>(key, options);
        if (cached !== null) {
          resolve(cached);
          return;
        }

        // Execute operation
        const result = await operation();
        
        // Cache the result
        await this.set(key, result, options);
        
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Invalidate cache entries by pattern
   */
  static invalidatePattern(pattern: string, namespace?: CACHE_NAMESPACES): void {
    try {
      const keys = Object.keys(localStorage);
      const cacheKeys = keys.filter(key => key.startsWith(this.STORAGE_PREFIX));
      
      cacheKeys.forEach(key => {
        const matchesPattern = key.includes(pattern);
        const matchesNamespace = !namespace || key.includes(`${namespace}:`);
        
        if (matchesPattern && matchesNamespace) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Cache invalidate pattern error:', error);
    }
  }

  /**
   * Preload cache with data
   */
  static async preload<T>(
    key: string,
    data: T,
    options: CacheOptions
  ): Promise<void> {
    await this.set(key, data, options);
  }

  /**
   * Get cache entry info without loading data
   */
  static getEntryInfo(key: string, namespace: CACHE_NAMESPACES): {
    exists: boolean;
    timestamp?: number;
    ttl?: number;
    isExpired?: boolean;
  } | null {
    try {
      const fullKey = this.getFullKey(key, namespace);
      const cached = localStorage.getItem(fullKey);
      
      if (!cached) {
        return { exists: false };
      }

      const entry: CacheEntry<any> = JSON.parse(cached);
      
      return {
        exists: true,
        timestamp: entry.timestamp,
        ttl: entry.ttl,
        isExpired: this.isExpired(entry)
      };
    } catch (error) {
      console.warn('Cache entry info error:', error);
      return null;
    }
  }
} 
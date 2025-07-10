import { supabase } from '@/lib/supabase';
import { ErrorHandler, SmartSolveError, ErrorContext } from './errorHandling';
import { CachingService, CACHE_NAMESPACES, CACHE_TTL } from './cachingService';
import { SecurityService } from './securityService';
import type { Project, ProjectInput } from '@/types/project';

export interface CreateProjectData {
  title: string;
  description?: string;
  tags?: string[];
  status?: string;
}

export class ProjectService {
  /**
   * Create a new project with validation and security checks
   */
  static async createProject(data: CreateProjectData, userId: string): Promise<Project> {
    const context: ErrorContext = {
      operation: 'create_project',
      userId,
      timestamp: new Date().toISOString()
    };

    try {
      // Security validation
      const securityValidation = SecurityService.validateInput(data, {
        required: ['title'],
        maxLength: {
          title: 200
        }
      });

      if (!securityValidation.valid) {
        throw new SmartSolveError(
          'Project validation failed',
          context,
          false,
          `Please check your input: ${securityValidation.errors.join(', ')}`
        );
      }

      // Rate limiting
      const rateLimit = SecurityService.checkRateLimit(userId, 'api');
      if (!rateLimit.allowed) {
        throw new SmartSolveError(
          'Rate limit exceeded',
          context,
          true,
          'Too many requests. Please wait a moment and try again.'
        );
      }

      // Sanitize input
      const sanitizedData = SecurityService.sanitizeInput(data);

      // Create project with retry logic
      const project = await ErrorHandler.withRetry(
        async () => {
          const { data: projectData, error } = await supabase
      .from('projects')
      .insert([{
              ...sanitizedData,
              user_id: userId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
      }])
      .select()
      .single();

          if (error) {
            throw new SmartSolveError(
              'Failed to create project',
              context,
              true,
              'Unable to create project. Please try again.'
            );
          }

          return projectData;
        },
        context
      );

      // Clear related cache
      CachingService.clearNamespace(CACHE_NAMESPACES.PROJECTS);

      return project;
    } catch (error) {
      if (error instanceof SmartSolveError) {
        throw error;
      }
      throw new SmartSolveError(
        'Project creation failed',
        context,
        true,
        'An unexpected error occurred. Please try again.'
      );
    }
  }

  /**
   * Get user projects with caching
   */
  static async getUserProjects(userId: string): Promise<Project[]> {
    const context: ErrorContext = {
      operation: 'get_user_projects',
      userId,
      timestamp: new Date().toISOString()
    };

    return CachingService.withCache(
      `user_projects_${userId}`,
      {
        namespace: CACHE_NAMESPACES.PROJECTS,
        ttl: CACHE_TTL.MEDIUM
      },
      async () => {
        return ErrorHandler.withRetry(
          async () => {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

            if (error) {
              throw new SmartSolveError(
                'Failed to fetch projects',
                context,
                true,
                'Unable to load projects. Please try again.'
              );
            }

            return data || [];
  },
          context
        );
      }
    );
  }

  /**
   * Get project by ID with caching
   */
  static async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const context: ErrorContext = {
      operation: 'get_project_by_id',
      userId,
      timestamp: new Date().toISOString()
    };

    return CachingService.withCache(
      `project_${projectId}`,
      {
        namespace: CACHE_NAMESPACES.PROJECTS,
        ttl: CACHE_TTL.MEDIUM
      },
      async () => {
        return ErrorHandler.withRetry(
          async () => {
    const { data, error } = await supabase
              .from('projects')
              .select('*')
              .eq('id', projectId)
              .eq('user_id', userId)
              .single();

            if (error) {
              if (error.code === 'PGRST116') {
                return null; // Not found
              }
              throw new SmartSolveError(
                'Failed to fetch project',
                context,
                true,
                'Unable to load project. Please try again.'
              );
            }

            return data;
          },
          context
        );
      }
    );
  }

  /**
   * Update project with validation
   */
  static async updateProject(
    projectId: string,
    data: Partial<CreateProjectData>,
    userId: string
  ): Promise<Project> {
    const context: ErrorContext = {
      operation: 'update_project',
      userId,
      timestamp: new Date().toISOString()
    };

    try {
      // Security validation
      const securityValidation = SecurityService.validateInput(data, {
        maxLength: {
          title: 200
        }
      });

      if (!securityValidation.valid) {
        throw new SmartSolveError(
          'Project validation failed',
          context,
          false,
          `Please check your input: ${securityValidation.errors.join(', ')}`
        );
      }

      // Rate limiting
      const rateLimit = SecurityService.checkRateLimit(userId, 'api');
      if (!rateLimit.allowed) {
        throw new SmartSolveError(
          'Rate limit exceeded',
          context,
          true,
          'Too many requests. Please wait a moment and try again.'
        );
      }

      // Sanitize input
      const sanitizedData = SecurityService.sanitizeInput(data);

      // Update project with retry logic
      const project = await ErrorHandler.withRetry(
        async () => {
          const { data: projectData, error } = await supabase
      .from('projects')
      .update({
              ...sanitizedData,
              updated_at: new Date().toISOString()
      })
            .eq('id', projectId)
            .eq('user_id', userId)
      .select()
      .single();

          if (error) {
            throw new SmartSolveError(
              'Failed to update project',
              context,
              true,
              'Unable to update project. Please try again.'
            );
          }

          return projectData;
        },
        context
      );

      // Clear related cache
      CachingService.remove(`project_${projectId}`, CACHE_NAMESPACES.PROJECTS);
      CachingService.invalidatePattern(`user_projects_${userId}`, CACHE_NAMESPACES.PROJECTS);

      return project;
    } catch (error) {
      if (error instanceof SmartSolveError) {
        throw error;
      }
      throw new SmartSolveError(
        'Project update failed',
        context,
        true,
        'An unexpected error occurred. Please try again.'
      );
    }
  }

  /**
   * Delete project
   */
  static async deleteProject(projectId: string, userId: string): Promise<void> {
    const context: ErrorContext = {
      operation: 'delete_project',
      userId,
      timestamp: new Date().toISOString()
    };

    try {
      // Rate limiting
      const rateLimit = SecurityService.checkRateLimit(userId, 'api');
      if (!rateLimit.allowed) {
        throw new SmartSolveError(
          'Rate limit exceeded',
          context,
          true,
          'Too many requests. Please wait a moment and try again.'
        );
      }

      await ErrorHandler.withRetry(
        async () => {
    const { error } = await supabase
      .from('projects')
      .delete()
            .eq('id', projectId)
            .eq('user_id', userId);

          if (error) {
            throw new SmartSolveError(
              'Failed to delete project',
              context,
              true,
              'Unable to delete project. Please try again.'
            );
          }
        },
        context
      );

      // Clear related cache
      CachingService.remove(`project_${projectId}`, CACHE_NAMESPACES.PROJECTS);
      CachingService.invalidatePattern(`user_projects_${userId}`, CACHE_NAMESPACES.PROJECTS);
    } catch (error) {
      if (error instanceof SmartSolveError) {
        throw error;
      }
      throw new SmartSolveError(
        'Project deletion failed',
        context,
        true,
        'An unexpected error occurred. Please try again.'
      );
    }
  }

  /**
   * Search projects with caching
   */
  static async searchProjects(
    userId: string,
    query: string
  ): Promise<Project[]> {
    const context: ErrorContext = {
      operation: 'search_projects',
      userId,
      timestamp: new Date().toISOString()
    };

    // Sanitize search query
    const sanitizedQuery = SecurityService.sanitizeInput(query);

    return CachingService.withCache(
      `search_${userId}_${sanitizedQuery}`,
      {
        namespace: CACHE_NAMESPACES.PROJECTS,
        ttl: CACHE_TTL.SHORT
      },
      async () => {
        return ErrorHandler.withRetry(
          async () => {
            const { data, error } = await supabase
              .from('projects')
              .select('*')
              .eq('user_id', userId)
              .ilike('title', `%${sanitizedQuery}%`)
              .order('created_at', { ascending: false });

            if (error) {
              throw new SmartSolveError(
                'Failed to search projects',
                context,
                true,
                'Unable to search projects. Please try again.'
              );
            }

            return data || [];
          },
          context
        );
      }
    );
  }

  /**
   * Get project statistics
   */
  static async getProjectStats(userId: string): Promise<{
    total: number;
    byStatus: Record<string, number>;
    recentCount: number;
  }> {
    const context: ErrorContext = {
      operation: 'get_project_stats',
      userId,
      timestamp: new Date().toISOString()
    };

    return CachingService.withCache(
      `project_stats_${userId}`,
      {
        namespace: CACHE_NAMESPACES.PROJECTS,
        ttl: CACHE_TTL.MEDIUM
      },
      async () => {
        return ErrorHandler.withRetry(
          async () => {
            const { data, error } = await supabase
              .from('projects')
              .select('status, created_at')
              .eq('user_id', userId);

            if (error) {
              throw new SmartSolveError(
                'Failed to fetch project stats',
                context,
                true,
                'Unable to load project statistics. Please try again.'
              );
            }

            const projects = data || [];
            const byStatus = projects.reduce((acc, project) => {
              acc[project.status] = (acc[project.status] || 0) + 1;
              return acc;
            }, {} as Record<string, number>);

            const oneWeekAgo = new Date();
            oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
            const recentCount = projects.filter(project => 
              new Date(project.created_at) > oneWeekAgo
            ).length;

            return {
              total: projects.length,
              byStatus,
              recentCount
            };
          },
          context
        );
      }
    );
  }
}

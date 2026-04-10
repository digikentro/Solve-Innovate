import { supabase } from '@/lib/supabase';
import { ErrorHandler, ErrorContext } from './errorHandling';
import { SecurityService } from './securityService';
import type { Project } from '@/types/project';

export class ProjectService {
  static async createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>, userId: string): Promise<Project> {
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
        throw new Error(
          `Please check your input: ${securityValidation.errors.join(', ')}`
        );
      }

      // Rate limiting
      const rateLimit = SecurityService.checkRateLimit(userId, 'api');
      if (!rateLimit.allowed) {
        throw new Error('Too many requests. Please wait a moment and try again.');
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
            throw new Error('Unable to create project. Please try again.');
          }

          return projectData;
        },
        context
      );

      return project;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Get user projects (no caching)
   */
  static async getUserProjects(userId: string): Promise<Project[]> {
    const context: ErrorContext = {
      operation: 'get_user_projects',
      userId,
      timestamp: new Date().toISOString()
    };

    return ErrorHandler.withRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error('Unable to load projects. Please try again.');
        }

        return data || [];
      },
      context
    );
  }

  /**
   * Get project by ID
   */
  static async getProjectById(projectId: string, userId: string): Promise<Project | null> {
    const context: ErrorContext = {
      operation: 'get_project_by_id',
      userId,
      timestamp: new Date().toISOString()
    };

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
            return null; // Project not found
          }
          throw new Error('Unable to load project. Please try again.');
        }

        return data;
      },
      context
    );
  }

  /**
   * Update project
   */
  static async updateProject(
    projectId: string,
    data: Partial<Omit<Project, 'id' | 'created_at' | 'user_id'>>,
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
        required: [],
        maxLength: {
          title: 200
        }
      });

      if (!securityValidation.valid) {
        throw new Error(
          `Please check your input: ${securityValidation.errors.join(', ')}`
        );
      }

      // Rate limiting
      const rateLimit = SecurityService.checkRateLimit(userId, 'api');
      if (!rateLimit.allowed) {
        throw new Error('Too many requests. Please wait a moment and try again.');
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
            throw new Error('Unable to update project. Please try again.');
          }

          return projectData;
        },
        context
      );

      return project;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
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
        throw new Error('Too many requests. Please wait a moment and try again.');
      }

      await ErrorHandler.withRetry(
        async () => {
          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId)
            .eq('user_id', userId);

          if (error) {
            throw new Error('Unable to delete project. Please try again.');
          }
        },
        context
      );
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('An unexpected error occurred. Please try again.');
    }
  }

  /**
   * Search projects by title
   */
  static async searchProjects(query: string, userId: string): Promise<Project[]> {
    const context: ErrorContext = {
      operation: 'search_projects',
      userId,
      timestamp: new Date().toISOString()
    };

    // Sanitize search query
    const sanitizedQuery = SecurityService.sanitizeInput(query);

    return ErrorHandler.withRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .ilike('title', `%${sanitizedQuery}%`)
          .order('created_at', { ascending: false });

        if (error) {
          throw new Error('Unable to search projects. Please try again.');
        }

        return data || [];
      },
      context
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

    return ErrorHandler.withRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('status, created_at')
          .eq('user_id', userId);

        if (error) {
          throw new Error('Unable to load project statistics. Please try again.');
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

  /**
   * Get chat history for a project (Provide Your Extreme User flow)
   */
  static async getProjectChatHistory(projectId: string, userId: string): Promise<Array<{
    user: string;
    assistant: string;
    generated_at: string;
  }>> {
    const context: ErrorContext = {
      operation: 'get_project_chat_history',
      userId,
      timestamp: new Date().toISOString()
    };

    return ErrorHandler.withRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('chatbox')
          .eq('id', projectId)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            throw new Error('Project not found');
          }
          throw new Error('Unable to load chat history. Please try again.');
        }

        // Return the chatbox data or empty array if null
        return data?.chatbox || [];
      },
      context
    );
  }

  /**
   * Get chat history for a project (Select the User / Extreme User flow)
   * Supports both the old flat-array format and the new keyed multi-user map.
   */
  static async getProjectChatboxExtreUserHistory(
    projectId: string,
    userId: string,
    userKey?: string
  ): Promise<Array<{ user: string; assistant: string; generated_at: string }>> {
    const context: ErrorContext = {
      operation: 'get_project_chatbox_extre_user_history',
      userId,
      timestamp: new Date().toISOString()
    };

    return ErrorHandler.withRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('chatbox_extreuser')
          .eq('id', projectId)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') throw new Error('Project not found');
          throw new Error('Unable to load chat history. Please try again.');
        }

        const raw = data?.chatbox_extreuser;
        if (!raw) return [];

        // New keyed map format: { user_abc123: { name, created_at, messages: [...] } }
        if (userKey && typeof raw === 'object' && !Array.isArray(raw) && raw[userKey]) {
          return raw[userKey].messages ?? [];
        }

        // Old flat-array format: [{ user, assistant, generated_at }]
        if (Array.isArray(raw)) return raw;

        return [];
      },
      context
    );
  }

  /**
   * Get the full multi-user extreme user map from chatbox_extreuser.
   * Returns a Record<userKey, { name, created_at, messages }> or {}.
   */
  static async getExtremeUserMap(
    projectId: string,
    userId: string
  ): Promise<Record<string, { name: string; created_at: string; messages: Array<{ user: string; assistant: string; generated_at: string }> }>> {
    const context: ErrorContext = {
      operation: 'get_extreme_user_map',
      userId,
      timestamp: new Date().toISOString()
    };

    return ErrorHandler.withRetry(
      async () => {
        const { data, error } = await supabase
          .from('projects')
          .select('chatbox_extreuser')
          .eq('id', projectId)
          .eq('user_id', userId)
          .single();

        if (error) {
          if (error.code === 'PGRST116') return {};
          throw new Error('Unable to load user map. Please try again.');
        }

        const raw = data?.chatbox_extreuser;
        if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
        return raw as Record<string, any>;
      },
      context
    );
  }

  /**
   * Save "Provide Your Extreme User" form data into research_data JSONB column
   */
  static async saveChatProvidedUser(projectId: string, userId: string, data: object | null): Promise<void> {
    // Fetch current research_data first
    const { data: row, error: fetchError } = await supabase
      .from('projects')
      .select('research_data')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch research_data:', fetchError);
      return;
    }

    // Parse existing research_data (may be string or object)
    let existing: Record<string, any> = {};
    try {
      existing = typeof row?.research_data === 'string'
        ? JSON.parse(row.research_data)
        : (row?.research_data || {});
    } catch { existing = {}; }

    // Merge chatProvidedUser key
    const merged = { ...existing, chatProvidedUser: data };

    const { error } = await supabase
      .from('projects')
      .update({ research_data: merged })
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) console.error('Failed to save chatProvidedUser into research_data:', error);
  }

  /**
   * Save selected extreme user summary into research_data JSONB column
   */
  static async saveChatExtremeUser(projectId: string, userId: string, data: string | null): Promise<void> {
    // Fetch current research_data first
    const { data: row, error: fetchError } = await supabase
      .from('projects')
      .select('research_data')
      .eq('id', projectId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Failed to fetch research_data:', fetchError);
      return;
    }

    // Parse existing research_data (may be string or object)
    let existing: Record<string, any> = {};
    try {
      existing = typeof row?.research_data === 'string'
        ? JSON.parse(row.research_data)
        : (row?.research_data || {});
    } catch { existing = {}; }

    // Merge chatExtremeUser key
    const merged = { ...existing, chatExtremeUser: data };

    const { error } = await supabase
      .from('projects')
      .update({ research_data: merged })
      .eq('id', projectId)
      .eq('user_id', userId);

    if (error) console.error('Failed to save chatExtremeUser into research_data:', error);
  }
}

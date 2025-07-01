import { supabase } from '@/lib/supabase';
import type { Idea, IdeaInput, IdeaFeedback, IdeaRefinement } from '@/types/idea';

export const ideaService = {
  async createIdea(ideaData: Omit<IdeaInput, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('ideas')
      .insert([{
        ...ideaData,
        status: 'draft',
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getIdeaById(id: string): Promise<Idea> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Idea;
  },

  async getProjectIdeas(projectId: string): Promise<Idea[]> {
    const { data, error } = await supabase
      .from('ideas')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Idea[];
  },

  async updateIdea(id: string, updates: Partial<IdeaInput>) {
    const { data, error } = await supabase
      .from('ideas')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteIdea(id: string) {
    const { error } = await supabase
      .from('ideas')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  // Feedback methods
  async addFeedback(feedbackData: Omit<IdeaFeedback, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('idea_feedback')
      .insert([feedbackData])
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getIdeaFeedback(ideaId: string): Promise<IdeaFeedback[]> {
    const { data, error } = await supabase
      .from('idea_feedback')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as IdeaFeedback[];
  },

  // Refinement methods
  async refineIdea(ideaId: string, refinementData: {
    original_content: string;
    refined_content: string;
    changes_made: string;
  }) {
    const { data, error } = await supabase
      .from('idea_refinements')
      .insert([{
        idea_id: ideaId,
        ...refinementData,
      }])
      .select()
      .single();

    if (error) throw error;
    
    // Update the idea with the refined content
    const updatedIdea = await this.updateIdea(ideaId, {
      content: refinementData.refined_content,
      status: 'refining',
    });

    return { refinement: data, idea: updatedIdea };
  },

  async getIdeaRefinements(ideaId: string): Promise<IdeaRefinement[]> {
    const { data, error } = await supabase
      .from('idea_refinements')
      .select('*')
      .eq('idea_id', ideaId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data as IdeaRefinement[];
  },
};

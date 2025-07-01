import { Project } from './project';

export interface IdeaInput {
  id: string;
  project_id: string;
  content: string;
  status: 'draft' | 'refining' | 'validating' | 'ready' | 'archived';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface Idea extends IdeaInput {
  // Additional fields or overrides can go here
}

export interface IdeaWithProject extends Idea {
  project?: Project;
}

export interface IdeaFeedback {
  id: string;
  idea_id: string;
  feedback: string;
  rating: number; // 1-5
  created_at: string;
  updated_at: string;
}

export interface IdeaRefinement {
  id: string;
  idea_id: string;
  original_content: string;
  refined_content: string;
  changes_made: string;
  created_at: string;
}

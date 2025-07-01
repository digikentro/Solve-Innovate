export type ProjectStatus = 'draft' | 'active' | 'completed' | 'archived';

export interface ProjectInput {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  tags?: string[] | null;
  created_at: string;
  updated_at: string;
  presentable_slide?: any;
}

export interface Project extends ProjectInput {
  // Additional fields or overrides can go here
}

export interface ProjectWithIdeas extends Project {
  ideas?: ProjectIdea[];
}

export interface ProjectIdea {
  id: string;
  project_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

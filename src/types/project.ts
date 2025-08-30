export interface Project {
  id: string;
  title: string;
  description: string;
  status: string;
  skills?: string[] | null;
  created_at: string;
  updated_at: string;
  presentable_slide?: any;
  analysis?: any;
  as_is_map?: any;
  design_research?: any;
  empathy_research_plan?: any;
  canvas?: any;
  metadata?: any;
}

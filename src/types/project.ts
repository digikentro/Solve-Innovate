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
  extreme_user_data?: any;
  deep_empathy_data?: any;
  behavioral_insights_data?: any;
  psychological_analysis?: any;
  transformation_framework?: any;
  hmw_framework?: any;
  Behaviour_Framework?: any;
  HMW_Ideation_Framework?: any;
  canvas?: any;
  metadata?: any;
  chatbox?: Array<{
    user: string;
    assistant: string;
    generated_at: string;
  }> | null;
}

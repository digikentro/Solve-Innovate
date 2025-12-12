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
  extreme_user_data?: any;
  deep_empathy_data?: any;
  psychological_analysis?: any;
  transformation_framework?: any;
  Behaviour_Framework?: any;
  HMW_Ideation_Framework?: any;
  canvas?: any;
  metadata?: any;
  design_research?: {
    generated_at?: string;
    form?: {
      painPointStep?: string;
      painPointDescription?: string;
      targetUserContext?: string;
    };
  };
  chatbox?: Array<{
    user: string;
    assistant: string;
    generated_at: string;
  }> | null;
}

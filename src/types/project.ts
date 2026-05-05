export interface Project {
  id: string;
  title: string;
  /**
   * User-editable sidebar/project label.
   * Defaults to `title` when not customized.
   */
  display_name?: string | null;
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
  secondaryresearch?: any;
  psychological_analysis?: any;
  Behaviour_Framework?: any;
  HMW_Ideation_Framework?: any;
  Idea_Clustering_and_Idea_Cards?: any;
  transformation_framework?: any;
  final_idea?: any; // Selected idea card for prototyping
  prototype_images?: any; // Stores generated prototype sketch metadata/url
  testing?: any; // Stores testing analysis data
  market_research?: any; // Stores market research data
  presentation_id?: string | null; // ID linking to generated markdown presentation
  research_data?: any;
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

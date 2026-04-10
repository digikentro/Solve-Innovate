// ─── Spatial Deck Types ─────────────────────────────────────────────────────

export interface SpatialPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SpatialTextStyle {
  variant?: 'title' | 'subtitle' | 'heading' | 'body' | 'bullets' | 'caption';
  emphasis?: 'normal' | 'strong';
  font_size?: number;
  align?: 'left' | 'center' | 'right';
  color?: string;
}

interface SpatialBlockBase {
  id: string;
  position: SpatialPosition;
  rotation?: number;
  z_index?: number;
}

export interface SpatialTextBlock extends SpatialBlockBase {
  type: 'text';
  content: string;
  style?: SpatialTextStyle;
}

export interface SpatialImageBlock extends SpatialBlockBase {
  type: 'image';
  prompt: string;
  caption?: string | null;
  object_fit?: 'contain' | 'cover';
}

export interface SpatialChartDataPoint {
  label: string;
  value: number;
}

export interface SpatialChartBlock extends SpatialBlockBase {
  type: 'chart';
  chart_type: 'bar' | 'line' | 'pie' | 'donut' | 'area';
  data: SpatialChartDataPoint[];
  title?: string | null;
  color?: string;
}

export interface SpatialIconBlock extends SpatialBlockBase {
  type: 'icon';
  icon_query: string;
  color?: string;
}

export interface SpatialShapeBlock extends SpatialBlockBase {
  type: 'shape';
  shape_type: 'square' | 'circle' | 'rectangle' | 'triangle' | 'line';
  color?: string;
}

export interface SpatialTableData { headers: string[]; rows: string[][]; }
export interface SpatialTableBlock extends SpatialBlockBase { type: 'table'; data: SpatialTableData; color?: string; }
export type SpatialBlock = SpatialTextBlock | SpatialImageBlock | SpatialChartBlock | SpatialIconBlock | SpatialShapeBlock | SpatialTableBlock;

// ─── Legacy Markdown Types (compatibility) ──────────────────────────────────

export interface HeadingBlock {
  type: 'heading';
  level: 1 | 2 | 3;
  text: string;
}

export interface ParagraphBlock {
  type: 'paragraph';
  text: string;
}

export interface BulletListBlock {
  type: 'bullet_list';
  items: string[];
}

export interface NumberedListBlock {
  type: 'numbered_list';
  items: string[];
}

export interface MetricItem {
  value: string;
  label: string;
  delta?: string;
}

export interface MetricRowBlock {
  type: 'metric_row';
  metrics: MetricItem[];
}

export interface QuoteBlock {
  type: 'quote';
  text: string;
  attribution?: string;
}

export interface ImageBlock {
  type: 'image';
  src: string;
  alt: string;
  caption?: string;
}

export interface TableBlock {
  type: 'table';
  headers: string[];
  rows: string[][];
}

export interface ChartData {
  headers: string[];
  rows: string[][];
}

export interface ChartBlock {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'donut';
  data: ChartData;
}

export interface CalloutBlock {
  type: 'callout';
  icon: string;
  title: string;
  body: string;
}

export interface CodeBlock {
  type: 'code';
  language: string;
  code: string;
}

export interface DividerBlock {
  type: 'divider';
}

export interface ColumnsBlock {
  type: 'columns';
  columns: MarkdownBlock[][];
}

export interface BlockLayout {
  width?: number;
  height?: number;
  x?: number;
  y?: number;
}

export type MarkdownBlock = (
  | HeadingBlock
  | ParagraphBlock
  | BulletListBlock
  | NumberedListBlock
  | MetricRowBlock
  | QuoteBlock
  | ImageBlock
  | TableBlock
  | ChartBlock
  | CalloutBlock
  | CodeBlock
  | DividerBlock
  | ColumnsBlock
) & { layout?: BlockLayout };

// ─── Theme ───────────────────────────────────────────────────────────────────

export interface ThemeColors {
  primary: string;
  accent?: string;
  bg: string;
  text: string;
  subtext: string;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  fonts: {
    heading: string;
    body: string;
  };
}

// ─── Slide ───────────────────────────────────────────────────────────────────

export interface SlideData {
  id: string;
  title: string;
  visual_intent?: string;
  chart_candidate?: boolean;
  blocks: SpatialBlock[];
  index?: number;
  markdown?: string;
  image_url?: string | null;
}

// ─── Presentation Settings ───────────────────────────────────────────────────

export interface PresentationSettings {
  nSlides: number;
  tone: string;
  verbosity: 'minimal' | 'concise' | 'detailed' | 'extensive' | 'standard' | 'text_heavy';
  textMode: 'generate' | 'condense' | 'preserve';
  audience: string;
  writingGuidance?: string;
  theme: string;
  language: string;
  instructions: string;
  logoUrl?: string | null;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  includeImages: boolean;
  includeCharts: boolean;
  visualPreference?: 'balanced' | 'visual-first' | 'text-first';
  imageSource?: 'ai' | 'stock' | 'none';
  customColors?: {
    primary?: string;
    accent?: string;
    background?: string;
    bg?: string;
    text?: string;
  };
  // Visual generation controls
  imageModel?: 'dalle3' | 'gpt-image-1.5' | 'gemini-flash' | 'pexels' | 'pixabay' | 'none';
  imageArtStyle?: 'photo' | 'abstract' | '3d' | 'line-art' | 'custom';
  imageKeywords?: string[];
  chartEnabled?: boolean;
  chartTypes?: Array<'bar' | 'line' | 'pie' | 'area' | 'scatter'>;
  chartFrequency?: number; // every N slides
  diagramEnabled?: boolean;
  diagramTypes?: Array<'process_flow' | 'timeline' | 'matrix' | 'org_chart' | 'flowchart'>;
  diagramFrequency?: number; // every N slides
}

export interface SpatialDeckConfig {
  text_mode?: PresentationSettings['textMode'];
  density?: PresentationSettings['verbosity'];
  write_for?: string;
  tone?: string;
  output_language?: string;
  image_source?: PresentationSettings['imageSource'];
  image_model?: PresentationSettings['imageModel'];
  image_art_style?: PresentationSettings['imageArtStyle'];
  image_keywords?: string[];
  theme?: string;
  visual_preference?: PresentationSettings['visualPreference'];
}

// ─── Presentation Phase ──────────────────────────────────────────────────────

export type PresentationPhase = 'configure' | 'outline' | 'viewer';

export interface OutlineSlideDraft {
  title: string;
  bullets: string[];
  visual_intent: 'Data-Heavy' | 'Visual-Hero' | 'Narrative' | 'Comparison' | 'Process';
  has_quantitative_data: boolean;
}

export interface OutlineDraft {
  slides: OutlineSlideDraft[];
}

export interface SpatialSlide {
  id: string;
  title: string;
  visual_intent: string;
  chart_candidate?: boolean;
  blocks: SpatialBlock[];
}

export interface SpatialDeckPayload {
  format: 'spatial-json-canvas';
  version: string;
  slides: SpatialSlide[];
  config?: SpatialDeckConfig;
}

// ─── API Types ───────────────────────────────────────────────────────────────

export interface CreatePresentationResponse {
  presentation_id: string;
}

export interface PresentationSummaryResponse {
  id: string;
  theme: string;
  n_slides: number;
  language: string;
  generated_slides: string[] | null;
}

export interface EditorSlidePayload {
  id: string;
  title: string;
  visual_intent?: string;
  chart_candidate?: boolean;
  blocks: SpatialBlock[];
}

export interface EditorStatePayload {
  markdown_presentation_id?: string | null;
  editor_payload: SpatialDeckPayload;
  theme?: string | null;
  logo_url?: string | null;
  logo_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
  custom_colors?: {
    primary?: string;
    accent?: string;
    background?: string;
    bg?: string;
    text?: string;
  } | null;
}

export interface EditorStateResponse {
  presentation_id: string;
  editor: SpatialDeckPayload;
}

export interface RegenerateSlideResponse {
  slide_index: number;
  markdown: string;
}

export interface SwitchThemeResponse {
  success: boolean;
  theme: string;
}

export interface ExportPptxResponse {
  path: string;
}

export interface ExportPdfResponse {
  path: string;
}

export interface ProjectPresentationSummary {
  id: string;
  project_id: string;
  title: string;
  status: string;
  created_at: string;
  updated_at: string;
  current_revision_id: string | null;
  current_markdown_presentation_id: string | null;
  current_slide_count: number | null;
  logo_url?: string | null;
  logo_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  preview_title?: string | null;
  preview_snippet?: string | null;
}

export interface CreateProjectPresentationResponse {
  presentation_id: string;
}

export interface GenerateProjectPresentationResponse {
  presentation_id: string;
  markdown_presentation_id: string;
  revision_id: string;
  editor_payload: SpatialDeckPayload;
}

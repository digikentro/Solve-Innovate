// ─── Block Types ─────────────────────────────────────────────────────────────

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
  width?: number; // percentage 0-100
  height?: number; // pixels on 720 canvas
  x?: number; // percentage
  y?: number; // percentage
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
  index: number;
  markdown: string;
  blocks: MarkdownBlock[];
}

// ─── Presentation Settings ───────────────────────────────────────────────────

export interface PresentationSettings {
  nSlides: number;
  tone: string;
  verbosity: 'minimal' | 'concise' | 'standard' | 'text_heavy';
  textMode: 'generate' | 'condense' | 'preserve';
  audience: string;
  theme: string;
  language: string;
  instructions: string;
  logoUrl?: string | null;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  includeImages: boolean;
  includeCharts: boolean;
  customColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    bg?: string;
    text?: string;
  };
}

// ─── Presentation Phase ──────────────────────────────────────────────────────

export type PresentationPhase = 'configure' | 'outline' | 'streaming' | 'viewer';

export interface OutlineSlideDraft {
  title: string;
  details: string[];
}

export interface OutlineDraft {
  slides: OutlineSlideDraft[];
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
  markdown: string;
  blocks?: MarkdownBlock[] | null;
}

export interface EditorStatePayload {
  markdown_presentation_id: string;
  slides: EditorSlidePayload[];
  theme?: string | null;
  logo_url?: string | null;
  logo_position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;
  custom_colors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    bg?: string;
    text?: string;
  } | null;
}

export interface EditorStateResponse {
  presentation_id: string;
  editor: EditorStatePayload;
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
}

export interface SSESlideEvent {
  type: 'slide';
  index: number;
  markdown: string;
}

export interface SSEProgressEvent {
  type: 'progress';
  message: string;
}

export interface SSEDoneEvent {
  type: 'done';
  total_slides: number;
}

export interface SSEErrorEvent {
  type: 'error';
  detail: string;
}

export type SSEEvent = SSESlideEvent | SSEProgressEvent | SSEDoneEvent | SSEErrorEvent;

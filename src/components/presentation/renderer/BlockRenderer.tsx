import type { MarkdownBlock } from '@/types/presentation';
import { HeadingBlock } from './HeadingBlock';
import { ParagraphBlock } from './ParagraphBlock';
import { BulletListBlock } from './BulletListBlock';
import { NumberedListBlock } from './NumberedListBlock';
import { MetricRowBlock } from './MetricRowBlock';
import { QuoteBlock } from './QuoteBlock';
import { ChartBlock } from './ChartBlock';
import { TableBlock } from './TableBlock';
import { CalloutBlock } from './CalloutBlock';
import { ImageBlock } from './ImageBlock';
import { ColumnsBlock } from './ColumnsBlock';

interface BlockRendererProps {
  block: MarkdownBlock;
}

export const BlockRenderer = ({ block }: BlockRendererProps) => {
  switch (block.type) {
    case 'heading':
      return <HeadingBlock {...block} />;
    case 'paragraph':
      return <ParagraphBlock {...block} />;
    case 'bullet_list':
      return <BulletListBlock {...block} />;
    case 'numbered_list':
      return <NumberedListBlock {...block} />;
    case 'metric_row':
      return <MetricRowBlock {...block} />;
    case 'quote':
      return <QuoteBlock {...block} />;
    case 'chart':
      return <ChartBlock {...block} />;
    case 'table':
      return <TableBlock {...block} />;
    case 'callout':
      return <CalloutBlock {...block} />;
    case 'image':
      return <ImageBlock {...block} />;
    case 'columns':
      return <ColumnsBlock {...block} />;
    case 'divider':
      return <hr className="my-4 opacity-20" style={{ borderColor: 'var(--text-color)' }} />;
    case 'code':
      return (
        <pre className="bg-black/20 rounded-lg p-4 overflow-x-auto my-2">
          <code className="text-sm" style={{ color: 'var(--text-color)' }}>
            {block.code}
          </code>
        </pre>
      );
    default:
      // Graceful fallback for unknown block types
      return (
        <div className="text-sm italic opacity-60 py-1" style={{ color: 'var(--text-color)' }}>
          [Unsupported content block]
        </div>
      );
  }
};

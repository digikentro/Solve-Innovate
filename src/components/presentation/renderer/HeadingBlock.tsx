import type { HeadingBlock as HeadingBlockType } from '@/types/presentation';

// Helper to render inline markdown formatting
function renderInlineMarkdown(text: string) {
  // Convert **bold** to <strong> and *italic* to <em>
  const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const withItalic = withBold.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return withItalic;
}

export const HeadingBlock = ({ level, text }: HeadingBlockType) => {
  const sizeMap = {
    1: 'text-4xl md:text-5xl',
    2: 'text-3xl md:text-4xl',
    3: 'text-2xl md:text-3xl',
  };
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  
  // Check if text contains markdown formatting
  const hasFormatting = text.includes('**') || text.includes('*');
  
  return (
    <Tag
      className={`${sizeMap[level]} font-bold mb-6 tracking-tight leading-tight break-words max-w-full`}
      style={{ 
        fontFamily: 'var(--heading-font)',
        color: 'var(--primary-color)' 
      }}
    >
      {hasFormatting ? (
        <span dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(text) }} />
      ) : (
        text
      )}
    </Tag>
  );
};

import type { NumberedListBlock as NumberedListBlockType } from '@/types/presentation';

// Helper to render inline markdown formatting
function renderInlineMarkdown(text: string) {
  const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const withItalic = withBold.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return withItalic;
}

export const NumberedListBlock = ({ items }: NumberedListBlockType) => {
  const isMultiColumn = items.length > 6;
  
  return (
    <ol className={`grid gap-x-10 gap-y-4 w-full ${isMultiColumn ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {items.map((item, i) => {
        const hasFormatting = item.includes('**') || item.includes('*');
        return (
          <li 
            key={i} 
            className="flex items-start gap-3 text-lg md:text-xl leading-snug break-words min-w-0" 
            style={{ color: 'var(--text-color)' }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white shadow-sm"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {i + 1}
            </div>
            {hasFormatting ? (
              <span className="flex-1 min-w-0 mt-0.5" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
            ) : (
              <span className="flex-1 min-w-0 mt-0.5">{item}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

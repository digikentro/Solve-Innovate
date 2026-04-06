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
            className="flex items-start gap-4 text-2xl md:text-3xl leading-snug" 
            style={{ color: 'var(--text-color)' }}
          >
            <div
              className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold text-white shadow-sm"
              style={{ backgroundColor: 'var(--primary-color)' }}
            >
              {i + 1}
            </div>
            {hasFormatting ? (
              <span className="flex-1 mt-0.5" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
            ) : (
              <span className="flex-1 mt-0.5">{item}</span>
            )}
          </li>
        );
      })}
    </ol>
  );
};

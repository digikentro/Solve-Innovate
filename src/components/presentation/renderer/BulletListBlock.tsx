import type { BulletListBlock as BulletListBlockType } from '@/types/presentation';

// Helper to render inline markdown formatting
function renderInlineMarkdown(text: string) {
  const withBold = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  const withItalic = withBold.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return withItalic;
}

export const BulletListBlock = ({ items }: BulletListBlockType) => {
  const isMultiColumn = items.length > 6;
  
  return (
    <ul className={`grid gap-x-8 gap-y-3 w-full ${isMultiColumn ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {items.map((item, i) => {
        const hasFormatting = item.includes('**') || item.includes('*');
        return (
          <li 
            key={i} 
            className="flex items-start gap-3 text-lg md:text-xl leading-snug break-words min-w-0" 
            style={{ color: 'var(--text-color)' }}
          >
            <div
              className="mt-2.5 w-2.5 h-2.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--primary-color)' }}
            />
            {hasFormatting ? (
              <span className="flex-1 min-w-0" dangerouslySetInnerHTML={{ __html: renderInlineMarkdown(item) }} />
            ) : (
              <span className="flex-1 min-w-0">{item}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
};

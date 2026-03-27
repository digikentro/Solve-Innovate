import type { ParagraphBlock as ParagraphBlockType } from '@/types/presentation';

/**
 * Renders inline bold (**text**) and italic (*text*) from markdown.
 */
function renderInlineMarkdown(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  const regex = /\*\*(.+?)\*\*|\*(.+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    // Text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[1]) {
      parts.push(<strong key={match.index}>{match[1]}</strong>);
    } else if (match[2]) {
      parts.push(<em key={match.index}>{match[2]}</em>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

export const ParagraphBlock = ({ text }: ParagraphBlockType) => {
  return (
    <p className="text-base md:text-lg leading-relaxed" style={{ color: 'var(--text-color)' }}>
      {renderInlineMarkdown(text)}
    </p>
  );
};

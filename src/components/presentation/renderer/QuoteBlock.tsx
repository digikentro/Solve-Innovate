import type { QuoteBlock as QuoteBlockType } from '@/types/presentation';

export const QuoteBlock = ({ text, attribution }: QuoteBlockType) => {
  return (
    <blockquote
      className="pl-5 py-2 my-2 rounded-r-lg"
      style={{
        borderLeft: '4px solid var(--primary-color)',
        backgroundColor: 'color-mix(in srgb, var(--primary-color) 5%, transparent)',
      }}
    >
      <p
        className="text-lg md:text-xl italic leading-relaxed"
        style={{ color: 'var(--text-color)' }}
      >
        "{text}"
      </p>
      {attribution && (
        <p
          className="text-sm mt-2 font-medium"
          style={{ color: 'var(--subtext-color, var(--text-color))' }}
        >
          — {attribution}
        </p>
      )}
    </blockquote>
  );
};

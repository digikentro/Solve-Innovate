import type { QuoteBlock as QuoteBlockType } from '@/types/presentation';

export const QuoteBlock = ({ text, attribution }: QuoteBlockType) => {
  return (
    <blockquote
      className="pl-8 py-6 my-6 rounded-r-2xl"
      style={{
        borderLeft: '8px solid var(--primary-color)',
        backgroundColor: 'color-mix(in srgb, var(--primary-color) 8%, transparent)',
      }}
    >
      <p
        className="text-3xl md:text-4xl italic leading-tight"
        style={{ color: 'var(--text-color)' }}
      >
        "{text}"
      </p>
      {attribution && (
        <p
          className="text-xl md:text-2xl mt-4 font-semibold opacity-80"
          style={{ color: 'var(--subtext-color, var(--text-color))' }}
        >
          — {attribution}
        </p>
      )}
    </blockquote>
  );
};

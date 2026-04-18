import type { QuoteBlock as QuoteBlockType } from '@/types/presentation';

export const QuoteBlock = ({ text, attribution }: QuoteBlockType) => {
  return (
    <blockquote
      className="pl-6 py-5 my-5 rounded-r-2xl"
      style={{
        borderLeft: '8px solid var(--primary-color)',
        backgroundColor: 'color-mix(in srgb, var(--primary-color) 8%, transparent)',
      }}
    >
      <p
        className="text-xl md:text-2xl italic leading-snug break-words"
        style={{ color: 'var(--text-color)' }}
      >
        "{text}"
      </p>
      {attribution && (
        <p
          className="text-base md:text-lg mt-3 font-semibold opacity-80 break-words"
          style={{ color: 'var(--subtext-color, var(--text-color))' }}
        >
          — {attribution}
        </p>
      )}
    </blockquote>
  );
};

import type { NumberedListBlock as NumberedListBlockType } from '@/types/presentation';

export const NumberedListBlock = ({ items }: NumberedListBlockType) => {
  return (
    <ol className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-base md:text-lg" style={{ color: 'var(--text-color)' }}>
          <span
            className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white"
            style={{ backgroundColor: 'var(--primary-color)' }}
          >
            {i + 1}
          </span>
          <span className="mt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
};

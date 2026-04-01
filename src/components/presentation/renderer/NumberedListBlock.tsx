import type { NumberedListBlock as NumberedListBlockType } from '@/types/presentation';

export const NumberedListBlock = ({ items }: NumberedListBlockType) => {
  const isMultiColumn = items.length > 6;
  
  return (
    <ol className={`grid gap-x-10 gap-y-4 w-full ${isMultiColumn ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {items.map((item, i) => (
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
          <span className="flex-1 mt-0.5">{item}</span>
        </li>
      ))}
    </ol>
  );
};

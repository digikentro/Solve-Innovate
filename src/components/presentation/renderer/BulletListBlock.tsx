import type { BulletListBlock as BulletListBlockType } from '@/types/presentation';

export const BulletListBlock = ({ items }: BulletListBlockType) => {
  const isMultiColumn = items.length > 6;
  
  return (
    <ul className={`grid gap-x-8 gap-y-3 w-full ${isMultiColumn ? 'grid-cols-2' : 'grid-cols-1'}`}>
      {items.map((item, i) => (
        <li 
          key={i} 
          className="flex items-start gap-4 text-2xl md:text-3xl leading-snug" 
          style={{ color: 'var(--text-color)' }}
        >
          <div
            className="mt-3 w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--primary-color)' }}
          />
          <span className="flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
};

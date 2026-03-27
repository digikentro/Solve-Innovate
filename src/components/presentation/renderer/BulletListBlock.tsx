import type { BulletListBlock as BulletListBlockType } from '@/types/presentation';

export const BulletListBlock = ({ items }: BulletListBlockType) => {
  return (
    <ul className="space-y-2 pl-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-base md:text-lg" style={{ color: 'var(--text-color)' }}>
          <span
            className="mt-2 w-2 h-2 rounded-full flex-shrink-0"
            style={{ backgroundColor: 'var(--primary-color)' }}
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
};

import type { HeadingBlock as HeadingBlockType } from '@/types/presentation';

export const HeadingBlock = ({ level, text }: HeadingBlockType) => {
  const sizeMap = {
    1: 'text-3xl md:text-4xl',
    2: 'text-2xl md:text-3xl',
    3: 'text-xl md:text-2xl',
  };
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return (
    <Tag
      className={`${sizeMap[level]} font-bold`}
      style={{ color: 'var(--primary-color)' }}
    >
      {text}
    </Tag>
  );
};

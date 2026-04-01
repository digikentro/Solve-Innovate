import type { HeadingBlock as HeadingBlockType } from '@/types/presentation';

export const HeadingBlock = ({ level, text }: HeadingBlockType) => {
  const sizeMap = {
    1: 'text-5xl md:text-6xl',
    2: 'text-4xl md:text-5xl',
    3: 'text-3xl md:text-4xl',
  };
  const Tag = `h${level}` as 'h1' | 'h2' | 'h3';
  return (
    <Tag
      className={`${sizeMap[level]} font-bold mb-8 tracking-tight`}
      style={{ 
        fontFamily: 'var(--heading-font)',
        color: 'var(--primary-color)' 
      }}
    >
      {text}
    </Tag>
  );
};

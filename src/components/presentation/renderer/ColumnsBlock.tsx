import type { ColumnsBlock as ColumnsBlockType } from '@/types/presentation';
import { BlockRenderer } from './BlockRenderer';

export const ColumnsBlock = ({ columns }: ColumnsBlockType) => {
  return (
    <div
      className="grid gap-6 my-2"
      style={{ gridTemplateColumns: `repeat(${columns.length}, 1fr)` }}
    >
      {columns.map((col, i) => (
        <div key={i} className="space-y-3">
          {col.map((block, j) => (
            <BlockRenderer key={j} block={block} />
          ))}
        </div>
      ))}
    </div>
  );
};

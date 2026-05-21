import type { TableBlock as TableBlockType } from '@/types/presentation';

export const TableBlock = ({ headers, rows }: TableBlockType) => {
  if (!headers.length) return null;

  return (
    <div className="overflow-x-auto rounded-xl my-2">
      <table className="w-full text-sm">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th
                key={i}
                className="px-4 py-3 text-left font-bold text-sm"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--primary-color) 15%, transparent)',
                  color: 'var(--primary-color)',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr
              key={ri}
              style={{
                backgroundColor: ri % 2 === 0
                  ? 'color-mix(in srgb, var(--primary-color) 3%, transparent)'
                  : 'transparent',
              }}
            >
              {row.map((cell, ci) => (
                <td
                  key={ci}
                  className="px-4 py-2.5 text-sm"
                  style={{ color: 'var(--text-color)' }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

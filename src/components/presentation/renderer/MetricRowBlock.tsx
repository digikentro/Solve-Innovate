import type { MetricRowBlock as MetricRowBlockType } from '@/types/presentation';

export const MetricRowBlock = ({ metrics }: MetricRowBlockType) => {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(metrics.length, 4)}, 1fr)` }}>
      {metrics.map((metric, i) => (
        <div
          key={i}
          className="text-center p-4 rounded-2xl"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--primary-color) 8%, transparent)',
          }}
        >
          <div
            className="text-2xl md:text-3xl font-bold break-words"
            style={{ color: 'var(--primary-color)' }}
          >
            {metric.value}
          </div>
          <div
            className="text-xs md:text-sm mt-1 font-medium break-words"
            style={{ color: 'var(--subtext-color, var(--text-color))' }}
          >
            {metric.label}
          </div>
          {metric.delta && (
            <div
              className="text-xs md:text-sm mt-1 font-semibold break-words"
              style={{
                color: metric.delta.startsWith('+') ? '#10b981' : metric.delta.startsWith('-') ? '#ef4444' : 'var(--text-color)',
              }}
            >
              {metric.delta}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

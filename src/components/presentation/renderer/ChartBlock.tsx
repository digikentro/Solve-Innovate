import type { ChartBlock as ChartBlockType } from '@/types/presentation';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const CHART_COLORS = ['#5146E5', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

export const ChartBlock = ({ chartType, data }: ChartBlockType) => {
  if (!data.headers.length || !data.rows.length) {
    return (
      <div className="text-sm italic py-2" style={{ color: 'var(--subtext-color, var(--text-color))' }}>
        [Chart data unavailable]
      </div>
    );
  }

  // Transform table data into chart-compatible format
  const chartData = data.rows.map((row) => {
    const entry: Record<string, string | number> = {};
    data.headers.forEach((h, i) => {
      const val = row[i] || '';
      const num = parseFloat(val.replace(/[^0-9.-]/g, ''));
      entry[h] = isNaN(num) ? val : num;
    });
    return entry;
  });

  const categoryKey = data.headers[0];
  const valueKeys = data.headers.slice(1);

  if (chartType === 'pie' || chartType === 'donut') {
    const pieData = chartData.map((d, i) => ({
      name: String(d[categoryKey]),
      value: typeof d[valueKeys[0]] === 'number' ? d[valueKeys[0]] : 0,
      fill: CHART_COLORS[i % CHART_COLORS.length],
    }));

    return (
      <div className="w-full my-6" style={{ height: 450 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={160}
              innerRadius={chartType === 'donut' ? 100 : 0}
              label={({ name, percent }: any) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
            >
              {pieData.map((entry: any, i: number) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  }

  if (chartType === 'line') {
    return (
      <div className="w-full my-6" style={{ height: 450 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey={categoryKey} tick={{ fill: 'var(--text-color)', fontSize: 16 }} />
            <YAxis tick={{ fill: 'var(--text-color)', fontSize: 16 }} />
            <Tooltip />
            {valueKeys.map((key, i) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={CHART_COLORS[i % CHART_COLORS.length]}
                strokeWidth={3}
                dot={{ r: 6 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  }

  // Default: bar chart
  return (
    <div className="w-full my-6" style={{ height: 450 }}>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
          <XAxis dataKey={categoryKey} tick={{ fill: 'var(--text-color)', fontSize: 16 }} />
          <YAxis tick={{ fill: 'var(--text-color)', fontSize: 16 }} />
          <Tooltip />
          {valueKeys.map((key, i) => (
            <Bar
              key={key}
              dataKey={key}
              fill={CHART_COLORS[i % CHART_COLORS.length]}
              radius={[6, 6, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

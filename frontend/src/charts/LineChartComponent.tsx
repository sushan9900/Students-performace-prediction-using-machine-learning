import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface LineSeries {
  dataKey: string;
  name: string;
  color: string;
}

interface LineChartComponentProps {
  data: Record<string, any>[];
  xAxisKey: string;
  series: LineSeries[];
  title?: string;
  subtitle?: string;
  height?: number;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  xAxisKey,
  series,
  title = 'ML Model Learning Curve',
  subtitle = 'Training Score vs Validation Score across sample sizes',
  height = 300,
}) => {
  return (
    <div className="glass-card p-5">
      {title && (
        <div className="mb-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey={xAxisKey}
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '10px' }}
              formatter={(value: string) => (
                <span className="text-xs text-slate-300 font-medium ml-1">{value}</span>
              )}
            />
            {series.map((s, idx) => (
              <Line
                key={`line-${idx}`}
                type="monotone"
                dataKey={s.dataKey}
                name={s.name}
                stroke={s.color}
                strokeWidth={3}
                dot={{ r: 4, fill: s.color }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineChartComponent;

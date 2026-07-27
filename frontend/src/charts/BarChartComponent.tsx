import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartData {
  name: string;
  value: number;
  isBest?: boolean;
}

interface BarChartComponentProps {
  data: BarChartData[];
  title?: string;
  subtitle?: string;
  height?: number;
  barColor?: string;
  highlightColor?: string;
}

export const BarChartComponent: React.FC<BarChartComponentProps> = ({
  data,
  title = 'Model Accuracy Comparison',
  subtitle = 'Accuracy scores across algorithms',
  height = 300,
  barColor = '#6366f1',
  highlightColor = '#10b981',
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
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              interval={0}
              angle={-15}
              textAnchor="end"
            />
            <YAxis
              stroke="#64748b"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              domain={[0, 100]}
              unit="%"
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
              formatter={(val: number) => [`${val.toFixed(1)}%`, 'Accuracy']}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.isBest ? highlightColor : barColor}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;

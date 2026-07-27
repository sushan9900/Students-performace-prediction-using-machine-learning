import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface PieChartData {
  name: string;
  value: number;
  color?: string;
}

interface PieChartComponentProps {
  data: PieChartData[];
  title?: string;
  subtitle?: string;
  height?: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  Excellent: '#10b981', // Emerald Green
  Good: '#3b82f6',      // Royal Blue
  Average: '#f59e0b',   // Amber Yellow
  Poor: '#ef4444',      // Crimson Red
};

export const PieChartComponent: React.FC<PieChartComponentProps> = ({
  data,
  title = 'Student Performance Distribution',
  subtitle = 'Breakdown of predicted grade categories',
  height = 300,
}) => {
  const totalCount = data.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="glass-card p-5">
      {title && (
        <div className="mb-2">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
      )}

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={95}
              paddingAngle={4}
              dataKey="value"
            >
              {data.map((entry, index) => {
                const color = entry.color || CATEGORY_COLORS[entry.name] || '#6366f1';
                return <Cell key={`cell-${index}`} fill={color} stroke="#0f172a" strokeWidth={2} />;
              })}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
              }}
              formatter={(value: number) => [
                `${value} students (${totalCount > 0 ? ((value / totalCount) * 100).toFixed(1) : 0}%)`,
                'Count',
              ]}
            />
            <Legend
              verticalAlign="bottom"
              height={36}
              iconType="circle"
              formatter={(value: string) => (
                <span className="text-xs text-slate-300 font-medium ml-1">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default PieChartComponent;

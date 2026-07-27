import React from 'react';
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface ScatterPoint {
  id: number;
  x: number;
  y: number;
  category: string;
}

interface ScatterPlotComponentProps {
  data: ScatterPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  title?: string;
  subtitle?: string;
  height?: number;
}

export const ScatterPlotComponent: React.FC<ScatterPlotComponentProps> = ({
  data,
  xAxisLabel = 'Attendance %',
  yAxisLabel = 'Marks %',
  title = 'Attendance vs Marks Scatter Analysis',
  subtitle = 'Correlation between student attendance rates and academic marks',
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
          <ScatterChart margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis
              type="number"
              dataKey="x"
              name={xAxisLabel}
              stroke="#64748b"
              fontSize={11}
              unit="%"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={yAxisLabel}
              stroke="#64748b"
              fontSize={11}
              unit="%"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <Tooltip
              cursor={{ strokeDasharray: '3 3', stroke: '#475569' }}
              contentStyle={{
                backgroundColor: '#0f172a',
                borderColor: '#334155',
                borderRadius: '0.75rem',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)',
              }}
              formatter={(value: number, name: string) => [
                `${value}%`,
                name === 'x' ? xAxisLabel : yAxisLabel,
              ]}
            />
            <Scatter name="Students" data={data} fill="#6366f1" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScatterPlotComponent;

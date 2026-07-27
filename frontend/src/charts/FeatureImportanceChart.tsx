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

interface FeatureImportanceChartProps {
  featureImportances?: Record<string, number>;
  title?: string;
  height?: number;
}

export const FeatureImportanceChart: React.FC<FeatureImportanceChartProps> = ({
  featureImportances = {
    'Attendance %': 0.32,
    'Previous Semester Marks': 0.28,
    'Study Hours': 0.18,
    'Assignment Score': 0.12,
    'Internal Assessment': 0.06,
    'Class Participation': 0.04,
  },
  title = 'ML Feature Importance Ranking',
  height = 320,
}) => {
  // Convert dict to sorted array
  const data = Object.entries(featureImportances)
    .map(([feature, score]) => ({
      feature: feature.replace(/_/g, ' '),
      score: Number((score * 100).toFixed(1)),
    }))
    .sort((a, b) => b.score - a.score);

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Predictive weight of student attributes calculated by winning ML model
        </p>
      </div>

      <div style={{ width: '100%', height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 10, right: 20, left: 40, bottom: 10 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
            <XAxis
              type="number"
              stroke="#64748b"
              fontSize={11}
              unit="%"
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
            />
            <YAxis
              type="category"
              dataKey="feature"
              stroke="#cbd5e1"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#334155' }}
              width={140}
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
              formatter={(val: number) => [`${val.toFixed(1)}%`, 'Importance Weight']}
            />
            <Bar dataKey="score" radius={[0, 6, 6, 0]}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? '#10b981' : index < 3 ? '#6366f1' : '#475569'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default FeatureImportanceChart;

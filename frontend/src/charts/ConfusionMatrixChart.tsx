import React from 'react';

interface ConfusionMatrixChartProps {
  labels?: string[];
  matrix?: number[][];
  title?: string;
}

export const ConfusionMatrixChart: React.FC<ConfusionMatrixChartProps> = ({
  labels = ['Poor', 'Average', 'Good', 'Excellent'],
  matrix = [
    [12, 1, 0, 0],
    [2, 18, 2, 0],
    [0, 1, 22, 1],
    [0, 0, 1, 15],
  ],
  title = 'Model Evaluation - Confusion Matrix 2D Grid',
}) => {
  // Find max cell count for color intensity calculation
  const maxVal = Math.max(...matrix.flatMap((row) => row), 1);

  return (
    <div className="glass-card p-5">
      <div className="mb-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400 mt-0.5">
          Actual Class (Rows) vs Predicted Class (Columns)
        </p>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[320px]">
          {/* Header Row */}
          <div className="grid grid-cols-[100px_repeat(4,1fr)] gap-2 mb-2 text-center text-xs font-semibold text-slate-400">
            <div>Actual \ Pred</div>
            {labels.map((lbl, idx) => (
              <div key={`header-${idx}`} className="truncate">
                {lbl}
              </div>
            ))}
          </div>

          {/* Matrix Grid Rows */}
          {matrix.map((row, rIdx) => (
            <div
              key={`row-${rIdx}`}
              className="grid grid-cols-[100px_repeat(4,1fr)] gap-2 mb-2 items-center"
            >
              {/* Row Label */}
              <div className="text-xs font-medium text-slate-300 truncate pr-2">
                {labels[rIdx] || `Class ${rIdx}`}
              </div>

              {/* Row Cells */}
              {row.map((cellValue, cIdx) => {
                const isDiagonal = rIdx === cIdx;
                const ratio = cellValue / maxVal;

                return (
                  <div
                    key={`cell-${rIdx}-${cIdx}`}
                    className={`py-3 px-2 rounded-xl text-center text-xs font-bold transition-all duration-200 ${
                      isDiagonal
                        ? 'bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 shadow-md shadow-indigo-500/10'
                        : cellValue > 0
                        ? 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
                        : 'bg-slate-900/40 border border-slate-800/40 text-slate-600'
                    }`}
                    style={{
                      backgroundColor: isDiagonal
                        ? `rgba(99, 102, 241, ${0.15 + ratio * 0.45})`
                        : undefined,
                    }}
                  >
                    <div>{cellValue}</div>
                    <div className="text-[10px] font-normal opacity-70">
                      {isDiagonal ? 'TP' : cellValue > 0 ? 'Err' : ''}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ConfusionMatrixChart;

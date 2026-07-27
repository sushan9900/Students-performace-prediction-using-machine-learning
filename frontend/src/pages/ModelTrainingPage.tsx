
import React, { useEffect, useState, useCallback } from 'react';
import {
  BrainCircuit,
  Play,
  CheckCircle2,
  Trophy,
  Loader2,
  BarChart2,
  Sliders,
  AlertCircle,
  RefreshCw,
  Target,
  Cpu,
  Layers,
  GitBranch,
  Zap,
  Activity,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

import { BarChartComponent }       from '../charts/BarChartComponent';
import { ConfusionMatrixChart }     from '../charts/ConfusionMatrixChart';
import { FeatureImportanceChart }   from '../charts/FeatureImportanceChart';
import { mlService }                from '../services/mlService';
import { ModelDetail, ModelComparison } from '../types';
import { formatPercent }            from '../utils/formatters';

// ── Algorithm Registry ─────────────────────────────────────────────────────────
interface AlgorithmDef {
  id:       string;
  name:     string;
  desc:     string;
  category: string;
  icon:     React.ElementType;
  color:    string;
  badge:    string;
}

const ALL_ALGORITHMS: AlgorithmDef[] = [
  {
    id: 'random_forest',
    name: 'Random Forest',
    desc: 'Ensemble of decision trees using bagging — reduces variance and overfitting.',
    category: 'Ensemble',
    icon: Layers,
    color: '#10b981',
    badge: 'badge-emerald',
  },
  {
    id: 'decision_tree',
    name: 'Decision Tree',
    desc: 'Single hierarchical tree — highly interpretable, fast to train.',
    category: 'Tree',
    icon: GitBranch,
    color: '#f59e0b',
    badge: 'badge-amber',
  },
  {
    id: 'logistic_regression',
    name: 'Logistic Regression',
    desc: 'Linear probabilistic classifier — excellent baseline with high explainability.',
    category: 'Linear',
    icon: Activity,
    color: '#60a5fa',
    badge: 'badge-blue',
  },
  {
    id: 'svm',
    name: 'Support Vector Machine',
    desc: 'RBF kernel hyperplane classifier — strong on high-dimensional feature spaces.',
    category: 'Kernel',
    icon: Target,
    color: '#c084fc',
    badge: 'badge-indigo',
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors',
    desc: 'Distance-based instance learning — non-parametric, no training phase.',
    category: 'Instance',
    icon: Zap,
    color: '#fb923c',
    badge: 'badge-amber',
  },
  {
    id: 'naive_bayes',
    name: 'Naive Bayes',
    desc: 'Gaussian probabilistic model — fast, works well with independent features.',
    category: 'Probabilistic',
    icon: Cpu,
    color: '#34d399',
    badge: 'badge-emerald',
  },
];

// ── Sub-components ─────────────────────────────────────────────────────────────

// Algorithm selection card
const AlgoCard: React.FC<{
  algo: AlgorithmDef;
  selected: boolean;
  onToggle: () => void;
  disabled: boolean;
}> = ({ algo, selected, onToggle, disabled }) => {
  const Icon = algo.icon;
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`
        text-left p-4 rounded-xl border cursor-pointer
        transition-all duration-200 group relative overflow-hidden
        ${selected
          ? 'border-indigo-500/40 bg-[rgba(99,102,241,0.08)]'
          : 'border-[var(--border-subtle)] bg-[var(--bg-elevated)] hover:border-[var(--border-strong)]'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      aria-pressed={selected}
      aria-label={`${selected ? 'Deselect' : 'Select'} ${algo.name}`}
    >
      {/* Checkmark corner */}
      <div
        className={`
          absolute top-2.5 right-2.5 w-4.5 h-4.5 rounded-full
          flex items-center justify-center
          transition-all duration-200
          ${selected
            ? 'bg-indigo-500 text-white'
            : 'bg-[var(--bg-card)] border border-[var(--border-default)]'
          }
        `}
        style={{ width: 18, height: 18 }}
        aria-hidden="true"
      >
        {selected && <CheckCircle2 style={{ width: 12, height: 12 }} />}
      </div>

      {/* Icon + Meta */}
      <div className="flex items-start gap-3 pr-6">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
          style={{ background: `${algo.color}20`, color: algo.color }}
          aria-hidden="true"
        >
          <Icon style={{ width: 17, height: 17 }} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {algo.name}
            </span>
            <span className={`badge ${algo.badge} text-[10px]`}>{algo.category}</span>
          </div>
          <p className="text-xs mt-1 leading-snug" style={{ color: 'var(--text-muted)' }}>
            {algo.desc}
          </p>
        </div>
      </div>
    </button>
  );
};

// Metric display cell inside the table
const MetricCell: React.FC<{ value: number; isBest?: boolean }> = ({ value, isBest }) => {
  const pct = formatPercent(value);
  const isHigh = value >= 0.85;
  const isMid  = value >= 0.75 && value < 0.85;
  const color  = isBest
    ? '#34d399'
    : isHigh ? '#6ee7b7' : isMid ? '#fcd34d' : '#fca5a5';
  return (
    <span className="font-mono font-semibold text-sm" style={{ color }}>
      {pct}
    </span>
  );
};

// Sort indicator
const SortIndicator: React.FC<{ col: string; sortCol: string; dir: 'asc' | 'desc' }> = ({
  col, sortCol, dir,
}) => {
  if (col !== sortCol) return (
    <span style={{ color: 'var(--text-muted)', opacity: 0.4 }}>
      <ChevronDown style={{ width: 12, height: 12 }} aria-hidden="true" />
    </span>
  );
  return dir === 'asc'
    ? <ChevronUp   style={{ width: 12, height: 12, color: '#818cf8' }} aria-hidden="true" />
    : <ChevronDown style={{ width: 12, height: 12, color: '#818cf8' }} aria-hidden="true" />;
};

// Skeleton table row
const SkeletonRow: React.FC = () => (
  <tr>
    {[1, 2, 3, 4, 5, 6, 7].map(i => (
      <td key={i} className="px-4 py-3.5">
        <div className="skeleton h-3.5 rounded" style={{ width: i === 1 ? 120 : 60 }} />
      </td>
    ))}
  </tr>
);

// ── Main Component ─────────────────────────────────────────────────────────────
export const ModelTrainingPage: React.FC = () => {
  const [selectedAlgos, setSelectedAlgos] = useState<string[]>(
    ALL_ALGORITHMS.map(a => a.id)
  );
  const [testSize,  setTestSize]  = useState(0.2);
  const [cvFolds,   setCvFolds]   = useState(5);
  const [comparison, setComparison] = useState<ModelComparison | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelDetail | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [isLoading,  setIsLoading]  = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [trainingPhase, setTrainingPhase] = useState<string>('');

  // Table sort state
  type SortCol = 'model_name' | 'accuracy' | 'precision' | 'recall' | 'f1_score' | 'cv_score_mean';
  const [sortCol, setSortCol] = useState<SortCol>('accuracy');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Fetch already-trained models on load
  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    try {
      const models = await mlService.getAllModels();
      if (models && models.length > 0) {
        const best = models.find(m => m.is_best_model) || models[0];
        setComparison({
          total_models_trained: models.length,
          best_model_name: best.model_name,
          best_model_type: best.model_type,
          best_accuracy: best.accuracy,
          models,
        });
        setSelectedModel(best);
      }
    } catch {
      // No models trained yet — show empty state
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchModels(); }, [fetchModels]);

  const toggleAlgo = (id: string) => {
    setSelectedAlgos(prev =>
      prev.includes(id)
        ? prev.length > 1 ? prev.filter(a => a !== id) : prev
        : [...prev, id]
    );
  };

  // Simulate training phases for UX feedback
  const runTraining = async () => {
    setIsTraining(true);
    setError(null);
    const phases = [
      'Preprocessing dataset…',
      'Fitting algorithms…',
      'Running cross-validation…',
      'Evaluating metrics…',
      'Selecting best model…',
    ];
    let i = 0;
    setTrainingPhase(phases[0]);
    const interval = setInterval(() => {
      i = (i + 1) % phases.length;
      setTrainingPhase(phases[i]);
    }, 1200);

    try {
      const result = await mlService.trainModels({
        selected_algorithms: selectedAlgos,
        test_size: testSize,
        cv_folds: cvFolds,
      });
      clearInterval(interval);
      setComparison(result);
      const winner = result.models.find(m => m.is_best_model) || result.models[0];
      setSelectedModel(winner);
    } catch (err: any) {
      clearInterval(interval);
      setError(err.message || 'Model training failed. Ensure a dataset is uploaded and the backend is running.');
    } finally {
      clearInterval(interval);
      setIsTraining(false);
      setTrainingPhase('');
    }
  };

  // Sort models for table display
  const sortedModels = comparison
    ? [...comparison.models].sort((a, b) => {
        const va = a[sortCol as keyof ModelDetail] as number;
        const vb = b[sortCol as keyof ModelDetail] as number;
        return sortDir === 'asc' ? (va > vb ? 1 : -1) : (va < vb ? 1 : -1);
      })
    : [];

  const handleSort = (col: SortCol) => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const chartData = comparison?.models.map(m => ({
    name: m.model_name.replace(' (Primary)', ''),
    value: +(m.accuracy * 100).toFixed(2),
    isBest: m.is_best_model,
  })) ?? [];

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">

      {/* ── Page Header ──────────────────────────────────────────────────── */}
      <div
        className="card p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.07) 100%)',
          borderColor: 'rgba(99,102,241,0.18)',
        }}
      >
        <div
          className="absolute -right-12 -top-12 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)' }}
          aria-hidden="true"
        />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="badge badge-indigo">
                <BrainCircuit style={{ width: 10, height: 10 }} aria-hidden="true" />
                AutoML
              </span>
              <span className="badge badge-slate">{ALL_ALGORITHMS.length} Algorithms</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Model Training & Evaluation
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Select algorithms, configure hyperparameters, and run automated benchmarking to find the best-performing classifier.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={fetchModels}
              disabled={isLoading || isTraining}
              className="btn btn-secondary btn-sm"
              aria-label="Reload trained models"
            >
              <RefreshCw
                style={{ width: 13, height: 13 }}
                className={isLoading ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              Reload
            </button>
            <button
              onClick={runTraining}
              disabled={isTraining || selectedAlgos.length === 0}
              className={`btn btn-primary btn-sm ${isTraining ? 'btn-loading' : ''}`}
              aria-busy={isTraining}
            >
              {isTraining ? (
                <>
                  <Loader2 className="animate-spin" style={{ width: 13, height: 13 }} aria-hidden="true" />
                  Training…
                </>
              ) : (
                <>
                  <Play style={{ width: 13, height: 13 }} className="fill-current" aria-hidden="true" />
                  Train Models
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Training Progress Banner ──────────────────────────────────────── */}
      {isTraining && (
        <div
          className="rounded-xl border p-4 flex items-center gap-4 animate-fade-in"
          style={{ background: 'rgba(99,102,241,0.06)', borderColor: 'rgba(99,102,241,0.2)' }}
          role="status"
          aria-live="polite"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
            aria-hidden="true"
          >
            <Loader2 className="animate-spin" style={{ width: 20, height: 20 }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Training in Progress
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {trainingPhase || 'Initialising training pipeline…'}
            </p>
          </div>
          <div className="flex-shrink-0 flex gap-1" aria-hidden="true">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-indigo-400"
                style={{ animation: `pulse-ring 1.2s ease-in-out ${i * 0.2}s infinite` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="alert-banner alert-error animate-fade-in-down" role="alert">
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Training Failed</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
          <button onClick={() => setError(null)} className="text-xs underline opacity-70 hover:opacity-100 flex-shrink-0">
            Dismiss
          </button>
        </div>
      )}

      {/* ── Winner Banner ─────────────────────────────────────────────────── */}
      {comparison && !isTraining && (
        <div
          className="rounded-xl border p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 animate-scale-in"
          style={{
            background: 'linear-gradient(135deg, rgba(16,185,129,0.07) 0%, var(--bg-card) 100%)',
            borderColor: 'rgba(16,185,129,0.25)',
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(16,185,129,0.15)', color: '#34d399', boxShadow: '0 0 24px rgba(16,185,129,0.2)' }}
              aria-hidden="true"
            >
              <Trophy style={{ width: 24, height: 24 }} />
            </div>
            <div>
              <span
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: '#34d399' }}
              >
                Winning Classifier
              </span>
              <h3 className="text-lg font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                {comparison.best_model_name}
              </h3>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Auto-selected as highest performing on the held-out test set across {comparison.total_models_trained} models
              </p>
            </div>
          </div>
          <div className="flex items-center gap-6 flex-shrink-0">
            <div className="text-center">
              <p className="text-3xl font-bold font-mono" style={{ color: '#34d399' }}>
                {formatPercent(comparison.best_accuracy)}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>Test Accuracy</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
                {comparison.total_models_trained}
              </p>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Models Evaluated</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Configuration Panel ───────────────────────────────────────────── */}
      <div className="card p-6 space-y-6">
        {/* Section header */}
        <div
          className="flex items-center gap-3 pb-4 border-b"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.14)', color: '#818cf8' }}
            aria-hidden="true"
          >
            <Sliders style={{ width: 17, height: 17 }} />
          </div>
          <div>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Algorithm Selection & Hyperparameters
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Choose algorithms to benchmark · {selectedAlgos.length} of {ALL_ALGORITHMS.length} selected
            </p>
          </div>
        </div>

        {/* Algorithm Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ALL_ALGORITHMS.map(algo => (
            <AlgoCard
              key={algo.id}
              algo={algo}
              selected={selectedAlgos.includes(algo.id)}
              onToggle={() => toggleAlgo(algo.id)}
              disabled={isTraining}
            />
          ))}
        </div>

        {/* Hyperparameter Controls */}
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5">
              <Info style={{ width: 12, height: 12 }} aria-hidden="true" />
              Test Set Split Proportion
            </label>
            <select
              value={testSize}
              onChange={e => setTestSize(parseFloat(e.target.value))}
              disabled={isTraining}
              className="form-select text-sm"
              aria-label="Test set split proportion"
            >
              <option value={0.15}>15% Test / 85% Train</option>
              <option value={0.20}>20% Test / 80% Train (Standard)</option>
              <option value={0.25}>25% Test / 75% Train</option>
              <option value={0.30}>30% Test / 70% Train</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label flex items-center gap-1.5">
              <Info style={{ width: 12, height: 12 }} aria-hidden="true" />
              Cross-Validation Folds (k-fold)
            </label>
            <select
              value={cvFolds}
              onChange={e => setCvFolds(parseInt(e.target.value))}
              disabled={isTraining}
              className="form-select text-sm"
              aria-label="Cross-validation folds"
            >
              <option value={3}>3-Fold Cross Validation</option>
              <option value={5}>5-Fold Cross Validation (Standard)</option>
              <option value={10}>10-Fold Cross Validation</option>
            </select>
          </div>
        </div>

        {/* Train button (bottom of config) */}
        <div className="pt-2">
          <button
            onClick={runTraining}
            disabled={isTraining || selectedAlgos.length === 0}
            className={`btn btn-primary btn-md w-full sm:w-auto ${isTraining ? 'btn-loading' : ''}`}
            aria-busy={isTraining}
          >
            {isTraining ? (
              <>
                <Loader2 className="animate-spin" style={{ width: 15, height: 15 }} aria-hidden="true" />
                Training {selectedAlgos.length} model{selectedAlgos.length !== 1 ? 's' : ''}…
              </>
            ) : (
              <>
                <Play style={{ width: 15, height: 15 }} className="fill-current" aria-hidden="true" />
                Train {selectedAlgos.length} Selected Model{selectedAlgos.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── Evaluation Table ──────────────────────────────────────────────── */}
      {(comparison || isLoading) && (
        <div className="card overflow-hidden animate-fade-in-up">
          {/* Table header */}
          <div
            className="px-6 py-4 flex items-center justify-between border-b"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
          >
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Evaluation Metrics Table
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Click a row to inspect its confusion matrix and feature importances · Click column headers to sort
              </p>
            </div>
            {comparison && (
              <span className="badge badge-slate">
                {comparison.models.length} models evaluated
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="data-table" role="grid" aria-label="Model evaluation metrics">
              <thead>
                <tr>
                  {[
                    { key: 'model_name',    label: 'Algorithm'   },
                    { key: 'accuracy',      label: 'Accuracy'    },
                    { key: 'precision',     label: 'Precision'   },
                    { key: 'recall',        label: 'Recall'      },
                    { key: 'f1_score',      label: 'F1-Score'    },
                    { key: 'cv_score_mean', label: 'CV Mean'     },
                  ].map(col => (
                    <th
                      key={col.key}
                      className="th-sortable"
                      onClick={() => handleSort(col.key as SortCol)}
                      aria-sort={sortCol === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                    >
                      <div className="flex items-center gap-1.5">
                        {col.label}
                        <SortIndicator col={col.key} sortCol={sortCol} dir={sortDir} />
                      </div>
                    </th>
                  ))}
                  <th className="text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  [1, 2, 3, 4, 5, 6].map(i => <SkeletonRow key={i} />)
                ) : sortedModels.map(m => {
                  const isSelected = selectedModel?.id === m.id;
                  return (
                    <tr
                      key={m.id}
                      onClick={() => setSelectedModel(m)}
                      className="cursor-pointer"
                      style={{
                        background: isSelected
                          ? 'rgba(99,102,241,0.07)'
                          : undefined,
                        outline: isSelected
                          ? '1px solid rgba(99,102,241,0.2)'
                          : undefined,
                      }}
                      aria-selected={isSelected}
                      role="row"
                    >
                      <td>
                        <div className="flex items-center gap-2.5">
                          {m.is_best_model && (
                            <Trophy
                              style={{ width: 14, height: 14, color: '#fbbf24', flexShrink: 0 }}
                              aria-label="Best model"
                            />
                          )}
                          <span
                            className="font-semibold text-sm"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {m.model_name.replace(' (Primary)', '')}
                          </span>
                        </div>
                      </td>
                      <td><MetricCell value={m.accuracy}      isBest={m.is_best_model} /></td>
                      <td><MetricCell value={m.precision}     /></td>
                      <td><MetricCell value={m.recall}        /></td>
                      <td><MetricCell value={m.f1_score}      /></td>
                      <td>
                        <div className="flex items-center gap-2">
                          <MetricCell value={m.cv_score_mean} />
                          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                            ±{formatPercent(m.cv_score_std ?? 0)}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        {m.is_best_model ? (
                          <span className="badge badge-emerald">
                            <Trophy style={{ width: 9, height: 9 }} aria-hidden="true" />
                            Winner
                          </span>
                        ) : isSelected ? (
                          <span className="badge badge-indigo">Selected</span>
                        ) : (
                          <span className="text-[11px]" style={{ color: 'var(--text-muted)' }}>Evaluated</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Empty State ───────────────────────────────────────────────────── */}
      {!comparison && !isLoading && !isTraining && (
        <div className="card">
          <div className="empty-state py-16">
            <div
              className="empty-state-icon w-16 h-16"
              style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 18 }}
            >
              <BrainCircuit style={{ width: 28, height: 28 }} aria-hidden="true" />
            </div>
            <p className="empty-state-title">No Models Trained Yet</p>
            <p className="empty-state-desc">
              Select algorithms above and click <strong>Train Selected Models</strong> to benchmark classifiers on the active dataset.
            </p>
            <button onClick={runTraining} className="btn btn-primary btn-md mt-2">
              <Play style={{ width: 14, height: 14 }} className="fill-current" aria-hidden="true" />
              Start Training
            </button>
          </div>
        </div>
      )}

      {/* ── Charts Grid ───────────────────────────────────────────────────── */}
      {comparison && !isLoading && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-up delay-200">
            <BarChartComponent
              data={chartData}
              title="Algorithm Accuracy Comparison"
              subtitle="Test set accuracy across all evaluated classifiers (%)"
              highlightColor="#10b981"
            />
            {selectedModel?.confusion_matrix ? (
              <ConfusionMatrixChart
                labels={selectedModel.confusion_matrix.labels}
                matrix={selectedModel.confusion_matrix.matrix}
                title={`Confusion Matrix · ${selectedModel.model_name.replace(' (Primary)', '')}`}
              />
            ) : (
              <ConfusionMatrixChart />
            )}
          </div>

          {/* Feature Importance */}
          {selectedModel?.feature_importance && (
            <div className="animate-fade-in-up delay-300">
              <FeatureImportanceChart
                featureImportances={selectedModel.feature_importance}
                title={`Feature Importances · ${selectedModel.model_name.replace(' (Primary)', '')}`}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ModelTrainingPage;

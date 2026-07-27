
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Download,
  AlertCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  Trophy,
  FileText,
  Filter,
  TrendingUp,
  Users,
  X,
} from 'lucide-react';

import { predictionService }                         from '../services/predictionService';
import { SinglePredictionResponse, PerformanceCategory } from '../types';
import { formatDate }                                from '../utils/formatters';
import { useNavigate }                               from 'react-router-dom';

// ── Constants ─────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const CATEGORY_STYLES: Record<PerformanceCategory, { badge: string; color: string; dot: string }> = {
  Excellent: { badge: 'perf-excellent', color: '#34d399', dot: 'bg-emerald-400' },
  Good:      { badge: 'perf-good',      color: '#60a5fa', dot: 'bg-blue-400'    },
  Average:   { badge: 'perf-average',   color: '#fbbf24', dot: 'bg-amber-400'   },
  Poor:      { badge: 'perf-poor',      color: '#f87171', dot: 'bg-red-400'     },
};

const ALL_CATEGORIES: PerformanceCategory[] = ['Excellent', 'Good', 'Average', 'Poor'];

// ── Helpers ───────────────────────────────────────────────────────────────────
const getInitials = (name: string): string =>
  name.split(/[\s_#]+/).map(w => w[0] ?? '').join('').slice(0, 2).toUpperCase() || '??';

const topConfidence = (probs: Record<string, number>): number => {
  if (!probs) return 0;
  return Math.max(...Object.values(probs)) * 100;
};

// ── Sub-components ─────────────────────────────────────────────────────────────

// Summary stat strip card
const SummaryChip: React.FC<{
  label: string; value: string | number; icon: React.ReactNode; color: string;
}> = ({ label, value, icon, color }) => (
  <div
    className="card px-4 py-3 flex items-center gap-3"
    style={{ borderColor: `${color}25` }}
  >
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}18`, color }}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div className="min-w-0">
      <p className="text-[11px] font-medium uppercase tracking-wider truncate"
         style={{ color: 'var(--text-muted)' }}>
        {label}
      </p>
      <p className="text-lg font-bold leading-none mt-0.5"
         style={{ color: 'var(--text-primary)' }}>
        {value}
      </p>
    </div>
  </div>
);

// Confidence mini-bar inside table
const ConfidenceBar: React.FC<{ pct: number; color: string }> = ({ pct, color }) => (
  <div className="flex items-center gap-2 min-w-[80px]">
    <div
      className="flex-1 h-1.5 rounded-full overflow-hidden"
      style={{ background: 'var(--bg-elevated)' }}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Confidence: ${pct.toFixed(1)}%`}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${pct}%`,
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
    <span className="text-xs font-mono font-semibold" style={{ color }}>
      {pct.toFixed(0)}%
    </span>
  </div>
);

// Expanded detail panel
const ExpandedDetail: React.FC<{ item: SinglePredictionResponse }> = ({ item }) => {
  const featureLabels: Record<string, string> = {
    attendance:              'Attendance (%)',
    study_hours:             'Study Hours (hrs/wk)',
    previous_semester_marks: 'Previous Marks (%)',
    assignment_score:        'Assignment Score (%)',
    internal_assessment:     'Internal Assessment (%)',
    class_participation:     'Class Participation (%)',
    gender:                  'Gender',
    age:                     'Age',
    internet_access:         'Internet Access',
    parental_education:      'Parental Education',
    family_income:           'Family Income',
    extra_curricular_activities: 'Extra-Curricular',
  };

  const features = item.input_features ?? {};
  const probs    = item.confidence_probabilities ?? {};
  const sorted   = Object.entries(probs).sort(([, a], [, b]) => b - a);

  return (
    <div
      className="animate-fade-in-down border-t"
      style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x"
           style={{ borderColor: 'var(--border-subtle)' }}>

        {/* Input Features */}
        <div className="p-5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)' }}>
            Input Features
          </h4>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2">
            {Object.entries(featureLabels).map(([key, label]) => {
              const val = features[key];
              if (val === undefined || val === null) return null;
              return (
                <div key={key} className="flex items-center justify-between gap-2">
                  <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                    {label}
                  </span>
                  <span className="text-xs font-semibold font-mono flex-shrink-0"
                        style={{ color: 'var(--text-primary)' }}>
                    {typeof val === 'number' ? val : String(val)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidence Probabilities */}
        <div className="p-5">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider mb-3"
              style={{ color: 'var(--text-muted)' }}>
            Model Confidence Scores
          </h4>
          <div className="space-y-3">
            {sorted.map(([cat, prob]) => {
              const cfg = CATEGORY_STYLES[cat as PerformanceCategory];
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {cat === sorted[0][0] && (
                        <Trophy style={{ width: 10, height: 10, color: '#fbbf24' }} aria-hidden="true" />
                      )}
                      <span style={{ color: 'var(--text-secondary)', fontWeight: cat === sorted[0][0] ? 600 : 400 }}>
                        {cat}
                      </span>
                    </div>
                    <span className="font-mono font-semibold" style={{ color: cfg?.color ?? '#94a3b8' }}>
                      {(prob * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${(prob * 100).toFixed(1)}%`,
                        background: `linear-gradient(90deg, ${cfg?.color ?? '#818cf8'}80, ${cfg?.color ?? '#818cf8'})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div
            className="mt-3 pt-3 border-t flex items-center justify-between text-xs"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Model:</span>
            <span className="font-semibold" style={{ color: '#a5b4fc' }}>{item.model_used}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// Skeleton table row
const SkeletonRow: React.FC = () => (
  <tr>
    {[40, 100, 80, 60, 60, 60, 80, 70].map((w, i) => (
      <td key={i} className="px-4 py-3.5">
        <div className="skeleton h-3.5 rounded" style={{ width: w }} />
      </td>
    ))}
  </tr>
);

// ── CSV Export ─────────────────────────────────────────────────────────────────
const exportToCSV = (records: SinglePredictionResponse[]) => {
  const headers = ['ID', 'Student', 'Category', 'Attendance', 'Study Hours', 'Previous Marks', 'Model', 'Timestamp'];
  const rows = records.map(r => [
    r.id ?? '',
    r.student_identifier,
    r.predicted_category,
    r.input_features?.attendance ?? '',
    r.input_features?.study_hours ?? '',
    r.input_features?.previous_semester_marks ?? '',
    r.model_used,
    formatDate(r.created_at),
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `prediction-history-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

// ── Main Component ─────────────────────────────────────────────────────────────
export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [history,          setHistory]          = useState<SinglePredictionResponse[]>([]);
  const [searchQuery,      setSearchQuery]      = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [sortCol,          setSortCol]          = useState<'created_at' | 'predicted_category'>('created_at');
  const [sortDir,          setSortDir]          = useState<'asc' | 'desc'>('desc');
  const [currentPage,      setCurrentPage]      = useState(1);
  const [expandedId,       setExpandedId]       = useState<number | string | null>(null);
  const [isLoading,        setIsLoading]        = useState(true);
  const [error,            setError]            = useState<string | null>(null);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await predictionService.getHistory(200);
      setHistory(response.predictions ?? []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve prediction history.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Derived: filter + sort ───────────────────────────────────────────────
  const filtered = useMemo(() => {
    let data = [...history];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(
        r =>
          r.student_identifier.toLowerCase().includes(q) ||
          r.model_used.toLowerCase().includes(q) ||
          r.predicted_category.toLowerCase().includes(q)
      );
    }
    if (selectedCategory !== 'ALL') {
      data = data.filter(r => r.predicted_category === selectedCategory);
    }
    data.sort((a, b) => {
      if (sortCol === 'created_at') {
        const diff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
      const diff = a.predicted_category.localeCompare(b.predicted_category);
      return sortDir === 'asc' ? diff : -diff;
    });
    return data;
  }, [history, searchQuery, selectedCategory, sortCol, sortDir]);

  // Reset to page 1 when filter changes
  useEffect(() => setCurrentPage(1), [searchQuery, selectedCategory, sortCol, sortDir]);

  // ── Pagination ───────────────────────────────────────────────────────────
  const totalPages   = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageStart    = (currentPage - 1) * PAGE_SIZE;
  const paginatedRows = filtered.slice(pageStart, pageStart + PAGE_SIZE);

  // ── Summary Stats ────────────────────────────────────────────────────────
  const todayCount = useMemo(() => {
    const today = new Date().toDateString();
    return history.filter(r => new Date(r.created_at).toDateString() === today).length;
  }, [history]);

  const categoryCounts = useMemo(
    () => ALL_CATEGORIES.reduce((acc, cat) => ({
      ...acc,
      [cat]: history.filter(r => r.predicted_category === cat).length,
    }), {} as Record<string, number>),
    [history]
  );

  const toggleSort = (col: 'created_at' | 'predicted_category') => {
    if (col === sortCol) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortCol(col); setSortDir('desc'); }
  };

  const toggleExpand = (id: number | string | undefined) => {
    if (id === undefined) return;
    setExpandedId(prev => prev === id ? null : id);
  };

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
                <History style={{ width: 10, height: 10 }} aria-hidden="true" />
                Audit Trail
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Immutable prediction log · {history.length} total records
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Prediction History
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Complete audit trail of all student performance inferences, feature inputs, and ML model outputs.
            </p>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => exportToCSV(filtered)}
              disabled={filtered.length === 0}
              className="btn btn-secondary btn-sm"
              aria-label="Export filtered records to CSV"
              title="Export to CSV"
            >
              <Download style={{ width: 13, height: 13 }} aria-hidden="true" />
              Export CSV
            </button>
            <button
              onClick={fetchHistory}
              disabled={isLoading}
              className="btn btn-secondary btn-sm"
              aria-label="Refresh audit log"
            >
              <RefreshCw
                style={{ width: 13, height: 13 }}
                className={isLoading ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* ── Summary Chips ─────────────────────────────────────────────────── */}
      {!isLoading && history.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in-up delay-100">
          <SummaryChip
            label="Total Predictions"
            value={history.length}
            icon={<Users style={{ width: 15, height: 15 }} />}
            color="#818cf8"
          />
          <SummaryChip
            label="Today"
            value={todayCount}
            icon={<Clock style={{ width: 15, height: 15 }} />}
            color="#60a5fa"
          />
          {ALL_CATEGORIES.map((cat, i) => {
            const cfg = CATEGORY_STYLES[cat];
            return (
              <SummaryChip
                key={cat}
                label={cat}
                value={categoryCounts[cat]}
                icon={<TrendingUp style={{ width: 15, height: 15 }} />}
                color={cfg.color}
              />
            );
          })}
        </div>
      )}

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div className="alert-banner alert-error animate-fade-in-down" role="alert">
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0 }} aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Failed to load history</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
          <button onClick={fetchHistory} className="btn btn-secondary btn-sm flex-shrink-0">
            <RefreshCw style={{ width: 12, height: 12 }} aria-hidden="true" /> Retry
          </button>
        </div>
      )}

      {/* ── Search + Category Filter ──────────────────────────────────────── */}
      <div
        className="card px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ width: 14, height: 14, color: 'var(--text-muted)' }}
            aria-hidden="true"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search student, model, category…"
            className="form-input pl-9 pr-7 text-sm h-9 w-full"
            aria-label="Search prediction history"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              aria-label="Clear history search"
            >
              <X style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Filter by category">
          <Filter style={{ width: 13, height: 13, color: 'var(--text-muted)', flexShrink: 0 }} aria-hidden="true" />
          {['ALL', ...ALL_CATEGORIES].map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`tab-item text-xs py-1 px-3 ${selectedCategory === cat ? 'active' : ''}`}
              aria-pressed={selectedCategory === cat}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Result count */}
        <span className="text-xs flex-shrink-0 ml-auto" style={{ color: 'var(--text-muted)' }}>
          {filtered.length} result{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Audit Table ───────────────────────────────────────────────────── */}
      <div className="card overflow-hidden animate-fade-in-up delay-200">
        {/* Table header bar */}
        <div
          className="px-6 py-3.5 flex items-center justify-between border-b"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Prediction Records
          </h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Click any row to expand feature details
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="data-table" role="grid" aria-label="Prediction history audit table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>#</th>
                <th>Student</th>
                <th
                  className="th-sortable"
                  onClick={() => toggleSort('predicted_category')}
                  aria-sort={sortCol === 'predicted_category' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center gap-1">
                    Category
                    {sortCol === 'predicted_category'
                      ? (sortDir === 'asc' ? <ChevronUp style={{ width: 11, height: 11, color: '#818cf8' }} aria-hidden="true" /> : <ChevronDown style={{ width: 11, height: 11, color: '#818cf8' }} aria-hidden="true" />)
                      : <ChevronDown style={{ width: 11, height: 11, opacity: 0.35 }} aria-hidden="true" />
                    }
                  </div>
                </th>
                <th>Confidence</th>
                <th className="hidden md:table-cell">Attendance</th>
                <th className="hidden md:table-cell">Study Hrs</th>
                <th className="hidden lg:table-cell">Past Score</th>
                <th className="hidden lg:table-cell">Model</th>
                <th
                  className="th-sortable text-right"
                  onClick={() => toggleSort('created_at')}
                  aria-sort={sortCol === 'created_at' ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none'}
                >
                  <div className="flex items-center justify-end gap-1">
                    Timestamp
                    {sortCol === 'created_at'
                      ? (sortDir === 'asc' ? <ChevronUp style={{ width: 11, height: 11, color: '#818cf8' }} aria-hidden="true" /> : <ChevronDown style={{ width: 11, height: 11, color: '#818cf8' }} aria-hidden="true" />)
                      : <ChevronDown style={{ width: 11, height: 11, opacity: 0.35 }} aria-hidden="true" />
                    }
                  </div>
                </th>
                <th style={{ width: 36 }} />
              </tr>
            </thead>

            <tbody>
              {/* Loading skeletons */}
              {isLoading && [1,2,3,4,5,6,7,8].map(i => <SkeletonRow key={i} />)}

              {/* Populated rows */}
              {!isLoading && paginatedRows.map((item) => {
                const rowId  = item.id ?? item.created_at;
                const isExp  = expandedId === rowId;
                const cfg    = CATEGORY_STYLES[item.predicted_category] ?? CATEGORY_STYLES.Average;
                const topConf = topConfidence(item.confidence_probabilities);

                return (
                  <React.Fragment key={rowId}>
                    <tr
                      className="cursor-pointer"
                      style={isExp ? { background: 'rgba(99,102,241,0.05)' } : undefined}
                      onClick={() => toggleExpand(rowId)}
                      aria-expanded={isExp}
                    >
                      {/* Row # */}
                      <td>
                        <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
                          {(item.id ?? '–')}
                        </span>
                      </td>

                      {/* Student name + avatar */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                            style={{
                              background: `${cfg.color}18`,
                              color: cfg.color,
                              border: `1px solid ${cfg.color}30`,
                            }}
                            aria-hidden="true"
                          >
                            {getInitials(item.student_identifier)}
                          </div>
                          <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                            {item.student_identifier}
                          </span>
                        </div>
                      </td>

                      {/* Category badge */}
                      <td>
                        <span className={cfg.badge}>{item.predicted_category}</span>
                      </td>

                      {/* Confidence bar */}
                      <td>
                        <ConfidenceBar pct={topConf} color={cfg.color} />
                      </td>

                      {/* Attendance */}
                      <td className="hidden md:table-cell">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {item.input_features?.attendance != null
                            ? `${item.input_features.attendance}%`
                            : '—'}
                        </span>
                      </td>

                      {/* Study hours */}
                      <td className="hidden md:table-cell">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {item.input_features?.study_hours != null
                            ? `${item.input_features.study_hours}h`
                            : '—'}
                        </span>
                      </td>

                      {/* Previous marks */}
                      <td className="hidden lg:table-cell">
                        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                          {item.input_features?.previous_semester_marks != null
                            ? `${item.input_features.previous_semester_marks}%`
                            : '—'}
                        </span>
                      </td>

                      {/* Model used */}
                      <td className="hidden lg:table-cell">
                        <span className="text-xs font-medium" style={{ color: '#a5b4fc' }}>
                          {item.model_used}
                        </span>
                      </td>

                      {/* Timestamp */}
                      <td className="text-right">
                        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                          {formatDate(item.created_at)}
                        </span>
                      </td>

                      {/* Expand toggle */}
                      <td>
                        <div
                          className="w-6 h-6 rounded-md flex items-center justify-center transition-colors"
                          style={{ color: isExp ? '#818cf8' : 'var(--text-muted)', background: isExp ? 'rgba(99,102,241,0.12)' : 'transparent' }}
                          aria-hidden="true"
                        >
                          {isExp
                            ? <ChevronUp style={{ width: 13, height: 13 }} />
                            : <ChevronDown style={{ width: 13, height: 13 }} />
                          }
                        </div>
                      </td>
                    </tr>

                    {/* Expanded detail row */}
                    {isExp && (
                      <tr>
                        <td colSpan={10} style={{ padding: 0 }}>
                          <ExpandedDetail item={item} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}

              {/* Empty state */}
              {!isLoading && paginatedRows.length === 0 && (
                <tr>
                  <td colSpan={10}>
                    <div className="empty-state py-14">
                      <div
                        className="empty-state-icon w-14 h-14"
                        style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8', borderRadius: 16 }}
                      >
                        <Clock style={{ width: 24, height: 24 }} aria-hidden="true" />
                      </div>
                      <p className="empty-state-title">No Prediction Records Found</p>
                      <p className="empty-state-desc">
                        {searchQuery || selectedCategory !== 'ALL'
                          ? 'No records match your current filters. Try clearing the search or category.'
                          : 'Run predictions on the Predict page to start building an audit trail.'}
                      </p>
                      <button
                        onClick={() => navigate('/predict')}
                        className="btn btn-primary btn-md mt-2"
                      >
                        <Sparkles style={{ width: 14, height: 14 }} aria-hidden="true" />
                        Run First Prediction
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Pagination Footer ──────────────────────────────────────────── */}
        {filtered.length > PAGE_SIZE && (
          <div
            className="px-6 py-3.5 flex items-center justify-between border-t"
            style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
          >
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filtered.length)} of {filtered.length}
            </p>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="btn btn-ghost btn-sm p-2 rounded-lg"
                aria-label="Previous page"
              >
                <ChevronLeft style={{ width: 15, height: 15 }} aria-hidden="true" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = i + 1;
                return (
                  <button
                    key={pg}
                    onClick={() => setCurrentPage(pg)}
                    className={`btn btn-sm rounded-lg px-3 py-1.5 text-xs ${
                      currentPage === pg ? 'btn-primary' : 'btn-ghost'
                    }`}
                    aria-label={`Page ${pg}`}
                    aria-current={currentPage === pg ? 'page' : undefined}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="btn btn-ghost btn-sm p-2 rounded-lg"
                aria-label="Next page"
              >
                <ChevronRightIcon style={{ width: 15, height: 15 }} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;

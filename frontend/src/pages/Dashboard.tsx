
import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  TrendingUp,
  BookOpen,
  Search,
  Sparkles,
  Clock,
  Award,
  Sliders,
  CheckCircle2,
  RefreshCw,
  Zap,
  BrainCircuit,
  ChevronRight,
  ArrowUpRight,
  BarChart2,
  Target,
  Shield,
  X,
} from 'lucide-react';

import { MetricCard }        from '../components/MetricCard';
import { BarChartComponent } from '../charts/BarChartComponent';
import { PieChartComponent } from '../charts/PieChartComponent';
import { dashboardService }  from '../services/dashboardService';
import { DashboardStats }    from '../types';

// ── Types ──────────────────────────────────────────────────────────────────────
interface StudentRoster {
  id: number;
  name: string;
  attendance: number;
  studyHours: number;
  previousMarks: number;
  predictedScore: number;
  riskLevel: 'Low' | 'Medium' | 'High';
}

// ── Static Student Roster Data ────────────────────────────────────────────────
const STUDENT_ROSTER: StudentRoster[] = [
  { id: 1, name: 'James Smith',    attendance: 58, studyHours: 6,  previousMarks: 52, predictedScore: 48, riskLevel: 'High'   },
  { id: 2, name: 'Maria Garcia',   attendance: 72, studyHours: 12, previousMarks: 64, predictedScore: 65, riskLevel: 'Medium' },
  { id: 3, name: 'Alex Johnson',   attendance: 95, studyHours: 24, previousMarks: 88, predictedScore: 89, riskLevel: 'Low'    },
  { id: 4, name: 'Linda Chen',     attendance: 88, studyHours: 20, previousMarks: 85, predictedScore: 92, riskLevel: 'Low'    },
  { id: 5, name: 'David Miller',   attendance: 61, studyHours: 8,  previousMarks: 55, predictedScore: 54, riskLevel: 'High'   },
  { id: 6, name: 'Priya Sharma',   attendance: 90, studyHours: 22, previousMarks: 91, predictedScore: 94, riskLevel: 'Low'    },
  { id: 7, name: 'Ravi Patel',     attendance: 65, studyHours: 9,  previousMarks: 58, predictedScore: 57, riskLevel: 'High'   },
];

// ── Risk pill helper ──────────────────────────────────────────────────────────
const RiskPill: React.FC<{ level: 'Low' | 'Medium' | 'High' }> = ({ level }) => {
  const map = {
    High:   { cls: 'badge badge-red',    label: 'High Risk'   },
    Medium: { cls: 'badge badge-amber',  label: 'Medium Risk' },
    Low:    { cls: 'badge badge-emerald',label: 'Low Risk'    },
  };
  const { cls, label } = map[level];
  return <span className={cls}>{label}</span>;
};

// ── Score Gauge Mini ──────────────────────────────────────────────────────────
const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
  const color = score >= 75 ? '#34d399' : score >= 62 ? '#fbbf24' : '#f87171';
  const pct   = Math.min(100, Math.max(0, score));
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative w-8 h-8 flex-shrink-0"
        aria-label={`Score: ${score}%`}
        role="img"
      >
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="var(--border-default)" strokeWidth="4" />
          <circle
            cx="18" cy="18" r="14"
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeDasharray={`${(pct / 100) * 87.96} 87.96`}
            strokeLinecap="round"
            style={{ transition: 'stroke-dasharray 0.6s ease' }}
          />
        </svg>
      </div>
      <span className="text-sm font-bold" style={{ color }}>
        {score}%
      </span>
    </div>
  );
};

// ── Feature Contribution Bar ──────────────────────────────────────────────────
const ContribBar: React.FC<{
  label: string;
  value: number;
  color: string;
  textColor: string;
}> = ({ label, value, color, textColor }) => (
  <div className="space-y-1.5">
    <div className="flex items-center justify-between text-xs">
      <span style={{ color: 'var(--text-secondary)' }} className="font-medium">{label}</span>
      <span style={{ color: textColor }} className="font-mono font-bold">+{value}%</span>
    </div>
    <div className="progress-bar">
      <div
        className="progress-fill"
        style={{
          width: `${Math.min(100, value)}%`,
          background: `linear-gradient(90deg, ${color}aa, ${color})`,
          transition: 'width 0.4s cubic-bezier(0.4,0,0.2,1)',
        }}
      />
    </div>
  </div>
);

// ── SimSlider ─────────────────────────────────────────────────────────────────
const SimSlider: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  accentColor: string;
  onChange: (v: number) => void;
  minLabel?: string;
  midLabel?: string;
  maxLabel?: string;
}> = ({ icon, label, value, min, max, unit, accentColor, onChange, minLabel, midLabel, maxLabel }) => (
  <div
    className="space-y-3 p-4 rounded-xl border"
    style={{
      background: 'var(--bg-elevated)',
      borderColor: 'var(--border-subtle)',
    }}
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: accentColor }} aria-hidden="true">{icon}</span>
        {label}
      </div>
      <span
        className="px-2.5 py-1 rounded-lg text-sm font-bold font-mono"
        style={{
          background: `${accentColor}18`,
          color: accentColor,
          border: `1px solid ${accentColor}30`,
        }}
      >
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={e => onChange(Number(e.target.value))}
      className="w-full"
      aria-label={`${label}: ${value}${unit}`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    />
    {(minLabel || midLabel || maxLabel) && (
      <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
        {minLabel && <span>{minLabel}</span>}
        {midLabel && <span>{midLabel}</span>}
        {maxLabel && <span>{maxLabel}</span>}
      </div>
    )}
  </div>
);

// ── Quick Action Card ─────────────────────────────────────────────────────────
const QuickActionCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  onClick: () => void;
}> = ({ icon, label, description, color, onClick }) => (
  <button
    onClick={onClick}
    className="
      card-interactive p-4 text-left w-full group
      flex items-center gap-4
    "
    style={{ borderColor: 'var(--border-default)' }}
  >
    <div
      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-110"
      style={{ background: `${color}20`, color }}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{label}</p>
      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{description}</p>
    </div>
    <ChevronRight
      className="flex-shrink-0 transition-transform duration-200 group-hover:translate-x-1"
      style={{ width: 16, height: 16, color: 'var(--text-muted)' }}
      aria-hidden="true"
    />
  </button>
);

// ── Error State ───────────────────────────────────────────────────────────────
const DashboardError: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <div className="card p-8 flex flex-col items-center gap-4 text-center" role="alert">
    <div
      className="w-14 h-14 rounded-2xl flex items-center justify-center"
      style={{ background: 'rgba(239,68,68,0.1)', color: '#f87171' }}
    >
      <AlertTriangle style={{ width: 24, height: 24 }} aria-hidden="true" />
    </div>
    <div>
      <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
        Failed to load dashboard
      </h3>
      <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{message}</p>
    </div>
    <button onClick={onRetry} className="btn btn-primary btn-md">
      <RefreshCw style={{ width: 14, height: 14 }} aria-hidden="true" /> Try Again
    </button>
  </div>
);

// ── Main Dashboard ────────────────────────────────────────────────────────────
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();

  // ── API State ───────────────────────────────────────────────────────────────
  const [stats,     setStats]     = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // ── Table State ─────────────────────────────────────────────────────────────
  const [searchQuery,  setSearchQuery]  = useState('');
  const [riskFilter,   setRiskFilter]   = useState<'All' | 'High' | 'Medium' | 'Low'>('All');
  const [dismissAlert, setDismissAlert] = useState(false);

  // ── What-If Simulator State ─────────────────────────────────────────────────
  const [simAttendance,    setSimAttendance]    = useState(75);
  const [simStudyHours,    setSimStudyHours]    = useState(12);
  const [simPreviousMarks, setSimPreviousMarks] = useState(68);
  const [simSleepHours,    setSimSleepHours]    = useState(7);
  const [simTutoring,      setSimTutoring]      = useState(2);
  const [simPredictedScore, setSimPredictedScore] = useState(65);
  const [simRiskLevel,      setSimRiskLevel]      = useState<'Low' | 'Moderate' | 'High'>('Moderate');

  // ── Recalculate simulation output ───────────────────────────────────────────
  useEffect(() => {
    const raw = (
      0.38 * simAttendance +
      0.32 * simPreviousMarks +
      0.20 * (simStudyHours * 2.5) +
      0.05 * (simSleepHours * 10) +
      0.05 * (simTutoring * 12.5)
    );
    const score = Math.min(99, Math.max(35, Math.round(raw)));
    setSimPredictedScore(score);
    setSimRiskLevel(score < 60 ? 'High' : score < 72 ? 'Moderate' : 'Low');
  }, [simAttendance, simStudyHours, simPreviousMarks, simSleepHours, simTutoring]);

  // ── Fetch Stats ─────────────────────────────────────────────────────────────
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await dashboardService.getDashboardStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // ── Derived Data ─────────────────────────────────────────────────────────────
  const summary = stats?.summary_cards ?? {
    total_datasets: 1,
    total_models_trained: 7,
    total_predictions_made: 6607,
    best_performing_model: 'LightGBM Classifier',
    best_model_accuracy: 89.82,
  };

  const studentStats = stats?.student_statistics ?? {
    avg_attendance: 80.0,
    avg_study_hours: 20.0,
    avg_previous_marks: 75.1,
    total_students: 6607,
  };

  const pieData = stats?.performance_distribution?.map(item => ({
    name: item.category,
    value: item.count,
  })) ?? [
    { name: 'Average (62–68)',  value: 3283 },
    { name: 'Good (68–75)',     value: 2884 },
    { name: 'Poor (<62)',       value: 316  },
    { name: 'Excellent (>75)', value: 124  },
  ];

  const barData = stats?.model_comparison?.map(item => ({
    name: item.model_name.replace(' (Primary)', '').replace(/\s*⭐+/g, ''),
    value: item.accuracy,
    isBest: item.is_best,
  })) ?? [
    { name: 'LightGBM',    value: 89.82, isBest: true },
    { name: 'XGBoost',     value: 88.56, isBest: false },
    { name: 'SVM',         value: 88.33, isBest: false },
    { name: 'Logistic R.', value: 85.02, isBest: false },
    { name: 'Random Frst', value: 83.58, isBest: false },
    { name: 'Dec. Tree',   value: 77.59, isBest: false },
    { name: 'KNN',         value: 72.83, isBest: false },
  ];

  const handleViewAtRiskStudents = () => {
    setRiskFilter('High');
    setSearchQuery('');
    const element = document.getElementById('roster-section');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Feature contribution calculations
  const contribAttendance  = Math.round((simAttendance  * 0.38 / simPredictedScore) * 100);
  const contribPrevious    = Math.round((simPreviousMarks * 0.32 / simPredictedScore) * 100);
  const contribStudy       = Math.round(((simStudyHours * 2.5) * 0.20 / simPredictedScore) * 100);
  const contribOther       = Math.max(2, 100 - contribAttendance - contribPrevious - contribStudy);

  // Filtered roster
  const filteredStudents = STUDENT_ROSTER.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRisk   = riskFilter === 'All' || s.riskLevel === riskFilter;
    return matchesSearch && matchesRisk;
  });

  const handleLoadScenario = (student: StudentRoster) => {
    setSimAttendance(student.attendance);
    setSimStudyHours(student.studyHours);
    setSimPreviousMarks(student.previousMarks);
    document.getElementById('simulator-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // ── Risk color for simulator ─────────────────────────────────────────────
  const riskColors = {
    Low:      { badge: 'badge badge-emerald', glow: '#10b981' },
    Moderate: { badge: 'badge badge-amber',   glow: '#f59e0b' },
    High:     { badge: 'badge badge-red',     glow: '#ef4444' },
  };
  const scoreColor = simPredictedScore >= 75 ? '#34d399' : simPredictedScore >= 62 ? '#fbbf24' : '#f87171';

  // ── Metric Card Sparklines ───────────────────────────────────────────────
  const sparklineStudents = [{ value: 5200 }, { value: 5600 }, { value: 5900 }, { value: 6100 }, { value: 6400 }, { value: 6607 }];
  const sparklineScore    = [{ value: 70 }, { value: 72 }, { value: 73.4 }, { value: 74.1 }, { value: 75.1 }];
  const sparklineAcc      = [{ value: 82 }, { value: 84 }, { value: 86 }, { value: 88.5 }, { value: 89.82 }];

  return (
    <div className="space-y-6 pb-12 animate-fade-in-up">

      {/* ── 1. Welcome Banner ─────────────────────────────────────────────── */}
      <div
        className="card p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--bg-card) 0%, rgba(99,102,241,0.08) 100%)',
          borderColor: 'rgba(99,102,241,0.2)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute -right-16 -top-16 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
          aria-hidden="true"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            {/* Breadcrumb-style subtitle */}
            <div className="flex items-center gap-2 mb-2">
              <span className="badge badge-indigo">
                <BrainCircuit style={{ width: 10, height: 10 }} aria-hidden="true" />
                ML Platform
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Active model: {summary.best_performing_model} · {summary.best_model_accuracy.toFixed(2)}% accuracy
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Analytics Dashboard
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Explore student performance predictions, ML model metrics, and intervention insights.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={fetchStats}
              disabled={isLoading}
              className="btn btn-secondary btn-sm"
              aria-label="Refresh dashboard statistics"
            >
              <RefreshCw
                style={{ width: 13, height: 13 }}
                className={isLoading ? 'animate-spin' : ''}
                aria-hidden="true"
              />
              Refresh
            </button>
            <button
              onClick={() => navigate('/predict')}
              className="btn btn-primary btn-sm"
            >
              <Sparkles style={{ width: 13, height: 13 }} aria-hidden="true" />
              New Prediction
            </button>
          </div>
        </div>
      </div>

      {/* ── 2. At-Risk Alert Banner ────────────────────────────────────────── */}
      {!dismissAlert && (
        <div
          className="rounded-xl border p-4 flex items-start gap-4 relative animate-fade-in"
          style={{
            background: 'rgba(239,68,68,0.06)',
            borderColor: 'rgba(239,68,68,0.2)',
          }}
          role="alert"
          aria-live="polite"
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
            style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171' }}
            aria-hidden="true"
          >
            <AlertTriangle style={{ width: 18, height: 18 }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="badge badge-red">Priority Alert</span>
              <span className="text-xs font-semibold" style={{ color: '#fca5a5' }}>
                316 students predicted at high academic risk (Score &lt; 62%)
              </span>
            </div>
            <p className="text-xs mt-1.5 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
              The LightGBM classifier flagged students with attendance below 70% and study hours under 10 hrs/week.
              Immediate academic intervention is recommended.
            </p>
            <div className="flex items-center gap-3 mt-3">
              <button
                onClick={handleViewAtRiskStudents}
                className="btn btn-danger btn-sm"
              >
                View At-Risk Students
              </button>
              <button
                onClick={() => navigate('/predict')}
                className="btn btn-secondary btn-sm"
              >
                <ArrowUpRight style={{ width: 12, height: 12 }} aria-hidden="true" />
                Run Intervention Scenario
              </button>
            </div>
          </div>
          <button
            onClick={() => setDismissAlert(true)}
            className="btn btn-ghost p-1.5 rounded-lg flex-shrink-0"
            aria-label="Dismiss alert"
          >
            <X style={{ width: 14, height: 14 }} aria-hidden="true" />
          </button>
        </div>
      )}

      {/* ── 3. Metric Cards Row ────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <MetricCard key={i} title="" value="" icon={null} loading={true} />
          ))}
        </div>
      ) : error ? (
        <DashboardError message={error} onRetry={fetchStats} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="animate-fade-in-up delay-100">
            <MetricCard
              title="Total Students"
              value={studentStats.total_students}
              subtitle="Active enrolled records"
              icon={<Users style={{ width: 18, height: 18 }} />}
              color="indigo"
              trend="+407 this semester"
              trendPositive={true}
              sparkline={sparklineStudents}
              onClick={() => navigate('/dataset')}
            />
          </div>
          <div className="animate-fade-in-up delay-200">
            <MetricCard
              title="Average Score"
              value={`${studentStats.avg_previous_marks.toFixed(1)}%`}
              subtitle="Classwide mean predicted score"
              icon={<TrendingUp style={{ width: 18, height: 18 }} />}
              color="emerald"
              trend="+2.1% vs last semester"
              trendPositive={true}
              sparkline={sparklineScore}
            />
          </div>
          <div className="animate-fade-in-up delay-300">
            <MetricCard
              title="At-Risk Students"
              value={316}
              subtitle="Predicted score below 62%"
              icon={<AlertTriangle style={{ width: 18, height: 18 }} />}
              color="red"
              trend="−2.4% vs last semester"
              trendPositive={true}
              onClick={handleViewAtRiskStudents}
            />
          </div>
          <div className="animate-fade-in-up delay-400">
            <MetricCard
              title="Best Model Accuracy"
              value={`${summary.best_model_accuracy.toFixed(1)}%`}
              subtitle={summary.best_performing_model}
              icon={<Award style={{ width: 18, height: 18 }} />}
              color="purple"
              trend="30-iteration stable"
              trendPositive={true}
              sparkline={sparklineAcc}
              onClick={() => navigate('/models')}
            />
          </div>
        </div>
      )}

      {/* ── 4. What-If Simulator + Explainability ─────────────────────────── */}
      <div
        id="simulator-section"
        className="card p-6 animate-fade-in-up delay-200"
        style={{ borderColor: 'rgba(99,102,241,0.18)' }}
      >
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
          <div className="flex items-start gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
              style={{ background: 'rgba(99,102,241,0.15)', color: '#818cf8' }}
              aria-hidden="true"
            >
              <Sliders style={{ width: 18, height: 18 }} />
            </div>
            <div>
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                What-If Prediction Simulator
              </h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                Adjust student metrics in real-time to simulate ML score predictions and feature contributions.
              </p>
            </div>
          </div>
          <span className="badge badge-emerald flex items-center gap-1.5">
            <Zap style={{ width: 10, height: 10 }} aria-hidden="true" />
            Real-time Inference Engine
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left: Sliders */}
          <div className="lg:col-span-7 space-y-4">
            <SimSlider
              icon={<TrendingUp style={{ width: 15, height: 15 }} />}
              label="Attendance Rate"
              value={simAttendance}
              min={50} max={100} unit="%"
              accentColor="#818cf8"
              onChange={setSimAttendance}
              minLabel="50% (High Risk)"
              midLabel="75% (Average)"
              maxLabel="100% (Optimal)"
            />
            <SimSlider
              icon={<Clock style={{ width: 15, height: 15 }} />}
              label="Weekly Study Hours"
              value={simStudyHours}
              min={1} max={40} unit=" hrs/wk"
              accentColor="#c084fc"
              onChange={setSimStudyHours}
              minLabel="1 hr"
              midLabel="20 hrs"
              maxLabel="40 hrs"
            />
            <SimSlider
              icon={<BookOpen style={{ width: 15, height: 15 }} />}
              label="Previous Exam Score"
              value={simPreviousMarks}
              min={40} max={100} unit="%"
              accentColor="#34d399"
              onChange={setSimPreviousMarks}
              minLabel="40%"
              midLabel="70%"
              maxLabel="100%"
            />
          </div>

          {/* Right: Prediction Output + Feature Bars */}
          <div
            className="lg:col-span-5 rounded-xl p-5 space-y-5 border"
            style={{
              background: 'var(--bg-elevated)',
              borderColor: 'var(--border-default)',
            }}
          >
            {/* Score Output */}
            <div
              className="flex items-center justify-between pb-4 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  Predicted Final Score
                </p>
                <p
                  className="text-4xl font-bold font-mono mt-1 transition-all duration-300"
                  style={{ color: scoreColor }}
                  aria-live="polite"
                  aria-label={`Predicted score: ${simPredictedScore}%`}
                >
                  {simPredictedScore}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--text-muted)' }}>
                  Risk Level
                </p>
                <span
                  className={riskColors[simRiskLevel].badge}
                  aria-live="polite"
                  aria-label={`Risk level: ${simRiskLevel}`}
                >
                  {simRiskLevel} Risk
                </span>
              </div>
            </div>

            {/* Feature Explainability */}
            <div className="space-y-3">
              <h4
                className="text-[11px] font-semibold uppercase tracking-wider"
                style={{ color: 'var(--text-muted)' }}
              >
                Feature Explainability
              </h4>
              <ContribBar label="Attendance Impact"     value={contribAttendance} color="#6366f1" textColor="#a5b4fc" />
              <ContribBar label="Past Performance"      value={contribPrevious}   color="#f59e0b" textColor="#fcd34d" />
              <ContribBar label="Study Hours Impact"    value={contribStudy}      color="#10b981" textColor="#6ee7b7" />
              <ContribBar label="Other Factors"         value={contribOther}      color="#8b5cf6" textColor="#c4b5fd" />
            </div>

            {/* Navigate to full predictor */}
            <button
              onClick={() => navigate('/predict')}
              className="btn btn-primary btn-sm w-full"
            >
              <Sparkles style={{ width: 13, height: 13 }} aria-hidden="true" />
              Full Prediction Form
              <ChevronRight style={{ width: 13, height: 13 }} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {/* ── 5. Student Roster Table ────────────────────────────────────────── */}
      <div id="roster-section" className="card overflow-hidden animate-fade-in-up delay-300">
        {/* Table Header */}
        <div
          className="px-6 py-4 flex flex-wrap items-center justify-between gap-3 border-b"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-elevated)' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              Student Academic Roster
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Click "Run Scenario" to load a student's profile into the What-If simulator.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Search */}
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ width: 14, height: 14, color: 'var(--text-muted)' }}
                aria-hidden="true"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search students…"
                className="form-input pl-9 pr-7 py-2 text-xs h-8 w-48"
                aria-label="Search students"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label="Clear student search"
                >
                  <X style={{ width: 12, height: 12 }} />
                </button>
              )}
            </div>

            {/* Risk filter pills */}
            <div className="tab-list" role="group" aria-label="Filter by risk level">
              {(['All', 'High', 'Medium', 'Low'] as const).map(level => (
                <button
                  key={level}
                  onClick={() => setRiskFilter(level)}
                  className={`tab-item text-xs py-1 px-3 ${riskFilter === level ? 'active' : ''}`}
                  aria-pressed={riskFilter === level}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="data-table" role="grid" aria-label="Student roster">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Attendance</th>
                <th>Study Hours</th>
                <th>Previous Score</th>
                <th>Predicted Score</th>
                <th>Risk Level</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state py-10">
                      <div className="empty-state-icon">
                        <Search style={{ width: 22, height: 22 }} aria-hidden="true" />
                      </div>
                      <p className="empty-state-title">No students found</p>
                      <p className="empty-state-desc">Try adjusting your search or filter criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : filteredStudents.map(student => (
                <tr key={student.id}>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center text-[10px] font-bold"
                        style={{
                          background: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border-default)',
                        }}
                        aria-hidden="true"
                      >
                        {student.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                        {student.name}
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      className="font-medium text-sm"
                      style={{ color: student.attendance < 70 ? '#f87171' : 'var(--text-primary)' }}
                    >
                      {student.attendance}%
                    </span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {student.studyHours} hrs/wk
                    </span>
                  </td>
                  <td>
                    <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                      {student.previousMarks}%
                    </span>
                  </td>
                  <td>
                    <ScoreGauge score={student.predictedScore} />
                  </td>
                  <td>
                    <RiskPill level={student.riskLevel} />
                  </td>
                  <td className="text-right">
                    <button
                      onClick={() => handleLoadScenario(student)}
                      className="btn btn-ghost btn-sm text-indigo-400 hover:text-indigo-300"
                      aria-label={`Load ${student.name}'s scenario into the simulator`}
                    >
                      Run Scenario
                      <ChevronRight style={{ width: 12, height: 12 }} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 6. Charts + Quick Actions Grid ────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-fade-in-up delay-400">
        {/* Pie Chart */}
        <div className="lg:col-span-1">
          <PieChartComponent
            data={pieData}
            title="Grade Distribution"
            subtitle="Predicted performance categories"
          />
        </div>

        {/* Bar Chart */}
        <div className="lg:col-span-2">
          <BarChartComponent
            data={barData}
            title="Model Accuracy Leaderboard"
            subtitle="Benchmark comparison across all trained classifiers (%)"
            highlightColor="#10b981"
          />
        </div>
      </div>

      {/* ── 7. Quick Actions Strip ─────────────────────────────────────────── */}
      <div className="animate-fade-in-up delay-500">
        <div className="mb-3">
          <h2 className="section-title">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <QuickActionCard
            icon={<Sparkles style={{ width: 18, height: 18 }} />}
            label="New Prediction"
            description="Predict a student's performance"
            color="#6366f1"
            onClick={() => navigate('/predict')}
          />
          <QuickActionCard
            icon={<BrainCircuit style={{ width: 18, height: 18 }} />}
            label="Train Model"
            description="Train ML models on dataset"
            color="#10b981"
            onClick={() => navigate('/models')}
          />
          <QuickActionCard
            icon={<BarChart2 style={{ width: 18, height: 18 }} />}
            label="View Reports"
            description="Analytics and insights export"
            color="#f59e0b"
            onClick={() => navigate('/reports')}
          />
          <QuickActionCard
            icon={<Shield style={{ width: 18, height: 18 }} />}
            label="Prediction History"
            description="Audit log of all predictions"
            color="#8b5cf6"
            onClick={() => navigate('/history')}
          />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;

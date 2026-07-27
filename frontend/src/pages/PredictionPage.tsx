
import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  User,
  GraduationCap,
  Award,
  AlertCircle,
  Loader2,
  RotateCcw,
  BookOpen,
  Clock,
  TrendingUp,
  Sliders,
  Zap,
  CheckCircle2,
  ChevronRight,
  BarChart2,
  Brain,
  Star,
  Info,
} from 'lucide-react';

import { predictionService }                    from '../services/predictionService';
import { StudentFeatures, SinglePredictionResponse } from '../types';
import { getCategoryBadgeColor }                from '../utils/formatters';

// ── Default Form Values ────────────────────────────────────────────────────────
const DEFAULT_FEATURES: StudentFeatures = {
  gender: 'Female',
  age: 20,
  attendance: 75.0,
  study_hours: 12.0,
  previous_semester_marks: 68.0,
  assignment_score: 70.0,
  internal_assessment: 68.0,
  class_participation: 70.0,
  internet_access: 'Yes',
  parental_education: 'Bachelor',
  family_income: 'Medium',
  extra_curricular_activities: 'Yes',
};

// ── Category Config ───────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, {
  color: string; bg: string; border: string; glow: string; emoji: string; desc: string;
}> = {
  Excellent: {
    color: '#34d399', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.3)',
    glow: 'rgba(16,185,129,0.2)', emoji: '🏆', desc: 'Outstanding academic performance (≥85%)',
  },
  Good: {
    color: '#60a5fa', bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)',
    glow: 'rgba(59,130,246,0.2)', emoji: '✅', desc: 'Above average performance (72%–84%)',
  },
  Average: {
    color: '#fbbf24', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)',
    glow: 'rgba(245,158,11,0.2)', emoji: '📊', desc: 'Meets minimum requirements (58%–71%)',
  },
  Poor: {
    color: '#f87171', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)',
    glow: 'rgba(239,68,68,0.2)', emoji: '⚠️', desc: 'Requires immediate intervention (<58%)',
  },
};

// ── Confidence bar color ──────────────────────────────────────────────────────
const probColor = (cat: string) => CATEGORY_CONFIG[cat]?.color ?? '#818cf8';

// ── Sub-components ────────────────────────────────────────────────────────────

// Section header inside form
const FormSection: React.FC<{
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  accentColor?: string;
}> = ({ icon, title, subtitle, accentColor = '#818cf8' }) => (
  <div className="flex items-start gap-3 pb-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
      style={{ background: `${accentColor}20`, color: accentColor }}
      aria-hidden="true"
    >
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
      {subtitle && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>}
    </div>
  </div>
);

// Slider input with value badge
const FeatureSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit: string;
  accentColor: string;
  icon: React.ReactNode;
  hint?: string;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step = 1, unit, accentColor, icon, hint, onChange }) => (
  <div
    className="space-y-3 p-4 rounded-xl border transition-all duration-200"
    style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
  >
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
        <span style={{ color: accentColor }} aria-hidden="true">{icon}</span>
        <span>{label}</span>
        {hint && (
          <div className="tooltip-wrap hidden sm:inline-block">
            <Info style={{ width: 12, height: 12, color: 'var(--text-muted)' }} aria-hidden="true" />
            <div className="tooltip" role="tooltip">{hint}</div>
          </div>
        )}
      </div>
      <span
        className="px-2.5 py-1 rounded-lg text-sm font-bold font-mono flex-shrink-0"
        style={{ background: `${accentColor}18`, color: accentColor, border: `1px solid ${accentColor}30` }}
      >
        {value}{unit}
      </span>
    </div>
    <input
      type="range"
      min={min} max={max} step={step}
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      className="w-full"
      aria-label={`${label}: ${value}${unit}`}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
    />
    <div className="flex justify-between text-[11px]" style={{ color: 'var(--text-muted)' }}>
      <span>{min}{unit}</span>
      <span>{Math.round((min + max) / 2)}{unit}</span>
      <span>{max}{unit}</span>
    </div>
  </div>
);

// Select dropdown
const FeatureSelect: React.FC<{
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}> = ({ label, value, options, onChange, icon }) => (
  <div className="form-group">
    <label className="form-label flex items-center gap-1.5">
      {icon && <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">{icon}</span>}
      {label}
    </label>
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="form-select text-sm"
      aria-label={label}
    >
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  </div>
);

// Confidence probability bar
const ProbabilityBar: React.FC<{ category: string; probability: number; isTop: boolean }> = ({
  category, probability, isTop,
}) => {
  const pct = (probability * 100).toFixed(1);
  const color = probColor(category);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {isTop && <Star style={{ width: 10, height: 10, color }} fill={color} aria-hidden="true" />}
          <span style={{ color: isTop ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isTop ? 600 : 400 }}>
            {category}
          </span>
        </div>
        <span className="font-mono font-semibold" style={{ color }}>{pct}%</span>
      </div>
      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, ${color}80, ${color})`,
            transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)',
          }}
        />
      </div>
    </div>
  );
};

// Live feature contrib mini-bar
const LiveContribBar: React.FC<{
  label: string; icon: React.ReactNode; rawValue: string;
  contrib: number; color: string; textColor: string;
}> = ({ label, icon, rawValue, contrib, color, textColor }) => (
  <div className="grid grid-cols-12 items-center gap-3 text-xs">
    <div className="col-span-3 flex items-center gap-1.5" style={{ color: 'var(--text-secondary)' }}>
      <span style={{ color: textColor }} aria-hidden="true">{icon}</span>
      <span className="truncate hidden sm:inline">{label}</span>
    </div>
    <div
      className="col-span-7 h-6 rounded-lg overflow-hidden p-0.5"
      style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)' }}
      role="progressbar"
      aria-valuenow={contrib}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${label} contribution: ${contrib}%`}
    >
      <div
        className="h-full rounded-md flex items-center justify-end pr-2 font-bold text-white"
        style={{
          width: `${Math.max(14, contrib)}%`,
          background: `linear-gradient(90deg, ${color}90, ${color})`,
          fontSize: 10,
          transition: 'width 0.35s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {contrib}%
      </div>
    </div>
    <span className="col-span-2 text-right font-mono font-bold" style={{ color: textColor }}>
      {rawValue}
    </span>
  </div>
);

// Empty result placeholder
const ResultPlaceholder: React.FC = () => (
  <div className="empty-state py-10">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-1"
      style={{ background: 'rgba(99,102,241,0.1)', color: '#818cf8' }}
    >
      <Brain style={{ width: 28, height: 28 }} aria-hidden="true" />
    </div>
    <p className="empty-state-title">Awaiting Inference</p>
    <p className="empty-state-desc">
      Fill in the student metrics and click <strong>Run ML Inference</strong> to get a prediction from the server.
    </p>
  </div>
);

// ── Main Component ────────────────────────────────────────────────────────────
export const PredictionPage: React.FC = () => {
  const [formData,     setFormData]     = useState<StudentFeatures>(DEFAULT_FEATURES);
  const [studentName,  setStudentName]  = useState('Alex Johnson');
  const [result,       setResult]       = useState<SinglePredictionResponse | null>(null);
  const [isPredicting, setIsPredicting] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Live score estimate for contribution bars
  const liveScore = useMemo(() => Math.min(99, Math.max(35, Math.round(
    0.38 * formData.attendance +
    0.32 * formData.previous_semester_marks +
    0.20 * (formData.study_hours * 2.5) +
    0.10 * formData.assignment_score
  ))), [formData.attendance, formData.previous_semester_marks, formData.study_hours, formData.assignment_score]);

  const contribAttendance  = Math.round((formData.attendance * 0.38 / liveScore) * 100);
  const contribPrevious    = Math.round((formData.previous_semester_marks * 0.32 / liveScore) * 100);
  const contribStudy       = Math.round((formData.study_hours * 2.5 * 0.20 / liveScore) * 100);
  const contribAssignment  = Math.max(4, 100 - contribAttendance - contribPrevious - contribStudy);

  const liveCategory = liveScore >= 85 ? 'Excellent' : liveScore >= 72 ? 'Good' : liveScore >= 58 ? 'Average' : 'Poor';
  const liveCfg = CATEGORY_CONFIG[liveCategory];

  const handleChange = (field: keyof StudentFeatures, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (result) setResult(null); // clear result when form changes
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPredicting(true);
    setError(null);
    try {
      const response = await predictionService.predictSingle({
        student_identifier: studentName.trim() || 'Student #1',
        features: formData,
      });
      setResult(response);
    } catch (err: any) {
      setError(err.message || 'Prediction execution failed. Please check the server.');
    } finally {
      setIsPredicting(false);
    }
  };

  const handleReset = () => {
    setFormData(DEFAULT_FEATURES);
    setStudentName('Alex Johnson');
    setResult(null);
    setError(null);
  };

  // Sort categories by probability for display
  const sortedProbs = result
    ? Object.entries(result.confidence_probabilities).sort(([, a], [, b]) => b - a)
    : [];
  const topCategory = sortedProbs[0]?.[0] ?? '';
  const resultCfg   = result ? CATEGORY_CONFIG[result.predicted_category] : null;

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
                <Sparkles style={{ width: 10, height: 10 }} aria-hidden="true" /> ML Inference
              </span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Server-side model · Real-time prediction
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Student Performance Predictor
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
              Input student academic metrics to run server-side ML inference and receive a predicted performance category.
            </p>
          </div>
          <button onClick={handleReset} className="btn btn-secondary btn-sm flex-shrink-0">
            <RotateCcw style={{ width: 13, height: 13 }} aria-hidden="true" />
            Reset Form
          </button>
        </div>
      </div>

      {/* ── Error Banner ─────────────────────────────────────────────────── */}
      {error && (
        <div
          className="alert-banner alert-error animate-fade-in-down"
          role="alert"
          aria-live="assertive"
        >
          <AlertCircle style={{ width: 16, height: 16, flexShrink: 0, marginTop: 1 }} aria-hidden="true" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Prediction Failed</p>
            <p className="text-xs mt-0.5 opacity-80">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-xs underline opacity-70 hover:opacity-100 flex-shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ── Live Feature Contribution Bars ───────────────────────────────── */}
      <div
        className="card p-6"
        style={{ borderColor: 'rgba(99,102,241,0.15)' }}
        aria-label="Live feature contribution preview"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.14)', color: '#818cf8' }}
              aria-hidden="true"
            >
              <BarChart2 style={{ width: 17, height: 17 }} />
            </div>
            <div>
              <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                Live Feature Contribution
              </h2>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Real-time weight breakdown based on current form values
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Estimated score:</span>
            <span
              className="px-3 py-1 rounded-lg font-bold font-mono text-sm"
              style={{ background: `${liveCfg.bg}`, color: liveCfg.color, border: `1px solid ${liveCfg.border}` }}
              aria-live="polite"
            >
              {liveScore}% · {liveCategory}
            </span>
          </div>
        </div>

        <div
          className="space-y-4 p-5 rounded-xl border"
          style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
        >
          <LiveContribBar
            label="Attendance"
            icon={<TrendingUp style={{ width: 13, height: 13 }} />}
            rawValue={`${formData.attendance}%`}
            contrib={contribAttendance}
            color="#6366f1" textColor="#a5b4fc"
          />
          <LiveContribBar
            label="Past Performance"
            icon={<BookOpen style={{ width: 13, height: 13 }} />}
            rawValue={`${formData.previous_semester_marks}%`}
            contrib={contribPrevious}
            color="#f59e0b" textColor="#fcd34d"
          />
          <LiveContribBar
            label="Study Hours"
            icon={<Clock style={{ width: 13, height: 13 }} />}
            rawValue={`${formData.study_hours}h`}
            contrib={contribStudy}
            color="#10b981" textColor="#6ee7b7"
          />
          <LiveContribBar
            label="Assignment"
            icon={<Award style={{ width: 13, height: 13 }} />}
            rawValue={`${formData.assignment_score}%`}
            contrib={contribAssignment}
            color="#8b5cf6" textColor="#c4b5fd"
          />
        </div>
      </div>

      {/* ── Two-column: Form + Result ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* ── LEFT: Input Form ─────────────────────────────────────────── */}
        <div className="lg:col-span-8">
          <form onSubmit={handleSubmit} className="card p-6 space-y-8" noValidate>

            {/* ── Section 1: Student Identity ────────────────────────── */}
            <div className="space-y-4">
              <FormSection
                icon={<User style={{ width: 15, height: 15 }} />}
                title="Student Identity"
                subtitle="Identifier used in the audit log and prediction history"
                accentColor="#818cf8"
              />
              <div className="form-group">
                <label htmlFor="student-name" className="form-label">Student Name / ID</label>
                <div className="relative">
                  <User
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ width: 14, height: 14, color: 'var(--text-muted)' }}
                    aria-hidden="true"
                  />
                  <input
                    id="student-name"
                    type="text"
                    value={studentName}
                    onChange={e => setStudentName(e.target.value)}
                    placeholder="e.g. Alex Johnson"
                    className="form-input pl-9 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* ── Section 2: Academic Performance Sliders ────────────── */}
            <div className="space-y-4">
              <FormSection
                icon={<Sliders style={{ width: 15, height: 15 }} />}
                title="Academic Performance Metrics"
                subtitle="Core predictive features — drag sliders to adjust values"
                accentColor="#10b981"
              />
              <div className="space-y-3">
                <FeatureSlider
                  label="Attendance Rate"
                  value={formData.attendance}
                  min={50} max={100} step={0.5} unit="%"
                  accentColor="#818cf8"
                  icon={<TrendingUp style={{ width: 14, height: 14 }} />}
                  hint="Percentage of classes attended this semester"
                  onChange={v => handleChange('attendance', v)}
                />
                <FeatureSlider
                  label="Weekly Study Hours"
                  value={formData.study_hours}
                  min={1} max={40} step={0.5} unit=" hrs"
                  accentColor="#c084fc"
                  icon={<Clock style={{ width: 14, height: 14 }} />}
                  hint="Average hours spent studying per week"
                  onChange={v => handleChange('study_hours', v)}
                />
                <FeatureSlider
                  label="Previous Semester Score"
                  value={formData.previous_semester_marks}
                  min={40} max={100} step={0.5} unit="%"
                  accentColor="#34d399"
                  icon={<BookOpen style={{ width: 14, height: 14 }} />}
                  hint="Average marks from the previous semester"
                  onChange={v => handleChange('previous_semester_marks', v)}
                />
                <FeatureSlider
                  label="Assignment Score"
                  value={formData.assignment_score}
                  min={40} max={100} step={0.5} unit="%"
                  accentColor="#fbbf24"
                  icon={<Award style={{ width: 14, height: 14 }} />}
                  hint="Average score across all submitted assignments"
                  onChange={v => handleChange('assignment_score', v)}
                />
                <FeatureSlider
                  label="Internal Assessment"
                  value={formData.internal_assessment}
                  min={40} max={100} step={0.5} unit="%"
                  accentColor="#60a5fa"
                  icon={<BarChart2 style={{ width: 14, height: 14 }} />}
                  onChange={v => handleChange('internal_assessment', v)}
                />
              </div>
            </div>

            {/* ── Section 3: Demographic & Contextual Factors ─────────── */}
            <div className="space-y-4">
              <FormSection
                icon={<GraduationCap style={{ width: 15, height: 15 }} />}
                title="Demographic & Contextual Factors"
                subtitle="Secondary features that contextualise the prediction"
                accentColor="#f59e0b"
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FeatureSelect
                  label="Gender"
                  value={formData.gender}
                  options={[
                    { value: 'Female', label: 'Female' },
                    { value: 'Male',   label: 'Male'   },
                    { value: 'Other',  label: 'Other'  },
                  ]}
                  onChange={v => handleChange('gender', v)}
                />
                <div className="form-group">
                  <label htmlFor="age-input" className="form-label">Age</label>
                  <input
                    id="age-input"
                    type="number"
                    min={15} max={35}
                    value={formData.age}
                    onChange={e => handleChange('age', parseInt(e.target.value))}
                    className="form-input text-sm"
                    aria-label="Student age"
                  />
                </div>
                <FeatureSelect
                  label="Parental Education"
                  value={formData.parental_education}
                  options={[
                    { value: 'High School', label: 'High School' },
                    { value: 'Associate',   label: 'Associate'   },
                    { value: 'Bachelor',    label: "Bachelor's"  },
                    { value: 'Master',      label: "Master's"    },
                    { value: 'Doctorate',   label: 'Doctorate'   },
                  ]}
                  onChange={v => handleChange('parental_education', v)}
                />
                <FeatureSelect
                  label="Family Income Level"
                  value={formData.family_income}
                  options={[
                    { value: 'Low',    label: 'Low'    },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High',   label: 'High'   },
                  ]}
                  onChange={v => handleChange('family_income', v)}
                />
                <FeatureSelect
                  label="Internet Access at Home"
                  value={formData.internet_access}
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No',  label: 'No'  },
                  ]}
                  onChange={v => handleChange('internet_access', v)}
                />
                <FeatureSelect
                  label="Extracurricular Activities"
                  value={formData.extra_curricular_activities}
                  options={[
                    { value: 'Yes', label: 'Yes' },
                    { value: 'No',  label: 'No'  },
                  ]}
                  onChange={v => handleChange('extra_curricular_activities', v)}
                />
              </div>
            </div>

            {/* ── Submit Button ─────────────────────────────────────────── */}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
              <button
                type="submit"
                disabled={isPredicting}
                className={`btn btn-primary btn-lg w-full ${isPredicting ? 'btn-loading' : ''}`}
                aria-busy={isPredicting}
                aria-live="polite"
              >
                {isPredicting ? (
                  <>
                    <Loader2
                      className="animate-spin"
                      style={{ width: 16, height: 16 }}
                      aria-hidden="true"
                    />
                    Running ML Inference…
                  </>
                ) : (
                  <>
                    <Zap style={{ width: 16, height: 16 }} aria-hidden="true" />
                    Run ML Inference
                    <ChevronRight style={{ width: 14, height: 14 }} aria-hidden="true" />
                  </>
                )}
              </button>
              <p className="text-xs text-center mt-2.5" style={{ color: 'var(--text-muted)' }}>
                Prediction is executed by the FastAPI backend ML engine · Results are saved to audit history
              </p>
            </div>
          </form>
        </div>

        {/* ── RIGHT: Prediction Result ──────────────────────────────────── */}
        <div className="lg:col-span-4">
          <div
            className="card p-6 space-y-6 sticky"
            style={{ top: '72px', borderColor: result && resultCfg ? resultCfg.border : 'var(--border-default)' }}
            aria-label="Prediction output"
            aria-live="polite"
          >
            {/* Panel Header */}
            <div
              className="flex items-center justify-between pb-4 border-b"
              style={{ borderColor: 'var(--border-subtle)' }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.14)', color: '#818cf8' }}
                  aria-hidden="true"
                >
                  <Brain style={{ width: 16, height: 16 }} />
                </div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  Prediction Output
                </h3>
              </div>
              {result && (
                <span className="badge badge-emerald">
                  <CheckCircle2 style={{ width: 10, height: 10 }} aria-hidden="true" />
                  Complete
                </span>
              )}
            </div>

            {/* Result or Placeholder */}
            {result && resultCfg ? (
              <div className="space-y-6 animate-scale-in">
                {/* Category Result Badge */}
                <div
                  className="rounded-xl p-6 text-center border space-y-2"
                  style={{ background: resultCfg.bg, borderColor: resultCfg.border, boxShadow: `0 0 32px ${resultCfg.glow}` }}
                >
                  <div className="text-3xl mb-1" role="img" aria-label={result.predicted_category}>
                    {resultCfg.emoji}
                  </div>
                  <p className="text-[11px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-muted)' }}>
                    Predicted Category
                  </p>
                  <p className="text-2xl font-bold" style={{ color: resultCfg.color }}>
                    {result.predicted_category}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {resultCfg.desc}
                  </p>
                  <div
                    className="mt-2 inline-block px-3 py-1 rounded-full text-xs"
                    style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-default)' }}
                  >
                    {result.student_identifier}
                  </div>
                </div>

                {/* Confidence Probability Bars */}
                <div className="space-y-3">
                  <h4 className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    Model Confidence Scores
                  </h4>
                  {sortedProbs.map(([cat, prob]) => (
                    <ProbabilityBar
                      key={cat}
                      category={cat}
                      probability={prob}
                      isTop={cat === topCategory}
                    />
                  ))}
                </div>

                {/* Model Used */}
                <div
                  className="flex items-center justify-between p-3 rounded-lg border text-xs"
                  style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-2" style={{ color: 'var(--text-muted)' }}>
                    <Brain style={{ width: 12, height: 12 }} aria-hidden="true" />
                    Model Used
                  </div>
                  <span className="font-semibold" style={{ color: '#a5b4fc' }}>
                    {result.model_used}
                  </span>
                </div>

                {/* Run Again */}
                <button
                  onClick={() => setResult(null)}
                  className="btn btn-secondary btn-sm w-full"
                >
                  <RotateCcw style={{ width: 12, height: 12 }} aria-hidden="true" />
                  Clear & Run Again
                </button>
              </div>
            ) : isPredicting ? (
              // Loading state
              <div className="py-16 flex flex-col items-center gap-4">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center"
                  style={{ background: 'rgba(99,102,241,0.1)' }}
                  aria-hidden="true"
                >
                  <Loader2
                    className="animate-spin"
                    style={{ width: 32, height: 32, color: '#818cf8' }}
                  />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    Running Inference…
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    Querying the ML backend model
                  </p>
                </div>
              </div>
            ) : (
              <ResultPlaceholder />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PredictionPage;

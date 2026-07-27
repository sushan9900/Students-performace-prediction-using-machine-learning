
import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
type ColorVariant = 'indigo' | 'emerald' | 'amber' | 'purple' | 'red' | 'rose' | 'blue' | 'cyan';

interface SparkPoint {
  value: number;
}

interface MetricCardProps {
  /** Card title / label */
  title: string;
  /** Displayed value — string (e.g. "89.3%") or raw number for count-up */
  value: string | number;
  /** Secondary line below value */
  subtitle?: string;
  /** Lucide icon node */
  icon: React.ReactNode;
  /** Trend text shown in footer (e.g. "+4.2% this week") */
  trend?: string;
  /** Whether the trend direction is positive */
  trendPositive?: boolean;
  /** Neutral trend — no direction arrow */
  trendNeutral?: boolean;
  /** Color accent */
  color?: ColorVariant;
  /** Show loading skeleton */
  loading?: boolean;
  /** Optional sparkline data points */
  sparkline?: SparkPoint[];
  /** CSS class name override */
  className?: string;
  /** Called on card click */
  onClick?: () => void;
}

// ── Color Token Map ───────────────────────────────────────────────────────────
const COLOR_TOKENS: Record<ColorVariant, {
  iconBg:    string;
  iconText:  string;
  iconRing:  string;
  glow:      string;
  tint:      string;
  sparkFill: string;
  sparkLine: string;
  badge:     string;
}> = {
  indigo: {
    iconBg:    'rgba(99,102,241,0.15)',
    iconText:  '#a5b4fc',
    iconRing:  'rgba(99,102,241,0.25)',
    glow:      'rgba(99,102,241,0.08)',
    tint:      'rgba(99,102,241,0.04)',
    sparkFill: 'rgba(99,102,241,0.15)',
    sparkLine: '#818cf8',
    badge:     'badge-indigo',
  },
  emerald: {
    iconBg:    'rgba(16,185,129,0.15)',
    iconText:  '#6ee7b7',
    iconRing:  'rgba(16,185,129,0.25)',
    glow:      'rgba(16,185,129,0.08)',
    tint:      'rgba(16,185,129,0.04)',
    sparkFill: 'rgba(16,185,129,0.15)',
    sparkLine: '#34d399',
    badge:     'badge-emerald',
  },
  amber: {
    iconBg:    'rgba(245,158,11,0.15)',
    iconText:  '#fcd34d',
    iconRing:  'rgba(245,158,11,0.25)',
    glow:      'rgba(245,158,11,0.08)',
    tint:      'rgba(245,158,11,0.04)',
    sparkFill: 'rgba(245,158,11,0.15)',
    sparkLine: '#fbbf24',
    badge:     'badge-amber',
  },
  purple: {
    iconBg:    'rgba(168,85,247,0.15)',
    iconText:  '#d8b4fe',
    iconRing:  'rgba(168,85,247,0.25)',
    glow:      'rgba(168,85,247,0.08)',
    tint:      'rgba(168,85,247,0.04)',
    sparkFill: 'rgba(168,85,247,0.15)',
    sparkLine: '#c084fc',
    badge:     'badge-indigo',
  },
  red: {
    iconBg:    'rgba(239,68,68,0.15)',
    iconText:  '#fca5a5',
    iconRing:  'rgba(239,68,68,0.25)',
    glow:      'rgba(239,68,68,0.08)',
    tint:      'rgba(239,68,68,0.04)',
    sparkFill: 'rgba(239,68,68,0.15)',
    sparkLine: '#f87171',
    badge:     'badge-red',
  },
  rose: {
    iconBg:    'rgba(244,63,94,0.15)',
    iconText:  '#fda4af',
    iconRing:  'rgba(244,63,94,0.25)',
    glow:      'rgba(244,63,94,0.08)',
    tint:      'rgba(244,63,94,0.04)',
    sparkFill: 'rgba(244,63,94,0.15)',
    sparkLine: '#fb7185',
    badge:     'badge-red',
  },
  blue: {
    iconBg:    'rgba(59,130,246,0.15)',
    iconText:  '#93c5fd',
    iconRing:  'rgba(59,130,246,0.25)',
    glow:      'rgba(59,130,246,0.08)',
    tint:      'rgba(59,130,246,0.04)',
    sparkFill: 'rgba(59,130,246,0.15)',
    sparkLine: '#60a5fa',
    badge:     'badge-blue',
  },
  cyan: {
    iconBg:    'rgba(6,182,212,0.15)',
    iconText:  '#67e8f9',
    iconRing:  'rgba(6,182,212,0.25)',
    glow:      'rgba(6,182,212,0.08)',
    tint:      'rgba(6,182,212,0.04)',
    sparkFill: 'rgba(6,182,212,0.15)',
    sparkLine: '#22d3ee',
    badge:     'badge-blue',
  },
};

// ── Animated Counter Hook ─────────────────────────────────────────────────────
const useCountUp = (target: number, duration = 1200, start = true): number => {
  const [current, setCurrent] = useState(0);
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (!start) return;

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp;
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.floor(eased * target));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(step);
      } else {
        setCurrent(target);
      }
    };

    frameRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frameRef.current);
  }, [target, duration, start]);

  return current;
};

// ── Mini Sparkline SVG ────────────────────────────────────────────────────────
const Sparkline: React.FC<{
  data: SparkPoint[];
  lineColor: string;
  fillColor: string;
}> = ({ data, lineColor, fillColor }) => {
  if (!data || data.length < 2) return null;

  const W = 80;
  const H = 28;
  const PADDING = 3;

  const values = data.map(d => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toX = (i: number) => PADDING + (i / (data.length - 1)) * (W - PADDING * 2);
  const toY = (v: number) => H - PADDING - ((v - min) / range) * (H - PADDING * 2);

  const points = data.map((d, i) => `${toX(i).toFixed(1)},${toY(d.value).toFixed(1)}`);
  const polyline = points.join(' ');

  // Closed area polygon for fill
  const area = [
    `${toX(0).toFixed(1)},${H}`,
    ...points,
    `${toX(data.length - 1).toFixed(1)},${H}`,
  ].join(' ');

  return (
    <svg
      width={W}
      height={H}
      viewBox={`0 0 ${W} ${H}`}
      aria-hidden="true"
      className="flex-shrink-0"
    >
      {/* Fill area */}
      <polygon points={area} fill={fillColor} />
      {/* Line */}
      <polyline
        points={polyline}
        fill="none"
        stroke={lineColor}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={toX(data.length - 1)}
        cy={toY(values[values.length - 1])}
        r="2.5"
        fill={lineColor}
      />
    </svg>
  );
};

// ── Skeleton Loader ───────────────────────────────────────────────────────────
const MetricCardSkeleton: React.FC = () => (
  <div className="card p-5 space-y-4" aria-busy="true" aria-label="Loading metric">
    <div className="flex items-start justify-between">
      <div className="space-y-2 flex-1">
        <div className="skeleton h-3 w-24 rounded" />
        <div className="skeleton h-7 w-20 rounded-lg" />
        <div className="skeleton h-2.5 w-32 rounded" />
      </div>
      <div className="skeleton w-11 h-11 rounded-xl flex-shrink-0" />
    </div>
    <div className="skeleton h-px w-full" />
    <div className="skeleton h-3 w-36 rounded" />
  </div>
);

// ── Main MetricCard Component ─────────────────────────────────────────────────
export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendPositive = true,
  trendNeutral = false,
  color = 'indigo',
  loading = false,
  sparkline,
  className = '',
  onClick,
}) => {
  const tokens = COLOR_TOKENS[color];
  const [mounted, setMounted] = useState(false);

  // Trigger count-up after mount
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 80);
    return () => clearTimeout(timer);
  }, []);

  // Determine if we should count-up the number
  const isNumeric = typeof value === 'number';
  const numericTarget = isNumeric ? (value as number) : 0;
  const countedValue = useCountUp(numericTarget, 1100, mounted && isNumeric);

  // Format displayed value
  const displayValue = isNumeric
    ? countedValue.toLocaleString()
    : String(value);

  if (loading) return <MetricCardSkeleton />;

  return (
    <div
      className={`
        card metric-card group
        ${onClick ? 'card-interactive cursor-pointer' : ''}
        ${className}
      `}
      style={{
        // Subtle color tint on the card background
        background: `linear-gradient(135deg, var(--bg-card) 0%, ${tokens.tint} 100%)`,
      }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick(); } : undefined}
      aria-label={`${title}: ${displayValue}${trend ? `, ${trend}` : ''}`}
    >
      {/* ── Top Row: Label + Icon ─────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">

        {/* Left: Label + Value + Subtitle */}
        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold uppercase tracking-wider mb-1.5 truncate"
            style={{ color: 'var(--text-muted)', letterSpacing: '0.06em' }}
          >
            {title}
          </p>

          <div className="flex items-end gap-2.5 flex-wrap">
            <h3
              className="text-2xl font-bold leading-none tracking-tight transition-all duration-200"
              style={{ color: 'var(--text-primary)' }}
            >
              {displayValue}
            </h3>
            {/* Sparkline next to value */}
            {sparkline && sparkline.length >= 2 && (
              <div className="mb-0.5">
                <Sparkline
                  data={sparkline}
                  lineColor={tokens.sparkLine}
                  fillColor={tokens.sparkFill}
                />
              </div>
            )}
          </div>

          {subtitle && (
            <p
              className="text-xs mt-1.5 truncate"
              style={{ color: 'var(--text-muted)' }}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Right: Icon Box */}
        <div
          className="
            flex-shrink-0 w-11 h-11 rounded-xl
            flex items-center justify-center
            transition-all duration-200
            group-hover:scale-110
          "
          style={{
            background:   tokens.iconBg,
            color:        tokens.iconText,
            boxShadow:    `0 0 0 1px ${tokens.iconRing}, 0 4px 12px ${tokens.glow}`,
          }}
          aria-hidden="true"
        >
          {icon}
        </div>
      </div>

      {/* ── Divider ──────────────────────────────────────────────────── */}
      {trend && (
        <>
          <div
            className="mt-4 mb-3 h-px"
            style={{ background: 'var(--border-subtle)' }}
            aria-hidden="true"
          />

          {/* ── Trend Footer ──────────────────────────────────────────── */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {/* Direction Icon */}
              {!trendNeutral && (
                <span
                  className="flex-shrink-0"
                  style={{ color: trendPositive ? '#34d399' : '#f87171' }}
                  aria-hidden="true"
                >
                  {trendPositive
                    ? <TrendingUp  style={{ width: 13, height: 13 }} />
                    : <TrendingDown style={{ width: 13, height: 13 }} />
                  }
                </span>
              )}
              {trendNeutral && (
                <span style={{ color: 'var(--text-muted)' }} aria-hidden="true">
                  <Minus style={{ width: 13, height: 13 }} />
                </span>
              )}

              <span
                className="text-xs font-semibold"
                style={{
                  color: trendNeutral
                    ? 'var(--text-muted)'
                    : trendPositive ? '#34d399' : '#f87171',
                }}
              >
                {trend}
              </span>
            </div>

            {/* Optional hover glow dot */}
            <span
              className="w-1.5 h-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              style={{ background: tokens.sparkLine }}
              aria-hidden="true"
            />
          </div>
        </>
      )}

      {/* ── Hover Glow Overlay ────────────────────────────────────────── */}
      <div
        className="
          absolute inset-0 rounded-[inherit] pointer-events-none
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300
        "
        style={{
          background: `radial-gradient(ellipse at top right, ${tokens.glow} 0%, transparent 70%)`,
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default MetricCard;

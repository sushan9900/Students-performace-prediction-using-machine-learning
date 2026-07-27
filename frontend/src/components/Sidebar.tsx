
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  BrainCircuit,
  Sparkles,
  History,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Shield,
  GraduationCap,
  Zap,
  Activity,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NavItem {
  to: string;
  icon: React.ElementType;
  label: string;
  description: string;
  badge?: string;
  badgeVariant?: 'indigo' | 'emerald' | 'amber';
}

interface SidebarProps {
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

// ── Navigation Items ──────────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    icon: LayoutDashboard,
    label: 'Dashboard',
    description: 'Overview & key metrics',
  },
  {
    to: '/dataset',
    icon: Database,
    label: 'Dataset',
    description: 'Browse & manage data',
    badge: '6.6K',
    badgeVariant: 'indigo',
  },
  {
    to: '/models',
    icon: BrainCircuit,
    label: 'Model Training',
    description: 'Train & evaluate models',
    badge: '6 Algos',
    badgeVariant: 'emerald',
  },
  {
    to: '/predict',
    icon: Sparkles,
    label: 'Predict',
    description: 'Run predictions',
  },
  {
    to: '/history',
    icon: History,
    label: 'History',
    description: 'Prediction audit log',
  },
  {
    to: '/reports',
    icon: FileText,
    label: 'Reports',
    description: 'Analytics & insights',
  },
];

// ── Badge Variant Styles ──────────────────────────────────────────────────────
const BADGE_STYLES: Record<string, string> = {
  indigo:  'bg-indigo-500/15 text-indigo-300 border-indigo-500/25',
  emerald: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  amber:   'bg-amber-500/15  text-amber-300  border-amber-500/25',
};

// ── Single Nav Item ───────────────────────────────────────────────────────────
const SidebarNavItem: React.FC<{
  item: NavItem;
  collapsed: boolean;
  onClick?: () => void;
}> = ({ item, collapsed, onClick }) => {
  const location = useLocation();
  const isActive = item.to === '/'
    ? location.pathname === '/'
    : location.pathname.startsWith(item.to);

  const Icon = item.icon;

  return (
    <div className="relative group/item">
      <NavLink
        to={item.to}
        onClick={onClick}
        className={`
          sidebar-nav-item
          ${isActive ? 'active' : ''}
          ${collapsed ? 'justify-center px-2.5 py-2.5' : 'px-3 py-2.5'}
        `}
        aria-label={collapsed ? `${item.label}: ${item.description}` : item.label}
        aria-current={isActive ? 'page' : undefined}
      >
        {/* Left accent bar for active state */}
        {isActive && (
          <span
            className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-indigo-500"
            aria-hidden="true"
          />
        )}

        {/* Icon Wrapper */}
        <span
          className={`
            icon-wrap flex-shrink-0 transition-all duration-200
            ${isActive
              ? 'bg-indigo-500/18 text-indigo-400'
              : 'text-[var(--text-muted)] group-hover/item:text-[var(--text-primary)]'
            }
            ${collapsed ? 'w-9 h-9 rounded-lg' : 'w-8 h-8 rounded-md'}
          `}
        >
          <Icon
            style={{ width: 16, height: 16 }}
            aria-hidden="true"
          />
        </span>

        {/* Label + Badge — hidden when collapsed */}
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 leading-none">
              <span
                className={`
                  block text-sm font-${isActive ? '600' : '500'}
                  ${isActive ? 'text-indigo-300' : 'text-[var(--text-secondary)]'}
                  group-hover/item:text-[var(--text-primary)]
                  transition-colors duration-150
                  truncate
                `}
              >
                {item.label}
              </span>
            </div>
            {item.badge && (
              <span
                className={`
                  flex-shrink-0 text-[10px] px-1.5 py-0.5
                  rounded-md border font-semibold tracking-wide
                  transition-opacity duration-150
                  ${BADGE_STYLES[item.badgeVariant ?? 'indigo']}
                `}
              >
                {item.badge}
              </span>
            )}
          </>
        )}
      </NavLink>

      {/* Tooltip — only shown when collapsed */}
      {collapsed && (
        <div
          className="
            absolute left-full top-1/2 -translate-y-1/2 ml-3
            px-3 py-2 rounded-lg
            bg-[var(--bg-card)] border border-[var(--border-strong)]
            shadow-[var(--shadow-lg)]
            pointer-events-none
            opacity-0 group-hover/item:opacity-100
            translate-x-1 group-hover/item:translate-x-0
            transition-all duration-150
            z-50 whitespace-nowrap
          "
          role="tooltip"
        >
          <p className="text-xs font-semibold text-[var(--text-primary)]">{item.label}</p>
          <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{item.description}</p>
          {/* Tooltip arrow */}
          <span
            className="
              absolute right-full top-1/2 -translate-y-1/2
              border-4 border-transparent border-r-[var(--border-strong)]
            "
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

// ── System Status Mini Panel ──────────────────────────────────────────────────
const SystemStatusPanel: React.FC<{ collapsed: boolean }> = ({ collapsed }) => {
  if (collapsed) {
    return (
      <div className="flex justify-center py-3">
        <div className="tooltip-wrap">
          <div className="w-2 h-2 rounded-full bg-emerald-400 status-dot-pulse" />
          <div className="tooltip" role="tooltip">All systems operational</div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        mx-3 mb-3 p-3 rounded-xl
        bg-[var(--bg-elevated)] border border-[var(--border-subtle)]
      "
      role="region"
      aria-label="System status"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
          System
        </span>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" style={{ animation: 'pulse-ring 2s ease-in-out infinite' }} aria-hidden="true" />
          <span className="text-[11px] text-emerald-400 font-medium">Operational</span>
        </div>
      </div>

      {/* Status Items */}
      <div className="space-y-1.5">
        {[
          { icon: Activity,     label: 'FastAPI Backend', status: 'Online',  ok: true },
          { icon: BrainCircuit, label: 'ML Engine',       status: 'Active',  ok: true },
          { icon: Database,     label: 'Dataset',         status: '6,607',   ok: true },
          { icon: Shield,       label: 'Model',           status: 'Trained', ok: true },
        ].map(({ icon: Icon, label, status, ok }) => (
          <div key={label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon
                style={{ width: 12, height: 12 }}
                className="text-[var(--text-muted)]"
                aria-hidden="true"
              />
              <span className="text-[11px] text-[var(--text-muted)]">{label}</span>
            </div>
            <span
              className={`text-[10px] font-semibold ${
                ok ? 'text-emerald-400' : 'text-red-400'
              }`}
            >
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ── Main Sidebar Component ────────────────────────────────────────────────────
export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed: controlledCollapsed,
  onCollapsedChange,
  isMobileOpen = false,
  onMobileClose,
}) => {
  const [internalCollapsed, setInternalCollapsed] = useState(false);

  // Support both controlled and uncontrolled collapse
  const collapsed = controlledCollapsed !== undefined
    ? controlledCollapsed
    : internalCollapsed;

  const setCollapsed = (val: boolean) => {
    setInternalCollapsed(val);
    onCollapsedChange?.(val);
  };

  // Persist collapse state
  useEffect(() => {
    try {
      const saved = localStorage.getItem('edu-sidebar-collapsed');
      if (saved !== null && controlledCollapsed === undefined) {
        setInternalCollapsed(saved === 'true');
      }
    } catch { /* ignore */ }
  }, [controlledCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem('edu-sidebar-collapsed', String(internalCollapsed));
    } catch { /* ignore */ }
  }, [internalCollapsed]);

  return (
    <>
      {/* Mobile overlay backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onMobileClose}
          aria-label="Close sidebar"
          role="presentation"
        />
      )}

      <aside
        className={`
          sidebar
          ${collapsed ? 'collapsed' : ''}
          ${isMobileOpen ? 'mobile-open' : ''}
          flex flex-col
          transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        `}
        role="navigation"
        aria-label="Main sidebar navigation"
        aria-expanded={!collapsed}
      >
        {/* ── Sidebar Header ─────────────────────────────────────────── */}
        <div
          className={`
            flex items-center border-b border-[var(--border-subtle)]
            flex-shrink-0
            ${collapsed ? 'justify-center py-3.5 px-2' : 'justify-between py-3 px-4'}
          `}
          style={{ minHeight: 56 }}
        >
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="
                  w-7 h-7 rounded-lg flex-shrink-0
                  bg-gradient-to-br from-indigo-500 to-violet-600
                  flex items-center justify-center
                  shadow-[0_2px_8px_rgba(99,102,241,0.3)]
                "
                aria-hidden="true"
              >
                <GraduationCap style={{ width: 14, height: 14, color: 'white' }} />
              </div>
              <div className="min-w-0">
                <span className="block text-[13px] font-bold tracking-tight text-[var(--text-primary)] truncate">
                  Edu<span className="text-indigo-400">Analytics</span>
                </span>
                <span className="block text-[10px] text-[var(--text-muted)] truncate">
                  ML Intelligence Platform
                </span>
              </div>
            </div>
          )}

          {/* Collapse / Expand Toggle Button */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="
              btn btn-ghost p-1.5 rounded-lg flex-shrink-0
              text-[var(--text-muted)] hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-elevated)]
              transition-all duration-200
            "
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed
              ? <ChevronRight style={{ width: 16, height: 16 }} aria-hidden="true" />
              : <ChevronLeft  style={{ width: 16, height: 16 }} aria-hidden="true" />
            }
          </button>
        </div>

        {/* ── Navigation Groups ───────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1 min-h-0">

          {/* Section Label — Core */}
          {!collapsed && (
            <div className="px-2 pb-1.5 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Core Modules
              </span>
            </div>
          )}

          {/* Nav Items */}
          {NAV_ITEMS.map(item => (
            <SidebarNavItem
              key={item.to}
              item={item}
              collapsed={collapsed}
              onClick={onMobileClose}
            />
          ))}

          {/* Divider */}
          <div className="pt-3 pb-1">
            <hr className="divider" />
          </div>

          {/* Quick Access Section Label */}
          {!collapsed && (
            <div className="px-2 pb-1.5 pt-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)]">
                Quick Access
              </span>
            </div>
          )}

          {/* Quick Action Items */}
          {[
            {
              icon: TrendingUp,
              label: 'Performance Trends',
              description: 'View score analytics',
              to: '/reports',
            },
            {
              icon: Zap,
              label: 'Quick Predict',
              description: 'Fast single prediction',
              to: '/predict',
            },
          ].map(item => (
            <SidebarNavItem
              key={item.label + '-quick'}
              item={{ ...item, badge: undefined, badgeVariant: undefined }}
              collapsed={collapsed}
              onClick={onMobileClose}
            />
          ))}
        </div>

        {/* ── Footer: System Status ───────────────────────────────────── */}
        <div className="flex-shrink-0 border-t border-[var(--border-subtle)] pt-3">
          <SystemStatusPanel collapsed={collapsed} />

          {/* Version Tag */}
          {!collapsed && (
            <div className="px-4 pb-3">
              <p className="text-[10px] text-[var(--text-muted)] text-center">
                EduAnalytics v1.0 · ML Platform
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

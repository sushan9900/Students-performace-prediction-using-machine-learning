
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  GraduationCap,
  Search,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  User,
  HelpCircle,
  Cpu,
  Menu,
  X,
  Sparkles,
  Command,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ── Types ──────────────────────────────────────────────────────────────────────
interface NavbarProps {
  bestModelName?: string;
  bestModelAccuracy?: number;
  onSidebarToggle?: () => void;
  isSidebarOpen?: boolean;
}

interface Notification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'success' | 'info' | 'warning';
}

// ── Sample Notifications ──────────────────────────────────────────────────────
const SAMPLE_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Model Training Complete',
    description: 'Random Forest achieved 91.2% accuracy on validation set.',
    time: '2 min ago',
    read: false,
    type: 'success',
  },
  {
    id: '2',
    title: 'New Dataset Uploaded',
    description: '6,607 student records successfully processed and validated.',
    time: '1 hr ago',
    read: false,
    type: 'info',
  },
  {
    id: '3',
    title: 'High-Risk Students Detected',
    description: '47 students flagged as high academic risk this semester.',
    time: '3 hr ago',
    read: true,
    type: 'warning',
  },
];

// ── Theme Hook ────────────────────────────────────────────────────────────────
const useTheme = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    try {
      return (localStorage.getItem('edu-theme') as 'dark' | 'light') || 'dark';
    } catch {
      return 'dark';
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    try {
      localStorage.setItem('edu-theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, toggleTheme };
};

import { useNavigate } from 'react-router-dom';

// ── Search Item Interface ─────────────────────────────────────────────────────
interface SearchItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'Pages' | 'Models' | 'Actions';
  path: string;
}

const SEARCH_ITEMS: SearchItem[] = [
  { id: 'p1', title: 'Dashboard', subtitle: 'Overview metrics, analytics & student risk table', category: 'Pages', path: '/dashboard' },
  { id: 'p2', title: 'Single Student Predictor', subtitle: 'Run ML category inference for individual student', category: 'Pages', path: '/predict' },
  { id: 'p3', title: 'Dataset Management', subtitle: 'Explore, upload CSV & inspect dataset records', category: 'Pages', path: '/dataset' },
  { id: 'p4', title: 'Model Training', subtitle: 'Train & compare Random Forest, SVM, KNN models', category: 'Pages', path: '/train' },
  { id: 'p5', title: 'Audit Prediction History', subtitle: 'View persistent prediction logs & filter history', category: 'Pages', path: '/history' },
  { id: 'p6', title: 'Executive Reports', subtitle: 'Export performance analytics in CSV or PDF', category: 'Pages', path: '/reports' },

  { id: 'm1', title: 'Random Forest Classifier', subtitle: 'Primary ensemble model (97.5% Accuracy)', category: 'Models', path: '/train' },
  { id: 'm2', title: 'Decision Tree Classifier', subtitle: 'Tree classifier (97.4% Accuracy)', category: 'Models', path: '/train' },
  { id: 'm3', title: 'Logistic Regression', subtitle: 'Linear probability classifier (97.5% Accuracy)', category: 'Models', path: '/train' },
  { id: 'm4', title: 'Support Vector Machine (SVM)', subtitle: 'RBF Kernel classifier (97.2% Accuracy)', category: 'Models', path: '/train' },
  { id: 'm5', title: 'K-Nearest Neighbors (KNN)', subtitle: 'Distance based classifier (97.5% Accuracy)', category: 'Models', path: '/train' },

  { id: 'a1', title: 'Predict New Student', subtitle: 'Open predictor form to enter student metrics', category: 'Actions', path: '/predict' },
  { id: 'a2', title: 'View High Risk Students', subtitle: 'Filter dashboard roster for students requiring intervention', category: 'Actions', path: '/dashboard' },
  { id: 'a3', title: 'Upload Student CSV', subtitle: 'Upload new dataset file for training or bulk predictions', category: 'Actions', path: '/dataset' },
];

// ── Interactive Search Bar Component ──────────────────────────────────────────
const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const filteredItems = React.useMemo(() => {
    if (!query.trim()) return SEARCH_ITEMS.slice(0, 6);
    const q = query.toLowerCase().trim();
    return SEARCH_ITEMS.filter(
      item =>
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
    );
  }, [query]);

  // Reset selected index when search query updates
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard shortcut (Ctrl+K / Cmd+K) & Arrow navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
      if (!isOpen) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % Math.max(1, filteredItems.length));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredItems.length) % Math.max(1, filteredItems.length));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          handleSelect(filteredItems[selectedIndex].path);
        }
      } else if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen, selectedIndex, filteredItems]);

  const handleSelect = (path: string) => {
    setIsOpen(false);
    setQuery('');
    navigate(path);
  };

  return (
    <div ref={containerRef} className="relative flex items-center w-full max-w-xs sm:max-w-sm md:max-w-md">
      <div
        className={`
          flex items-center gap-2.5 h-9 px-3 w-full
          rounded-lg border text-sm
          transition-all duration-200
          ${isOpen
            ? 'bg-[var(--bg-elevated)] border-[var(--color-primary-500)] shadow-[0_0_0_3px_rgba(99,102,241,0.15)]'
            : 'bg-[var(--bg-elevated)] border-[var(--border-default)] hover:border-[var(--border-strong)]'
          }
        `}
      >
        <Search
          className="w-3.5 h-3.5 flex-shrink-0 transition-colors duration-200"
          style={{ color: isOpen ? '#818cf8' : 'var(--text-muted)' }}
          aria-hidden="true"
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={e => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search pages, models, actions… (Ctrl+K)"
          aria-label="Search the platform"
          className="
            flex-1 bg-transparent outline-none border-none
            text-[var(--text-primary)] placeholder:text-[var(--text-muted)]
            text-xs sm:text-sm font-normal min-w-0
          "
        />
        {query ? (
          <button
            onClick={() => {
              setQuery('');
              inputRef.current?.focus();
            }}
            className="p-0.5 rounded-full hover:bg-[var(--bg-card)] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex-shrink-0"
            aria-label="Clear search"
          >
            <X className="w-3 h-3" />
          </button>
        ) : (
          <kbd
            className="
              hidden lg:flex items-center gap-1 px-1.5 py-0.5
              text-[10px] font-medium font-mono
              text-[var(--text-muted)]
              bg-[var(--bg-card)] border border-[var(--border-default)]
              rounded flex-shrink-0 pointer-events-none
            "
            aria-label="Keyboard shortcut: Control K"
          >
            <Command className="w-2.5 h-2.5" aria-hidden="true" />K
          </kbd>
        )}
      </div>

      {/* Dropdown Results Overlay Panel */}
      {isOpen && (
        <div
          className="
            absolute top-full left-0 right-0 mt-2
            rounded-xl border border-[var(--border-default)]
            bg-[var(--bg-card)] shadow-[var(--shadow-xl)]
            overflow-hidden z-50 animate-scale-in max-h-80 overflow-y-auto p-2 space-y-1.5
          "
        >
          {filteredItems.length > 0 ? (
            <div>
              <div className="px-2 py-1 text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {query ? `Matching Results (${filteredItems.length})` : 'Quick Navigation'}
              </div>
              <div className="space-y-1 mt-1">
                {filteredItems.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.path)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`
                        w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-3
                        transition-colors duration-150
                        ${isSelected ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'hover:bg-[var(--bg-elevated)] text-[var(--text-primary)]'}
                      `}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 text-xs font-semibold">
                          <span className="truncate">{item.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-indigo-500/10 text-indigo-400 flex-shrink-0">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-4 text-center text-xs text-[var(--text-muted)]">
              No matching pages, models or actions found for "{query}"
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── Notification Dot Color ────────────────────────────────────────────────────
const notifColor = {
  success: 'bg-emerald-500',
  info:    'bg-blue-500',
  warning: 'bg-amber-500',
};

// ── Notifications Dropdown ────────────────────────────────────────────────────
const NotificationDropdown: React.FC<{
  notifications: Notification[];
  onMarkAllRead: () => void;
}> = ({ notifications, onMarkAllRead }) => {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <div
      className="
        absolute top-full right-0 mt-2 w-96
        rounded-xl border border-[var(--border-default)]
        bg-[var(--bg-card)] shadow-[var(--shadow-xl)]
        overflow-hidden z-50
        animate-fade-in-down
      "
      role="dialog"
      aria-label="Notifications"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[var(--text-primary)]">Notifications</span>
          {unread > 0 && (
            <span className="badge badge-indigo">{unread} new</span>
          )}
        </div>
        {unread > 0 && (
          <button
            onClick={onMarkAllRead}
            className="text-xs font-medium text-[var(--color-primary-400)] hover:text-indigo-300 transition-colors"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Items */}
      <div className="divide-y divide-[var(--border-subtle)] max-h-80 overflow-y-auto">
        {notifications.map(n => (
          <div
            key={n.id}
            className={`
              flex gap-3 px-4 py-3.5 cursor-pointer
              transition-colors duration-150
              hover:bg-[var(--bg-elevated)]
              ${!n.read ? 'bg-[var(--bg-elevated)]/50' : ''}
            `}
          >
            <div className="flex-shrink-0 mt-1">
              <span className={`status-dot ${notifColor[n.type]} ${!n.read ? 'status-dot-pulse' : ''}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-${n.read ? 'normal' : 'semibold'} text-[var(--text-primary)] leading-snug`}>
                {n.title}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-0.5 leading-snug line-clamp-2">
                {n.description}
              </p>
            </div>
            <span className="flex-shrink-0 text-[11px] text-[var(--text-muted)] mt-0.5 whitespace-nowrap">
              {n.time}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 border-t border-[var(--border-subtle)]">
        <button className="w-full text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors py-1">
          View all notifications
        </button>
      </div>
    </div>
  );
};

// ── User Dropdown ─────────────────────────────────────────────────────────────
const UserDropdown: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: User,       label: 'Profile',      shortcut: '' },
    { icon: Settings,   label: 'Settings',     shortcut: '' },
    { icon: HelpCircle, label: 'Help & Docs',  shortcut: '?' },
  ];

  return (
    <div
      className="
        absolute top-full right-0 mt-2 w-56
        rounded-xl border border-[var(--border-default)]
        bg-[var(--bg-card)] shadow-[var(--shadow-xl)]
        overflow-hidden z-50
        animate-fade-in-down
      "
      role="dialog"
      aria-label="User menu"
    >
      {/* User Info */}
      <div className="px-4 py-3 border-b border-[var(--border-subtle)]">
        <p className="text-sm font-semibold text-[var(--text-primary)]">{user?.name || 'Admin User'}</p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">{user?.email || 'admin@eduanalytics.io'}</p>
      </div>

      {/* Menu Items */}
      <div className="py-1.5">
        {menuItems.map(({ icon: Icon, label, shortcut }) => (
          <button
            key={label}
            className="
              flex items-center justify-between w-full
              px-4 py-2.5 text-sm
              text-[var(--text-secondary)] hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-elevated)]
              transition-colors duration-150
              cursor-pointer
            "
          >
            <div className="flex items-center gap-3">
              <Icon className="w-4 h-4" aria-hidden="true" />
              {label}
            </div>
            {shortcut && (
              <kbd className="text-[10px] px-1.5 py-0.5 rounded border border-[var(--border-default)] text-[var(--text-muted)] font-mono">
                {shortcut}
              </kbd>
            )}
          </button>
        ))}
      </div>

      {/* Divider + Sign Out */}
      <div className="border-t border-[var(--border-subtle)] py-1.5">
        <button
          onClick={handleSignOut}
          className="
            flex items-center gap-3 w-full
            px-4 py-2.5 text-sm
            text-red-400 hover:text-red-300 hover:bg-red-500/8
            transition-colors duration-150
            cursor-pointer
          "
        >
          <LogOut className="w-4 h-4" aria-hidden="true" />
          Sign out
        </button>
      </div>
    </div>
  );
};

// ── Main Navbar ───────────────────────────────────────────────────────────────
export const Navbar: React.FC<NavbarProps> = ({
  bestModelName = 'Random Forest',
  bestModelAccuracy = 92.5,
  onSidebarToggle,
  isSidebarOpen = true,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu]           = useState(false);
  const [notifications, setNotifications]         = useState(SAMPLE_NOTIFICATIONS);

  const notifRef   = useRef<HTMLDivElement>(null);
  const userRef    = useRef<HTMLDivElement>(null);
  const unreadCount = notifications.filter(n => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Escape key closes open dropdowns
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowNotifications(false);
        setShowUserMenu(false);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleMarkAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  return (
    <header
      className="navbar"
      role="banner"
      aria-label="Main navigation"
    >
      {/* ── Left: Sidebar Toggle + Logo ─────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-shrink-0">
        {/* Mobile / Collapse Sidebar Toggle */}
        <button
          onClick={onSidebarToggle}
          className="
            btn btn-ghost btn-sm p-2
            text-[var(--text-muted)] hover:text-[var(--text-primary)]
          "
          aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-expanded={isSidebarOpen}
        >
          {isSidebarOpen
            ? <Menu className="w-5 h-5" aria-hidden="true" />
            : <Menu className="w-5 h-5" aria-hidden="true" />
          }
        </button>

        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="
              w-8 h-8 rounded-lg flex-shrink-0
              bg-gradient-to-br from-indigo-500 to-violet-600
              flex items-center justify-center
              shadow-[0_2px_12px_rgba(99,102,241,0.35)]
            "
            aria-hidden="true"
          >
            <GraduationCap className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div className="hidden sm:block leading-none">
            <span className="text-[15px] font-bold tracking-tight text-[var(--text-primary)]">
              Edu<span className="text-indigo-400">Analytics</span>
            </span>
          </div>
        </div>

        {/* Vertical Divider */}
        <div
          className="hidden sm:block w-px h-5 bg-[var(--border-default)] mx-1"
          aria-hidden="true"
        />

        {/* Active Model Pill */}
        <div
          className="
            hidden lg:flex items-center gap-2
            px-3 py-1.5 rounded-lg
            bg-[var(--bg-elevated)] border border-[var(--border-default)]
            text-xs font-medium
          "
          title={`Active Model: ${bestModelName}`}
        >
          <Cpu className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" aria-hidden="true" />
          <span className="text-[var(--text-muted)]">Model:</span>
          <span className="text-[var(--text-primary)] max-w-[120px] truncate">{bestModelName}</span>
          <span
            className="font-semibold"
            style={{ color: bestModelAccuracy >= 85 ? '#34d399' : '#fbbf24' }}
          >
            {bestModelAccuracy.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* ── Center: Search ──────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center px-4">
        <SearchBar />
      </div>

      {/* ── Right: Actions ─────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 flex-shrink-0">

        {/* API Status Indicator */}
        <div
          className="
            hidden md:flex items-center gap-1.5
            px-2.5 py-1.5 rounded-lg
            bg-emerald-500/8 border border-emerald-500/20
            text-emerald-400 text-xs font-medium
          "
          title="FastAPI Backend is online"
          aria-label="API server status: online"
        >
          <span
            className="w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0"
            style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}
            aria-hidden="true"
          />
          <span className="hidden lg:inline">API Online</span>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="
            btn btn-ghost btn-sm p-2.5 rounded-lg
            text-[var(--text-muted)] hover:text-[var(--text-primary)]
            hover:bg-[var(--bg-elevated)]
            relative group
          "
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun
              className="w-4.5 h-4.5 transition-transform duration-200 group-hover:rotate-12"
              style={{ width: 18, height: 18 }}
              aria-hidden="true"
            />
          ) : (
            <Moon
              className="w-4.5 h-4.5 transition-transform duration-200 group-hover:-rotate-12"
              style={{ width: 18, height: 18 }}
              aria-hidden="true"
            />
          )}
        </button>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifications(prev => !prev);
              setShowUserMenu(false);
            }}
            className="
              btn btn-ghost btn-sm p-2.5 rounded-lg
              text-[var(--text-muted)] hover:text-[var(--text-primary)]
              hover:bg-[var(--bg-elevated)]
              relative
            "
            aria-label={`Notifications (${unreadCount} unread)`}
            aria-haspopup="true"
            aria-expanded={showNotifications}
          >
            <Bell style={{ width: 18, height: 18 }} aria-hidden="true" />
            {unreadCount > 0 && (
              <span
                className="
                  absolute -top-0.5 -right-0.5
                  min-w-[16px] h-4 px-1
                  rounded-full text-[10px] font-bold leading-4 text-center
                  bg-indigo-500 text-white border-2 border-[var(--bg-surface)]
                "
                aria-hidden="true"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <NotificationDropdown
              notifications={notifications}
              onMarkAllRead={handleMarkAllRead}
            />
          )}
        </div>

        {/* Vertical Divider */}
        <div className="w-px h-5 bg-[var(--border-default)] mx-1" aria-hidden="true" />

        {/* User Avatar + Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            onClick={() => {
              setShowUserMenu(prev => !prev);
              setShowNotifications(false);
            }}
            className="
              flex items-center gap-2 pl-1 pr-2.5 py-1.5
              rounded-lg hover:bg-[var(--bg-elevated)]
              transition-colors duration-150
              group
            "
            aria-label="Open user menu"
            aria-haspopup="true"
            aria-expanded={showUserMenu}
          >
            {/* Avatar */}
            <div
              className="
                w-7 h-7 rounded-lg flex-shrink-0
                bg-gradient-to-br from-violet-500 to-indigo-600
                flex items-center justify-center
                text-[11px] font-bold text-white
                shadow-sm
              "
              aria-hidden="true"
            >
              {useAuth().user?.avatar_initials || 'AU'}
            </div>
            <span className="hidden md:block text-sm font-medium text-[var(--text-secondary)] group-hover:text-[var(--text-primary)] transition-colors">
              {useAuth().user?.name ? useAuth().user!.name.split(' ')[0] : 'Admin'}
            </span>
            <ChevronDown
              className={`
                hidden md:block w-3.5 h-3.5 text-[var(--text-muted)]
                transition-transform duration-200
                ${showUserMenu ? 'rotate-180' : ''}
              `}
              aria-hidden="true"
            />
          </button>

          {showUserMenu && <UserDropdown />}
        </div>
      </div>
    </header>
  );
};

export default Navbar;

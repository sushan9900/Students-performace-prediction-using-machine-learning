
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { Navbar }  from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { mlService } from './services/mlService';
import { AuthProvider, useAuth } from './context/AuthContext';

// ── Lazy-load pages for performance ──────────────────────────────────────────
const Dashboard         = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const DatasetPage       = lazy(() => import('./pages/DatasetPage').then(m => ({ default: m.DatasetPage })));
const ModelTrainingPage  = lazy(() => import('./pages/ModelTrainingPage').then(m => ({ default: m.ModelTrainingPage })));
const PredictionPage    = lazy(() => import('./pages/PredictionPage').then(m => ({ default: m.PredictionPage })));
const HistoryPage       = lazy(() => import('./pages/HistoryPage').then(m => ({ default: m.HistoryPage })));
const ReportsPage       = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const LoginPage         = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

// ── Route Guards ─────────────────────────────────────────────────────────────
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// ── Page Suspense Fallback ────────────────────────────────────────────────────
const PageSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in-up p-1" aria-busy="true" aria-label="Loading page">
    {/* Page header skeleton */}
    <div className="space-y-2">
      <div className="skeleton h-7 w-56 rounded-xl" />
      <div className="skeleton h-4 w-96 rounded-lg" />
    </div>

    {/* Metric cards skeleton */}
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="skeleton h-3 w-24 rounded" />
            <div className="skeleton h-9 w-9 rounded-xl" />
          </div>
          <div className="skeleton h-8 w-20 rounded-lg" />
          <div className="skeleton h-3 w-32 rounded" />
        </div>
      ))}
    </div>

    {/* Content area skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 card p-5 space-y-3">
        <div className="skeleton h-4 w-40 rounded" />
        <div className="skeleton h-48 w-full rounded-xl" />
      </div>
      <div className="card p-5 space-y-3">
        <div className="skeleton h-4 w-32 rounded" />
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="flex items-center gap-3">
            <div className="skeleton h-8 w-8 rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-2.5 w-2/3 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main Dashboard Shell ──────────────────────────────────────────────────────
const MainLayout: React.FC = () => {
  const [bestModelName, setBestModelName]     = useState<string>('Random Forest Classifier');
  const [bestModelAccuracy, setBestModelAccuracy] = useState<number>(89.33);
  const [sidebarCollapsed, setSidebarCollapsed]   = useState<boolean>(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState<boolean>(false);

  // Fetch best model metadata for Navbar badge
  useEffect(() => {
    mlService
      .getBestModel()
      .then(model => {
        if (model) {
          setBestModelName(model.model_name);
          setBestModelAccuracy(model.accuracy * 100);
        }
      })
      .catch(() => {
        // Use safe defaults if backend unavailable
      });
  }, []);

  // Close mobile sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleSidebarToggle = () => {
    if (window.innerWidth < 768) {
      setMobileSidebarOpen(prev => !prev);
    } else {
      setSidebarCollapsed(prev => !prev);
    }
  };

  return (
    <div
      className="app-layout"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Sticky Top Navbar ─────────────────────────────────────── */}
      <Navbar
        bestModelName={bestModelName}
        bestModelAccuracy={bestModelAccuracy}
        onSidebarToggle={handleSidebarToggle}
        isSidebarOpen={!sidebarCollapsed}
      />

      {/* ── Main Application Shell ────────────────────────────────── */}
      <div className="content-area" style={{ height: 'calc(100vh - 56px)' }}>

        {/* ── Left Sidebar ────────────────────────────────────────── */}
        <Sidebar
          isCollapsed={sidebarCollapsed}
          onCollapsedChange={setSidebarCollapsed}
          isMobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />

        {/* ── Page Content Viewport ───────────────────────────────── */}
        <main
          className="main-content"
          id="main-content"
          role="main"
          aria-label="Page content"
        >
          <div className="page-container">
            <Suspense fallback={<PageSkeleton />}>
              <Routes>
                <Route path="/"         element={<Dashboard />} />
                <Route path="/dataset"  element={<DatasetPage />} />
                <Route path="/models"   element={<ModelTrainingPage />} />
                <Route path="/predict"  element={<PredictionPage />} />
                <Route path="/history"  element={<HistoryPage />} />
                <Route path="/reports"  element={<ReportsPage />} />
                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  );
};

// ── Root App Component ────────────────────────────────────────────────────────
export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <LoginPage />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </AuthProvider>
  );
};

export default App;


import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  GraduationCap,
  Sparkles,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  Brain,
  CheckCircle2,
  AlertCircle,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail]                 = useState('admin@eduanalytics.io');
  const [password, setPassword]           = useState('password123');
  const [name, setName]                   = useState('Dr. Sarah Jenkins');
  const [role, setRole]                   = useState('Academic Administrator');
  const [showPassword, setShowPassword]   = useState(false);
  const [rememberMe, setRememberMe]       = useState(true);
  const [error, setError]                 = useState<string | null>(null);

  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (isRegistering) {
        if (!name.trim()) throw new Error('Please enter your full name.');
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
        if (password.length < 4) throw new Error('Password must be at least 4 characters long.');

        await register(name.trim(), email.trim(), password, role);
      } else {
        if (!email.trim() || !email.includes('@')) throw new Error('Please enter a valid email address.');
        if (!password) throw new Error('Please enter your password.');

        await login(email.trim(), password);
      }

      navigate(from, { replace: true });
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your details and try again.');
    }
  };

  const handleDemoLogin = async () => {
    setError(null);
    try {
      await login('admin@eduanalytics.io', 'demo123');
      navigate('/dashboard', { replace: true });
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 relative overflow-hidden bg-[var(--bg-app)]">

      {/* Decorative ambient background glows */}
      <div
        className="absolute top-1/4 -left-20 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full pointer-events-none opacity-20 blur-3xl"
        style={{ background: 'radial-gradient(circle, #10b981 0%, transparent 70%)' }}
        aria-hidden="true"
      />

      <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10 my-8">

        {/* left side branding panel */}
        <div
          className="lg:col-span-5 rounded-2xl p-8 flex flex-col justify-between border relative overflow-hidden text-white"
          style={{
            background: 'linear-gradient(135deg, rgba(30,27,75,0.95) 0%, rgba(49,46,129,0.9) 100%)',
            borderColor: 'rgba(99,102,241,0.3)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div className="space-y-6">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/30 border border-indigo-400/40 flex items-center justify-center text-indigo-300">
                <GraduationCap style={{ width: 22, height: 22 }} />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight">EduAnalytics</h1>
                <p className="text-xs text-indigo-200/80">AI Student Performance Platform</p>
              </div>
            </div>

            {/* Headline */}
            <div className="space-y-3 pt-4">
              <span className="badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30">
                <Sparkles style={{ width: 11, height: 11 }} /> Next-Gen ML Predictions
              </span>
              <h2 className="text-2xl font-bold leading-tight">
                Predict & Prevent Academic Risk in Real-Time
              </h2>
              <p className="text-xs text-indigo-100/70 leading-relaxed">
                Leverage 8 high-precision machine learning algorithms (Random Forest, SVM, KNN) trained on student behavioral and academic indicators.
              </p>
            </div>
          </div>

          {/* Key Feature Highlights */}
          <div className="space-y-3 pt-8 border-t border-indigo-400/20">
            <div className="flex items-center gap-2.5 text-xs text-indigo-100/90">
              <CheckCircle2 style={{ width: 15, height: 15, color: '#34d399', flexShrink: 0 }} />
              <span>97.5% Model Test Accuracy Benchmark</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-indigo-100/90">
              <CheckCircle2 style={{ width: 15, height: 15, color: '#34d399', flexShrink: 0 }} />
              <span>6,607 Student Dataset Records Analyzed</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-indigo-100/90">
              <CheckCircle2 style={{ width: 15, height: 15, color: '#34d399', flexShrink: 0 }} />
              <span>FastAPI & Real-time Server Inference</span>
            </div>
          </div>
        </div>

        {/* right side login form */}
        <div
          className="lg:col-span-7 card p-8 space-y-6"
          style={{ borderColor: 'var(--border-default)', boxShadow: 'var(--shadow-xl)' }}
        >
          {/* Header & Tabs */}
          <div>
            <div className="flex items-center justify-between gap-4 mb-2">
              <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                {isRegistering ? 'Create an Account' : 'Welcome Back'}
              </h2>
              <button
                type="button"
                onClick={handleDemoLogin}
                className="btn btn-secondary btn-xs text-[11px] py-1 px-2.5 flex items-center gap-1.5"
                title="Log in with 1-click administrator credentials"
              >
                <KeyRound style={{ width: 11, height: 11, color: '#818cf8' }} />
                Quick Demo Login
              </button>
            </div>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {isRegistering
                ? 'Register to access ML performance predictors & analytics'
                : 'Sign in to access your student prediction dashboard'}
            </p>

            {/* Toggle Mode */}
            <div className="grid grid-cols-2 p-1 rounded-xl mt-5 bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setError(null); }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  !isRegistering
                    ? 'bg-[var(--bg-card)] text-[var(--color-primary-400)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setError(null); }}
                className={`py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  isRegistering
                    ? 'bg-[var(--bg-card)] text-[var(--color-primary-400)] shadow-sm'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                Create Account
              </button>
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="alert-banner alert-error text-xs" role="alert">
              <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} />
              <span className="flex-1">{error}</span>
            </div>
          )}

          {/* Form Inputs */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegistering && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="e.g. Dr. Sarah Jenkins"
                    required
                    className="form-input pl-9 text-sm"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@eduanalytics.io"
                  required
                  className="form-input pl-9 text-sm"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="form-input pl-9 pr-10 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff style={{ width: 14, height: 14 }} /> : <Eye style={{ width: 14, height: 14 }} />}
                </button>
              </div>
            </div>

            {isRegistering ? (
              <div className="form-group">
                <label className="form-label">Institutional Role</label>
                <select
                  value={role}
                  onChange={e => setRole(e.target.value)}
                  className="form-select text-sm"
                >
                  <option value="Academic Administrator">Academic Administrator</option>
                  <option value="Faculty Educator">Faculty Educator</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Department Chair">Department Chair</option>
                </select>
              </div>
            ) : (
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded border-[var(--border-default)] text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Remember session</span>
                </label>
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to registered email.')}
                  className="text-indigo-400 hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="btn btn-primary btn-lg w-full flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="animate-spin w-4 h-4" />
                    Authenticating…
                  </>
                ) : (
                  <>
                    {isRegistering ? 'Create Account & Sign In' : 'Sign In to Workspace'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Footer notice */}
          <div className="pt-4 border-t border-[var(--border-subtle)] text-center text-xs text-[var(--text-muted)] flex items-center justify-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Protected by Enterprise SSL Encryption · EduAnalytics v1.0.0</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default LoginPage;

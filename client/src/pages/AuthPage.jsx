import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, LockKeyhole, Mail, User, Zap } from 'lucide-react';
import { useState } from 'react';
import { login, loginWithGoogle, register } from '../services/api';
import { useStudioStore } from '../store/useStudioStore';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function InputField({ icon: Icon, type, placeholder, value, onChange, error, rightElement }) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400">
        <Icon size={15} />
      </div>
      <input
        className={`h-11 w-full rounded-lg border bg-white pl-9 pr-${rightElement ? '10' : '3'} text-sm transition focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
          error ? 'border-red-400 focus:ring-red-300/50' : 'border-slate-200 hover:border-slate-300'
        }`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={type === 'password' ? 'current-password' : type === 'email' ? 'email' : 'name'}
      />
      {rightElement && (
        <div className="absolute inset-y-0 right-3 flex items-center">{rightElement}</div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
    </svg>
  );
}

export function AuthPage() {
  const setUser = useStudioStore((state) => state.setUser);
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [googleEmail, setGoogleEmail] = useState('');
  const [showGoogleInput, setShowGoogleInput] = useState(false);

  // ─── Mutations ──────────────────────────────────────────────────────────────
  const authMutation = useMutation({
    mutationFn: () => (mode === 'login' ? login(form) : register(form)),
    onSuccess: (data) => setUser(data.user)
  });

  const googleMutation = useMutation({
    mutationFn: (payload) => loginWithGoogle(payload),
    onSuccess: (data) => setUser(data.user)
  });

  // ─── Validation ─────────────────────────────────────────────────────────────
  function validate() {
    const errors = {};
    if (!form.email || !emailRegex.test(form.email)) {
      errors.email = 'Enter a valid email address.';
    }
    if (!form.password || form.password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    if (mode === 'register' && !form.name.trim()) {
      errors.name = 'Your name is required.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    authMutation.mutate();
  }

  function handleGoogleSubmit(e) {
    e.preventDefault();
    if (!googleEmail || !emailRegex.test(googleEmail)) return;
    googleMutation.mutate({ email: googleEmail, name: googleEmail.split('@')[0] });
  }

  function switchMode(next) {
    setMode(next);
    setFieldErrors({});
    authMutation.reset();
    setShowGoogleInput(false);
  }

  const serverError = authMutation.error?.response?.data?.message || authMutation.error?.message;
  const googleError = googleMutation.error?.response?.data?.message || googleMutation.error?.message;
  const isPending = authMutation.isPending;
  const isGooglePending = googleMutation.isPending;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 px-4">
      {/* Background decorative blobs */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-indigo-200/30 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-96 w-96 rounded-full bg-purple-200/20 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white/90 p-8 shadow-xl shadow-slate-200/50 backdrop-blur-sm">
          {/* Header */}
          <div className="mb-7 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 shadow-lg shadow-indigo-200">
              <LockKeyhole size={22} className="text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">AI Venture Studio</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              {mode === 'login' ? 'Welcome back. Sign in to continue.' : 'Create your account to get started.'}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-50 p-1">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                id={`auth-tab-${tab}`}
                type="button"
                onClick={() => switchMode(tab)}
                className={`flex-1 rounded-lg py-2 text-sm font-semibold capitalize transition-all duration-200 ${
                  mode === tab
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200/60'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          {/* Google auth */}
          {!showGoogleInput ? (
            <button
              id="btn-google-auth"
              type="button"
              onClick={() => setShowGoogleInput(true)}
              disabled={isGooglePending}
              className="mb-4 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white py-2.5 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98] disabled:opacity-50"
            >
              <GoogleIcon />
              Continue with Google
            </button>
          ) : (
            <form onSubmit={handleGoogleSubmit} className="mb-4 space-y-2">
              <InputField
                icon={Mail}
                type="email"
                placeholder="your@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setShowGoogleInput(false); setGoogleEmail(''); googleMutation.reset(); }}
                  className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  id="btn-google-submit"
                  type="submit"
                  disabled={isGooglePending || !googleEmail}
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] disabled:opacity-60"
                >
                  {isGooglePending ? <Spinner /> : <><GoogleIcon /> Sign in</>}
                </button>
              </div>
              {googleError && <p className="text-xs text-red-500">{googleError}</p>}
            </form>
          )}

          {/* Divider */}
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-200" />
            <span className="text-xs font-medium uppercase tracking-widest text-slate-400">or with email</span>
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          {/* Email/password form */}
          <form id="auth-form" onSubmit={handleSubmit} className="space-y-3" noValidate>
            {mode === 'register' && (
              <InputField
                icon={User}
                type="text"
                placeholder="Full name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={fieldErrors.name}
              />
            )}

            <InputField
              icon={Mail}
              type="email"
              placeholder="Email address"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              error={fieldErrors.email}
            />

            <InputField
              icon={LockKeyhole}
              type={showPassword ? 'text' : 'password'}
              placeholder="Password (min 6 characters)"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              error={fieldErrors.password}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="text-slate-400 hover:text-slate-600 transition"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              }
            />

            {serverError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-600">
                {serverError}
              </div>
            )}

            {authMutation.isSuccess && mode === 'login' && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-700 flex items-center gap-2">
                <Zap size={14} className="shrink-0" /> Signed in successfully!
              </div>
            )}

            <button
              id="btn-auth-submit"
              type="submit"
              disabled={isPending}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-200/60 transition hover:from-indigo-700 hover:to-purple-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? (
                <Spinner />
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Footer */}
          <p className="mt-6 text-center text-xs text-slate-400">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              type="button"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
              className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline transition"
            >
              {mode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </div>

        {/* Bottom badge */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Secure · JWT-authenticated · AI-powered venture blueprints
        </p>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
    </svg>
  );
}

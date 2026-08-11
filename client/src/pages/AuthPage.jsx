import { useMutation } from '@tanstack/react-query';
import { LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { GoogleAuthButton } from '../components/GoogleAuthButton';
import { login, register, loginWithGoogle } from '../services/api';
import { useStudioStore } from '../store/useStudioStore';

export function AuthPage() {
  const setUser = useStudioStore((state) => state.setUser);
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [validationError, setValidationError] = useState('');
  const [showGoogleModal, setShowGoogleModal] = useState(false);
  const [customGoogleEmail, setCustomGoogleEmail] = useState('');
  const [customGoogleName, setCustomGoogleName] = useState('');

  const mutation = useMutation({
    mutationFn: (type) => {
      if (type === 'google') {
        const payload = customGoogleEmail ? { email: customGoogleEmail, name: customGoogleName || customGoogleEmail.split('@')[0] } : {};
        return loginWithGoogle(payload);
      }
      return mode === 'login' ? login(form) : register(form);
    },
    onSuccess: (data) => setUser(data.user)
  });

  const handleGoogleSelect = (account) => {
    setShowGoogleModal(false);
    if (account) {
      setCustomGoogleEmail(account.email);
      setCustomGoogleName(account.name);
      mutation.mutate('google');
    }
  };

  const handleSubmit = (type = 'form') => {
    setValidationError('');
    if (type === 'google') {
      setShowGoogleModal(true);
      return;
    }
    if (type === 'form') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!form.email || !emailRegex.test(form.email)) {
        setValidationError('Please enter a valid email address.');
        return;
      }
      if (!form.password || form.password.length < 6) {
        setValidationError('Password must be at least 6 characters long.');
        return;
      }
      if (mode === 'register' && !form.name.trim()) {
        setValidationError('Please enter your name.');
        return;
      }
    }
    mutation.mutate(type);
  };

  const sampleAccounts = [
    { name: 'Alex Johnson', email: 'alex.johnson@gmail.com', avatar: 'AJ' },
    { name: 'Venture Architect', email: 'founder@ai-venture-studio.com', avatar: 'VA' }
  ];

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4 relative">
      <section className="panel w-full max-w-md rounded-md p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
          <LockKeyhole size={18} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">AI Venture Studio</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to build investor-ready startup blueprints.</p>
        
        <div className="mt-5">
          <GoogleAuthButton onClick={() => handleSubmit('google')} disabled={mutation.isPending} />
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Or continue with email</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-2 rounded-md border border-line bg-white p-1">
          {['login', 'register'].map((item) => (
            <button key={item} onClick={() => { setMode(item); setValidationError(''); }} className={`h-9 rounded text-sm font-medium capitalize ${mode === item ? 'bg-ink text-white' : 'text-slate-500'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {mode === 'register' ? <input className="h-10 rounded-md border border-line px-3 text-sm" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /> : null}
          <input className="h-10 rounded-md border border-line px-3 text-sm" type="email" placeholder="Email (e.g. user@example.com)" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="h-10 rounded-md border border-line px-3 text-sm" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        {validationError ? <p className="mt-3 text-sm text-red-600">{validationError}</p> : null}
        {mutation.error ? <p className="mt-3 text-sm text-red-600">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
        <Button className="mt-5 w-full" onClick={() => handleSubmit('form')} disabled={mutation.isPending}>
          {mode === 'login' ? 'Sign In' : 'Create Account'}
        </Button>
      </section>

      {/* Google Account Selector Modal */}
      {showGoogleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h2 className="text-base font-semibold text-slate-800">Choose an account</h2>
              </div>
              <button onClick={() => setShowGoogleModal(false)} className="text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>
            </div>
            <p className="mt-2 text-xs text-slate-500">to continue to <span className="font-semibold text-slate-700">AI Venture Studio</span></p>

            <div className="mt-4 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
              {sampleAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleGoogleSelect(acc)}
                  className="w-full flex items-center gap-3 p-3 hover:bg-slate-50 text-left transition-colors"
                >
                  <div className="h-9 w-9 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
                    {acc.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{acc.name}</p>
                    <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-3">
              <p className="text-xs text-slate-400 mb-1">Or use another account:</p>
              <input
                type="email"
                placeholder="Enter your Google email"
                className="h-9 w-full rounded border border-slate-300 px-3 text-xs"
                value={customGoogleEmail}
                onChange={(e) => setCustomGoogleEmail(e.target.value)}
              />
              {customGoogleEmail ? (
                <Button
                  className="mt-2 w-full text-xs h-8"
                  onClick={() => handleGoogleSelect({ email: customGoogleEmail, name: customGoogleEmail.split('@')[0] })}
                >
                  Sign in as {customGoogleEmail}
                </Button>
              ) : null}
            </div>

            <button
              onClick={() => setShowGoogleModal(false)}
              className="mt-4 w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


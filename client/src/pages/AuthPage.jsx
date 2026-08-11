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
  const [form, setForm] = useState({ name: '', email: 'founder@example.com', password: 'password123' });

  const mutation = useMutation({
    mutationFn: (type) => {
      if (type === 'google') return loginWithGoogle();
      return mode === 'login' ? login(form) : register(form);
    },
    onSuccess: (data) => setUser(data.user)
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-mist px-4">
      <section className="panel w-full max-w-md rounded-md p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-ink text-white">
          <LockKeyhole size={18} />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">AI Venture Studio</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to build investor-ready startup blueprints.</p>
        
        <div className="mt-5">
          <GoogleAuthButton onClick={() => mutation.mutate('google')} disabled={mutation.isPending} />
        </div>

        <div className="my-4 flex items-center gap-3">
          <div className="h-px flex-1 bg-line" />
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">Or continue with email</span>
          <div className="h-px flex-1 bg-line" />
        </div>

        <div className="grid grid-cols-2 rounded-md border border-line bg-white p-1">
          {['login', 'register'].map((item) => (
            <button key={item} onClick={() => setMode(item)} className={`h-9 rounded text-sm font-medium capitalize ${mode === item ? 'bg-ink text-white' : 'text-slate-500'}`}>
              {item}
            </button>
          ))}
        </div>
        <div className="mt-4 grid gap-3">
          {mode === 'register' ? <input className="h-10 rounded-md border border-line px-3 text-sm" placeholder="Name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /> : null}
          <input className="h-10 rounded-md border border-line px-3 text-sm" placeholder="Email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <input className="h-10 rounded-md border border-line px-3 text-sm" type="password" placeholder="Password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} />
        </div>
        {mutation.error ? <p className="mt-3 text-sm text-red-600">{mutation.error.response?.data?.message || mutation.error.message}</p> : null}
        <Button className="mt-5 w-full" onClick={() => mutation.mutate('form')} disabled={mutation.isPending}>
          Continue
        </Button>
      </section>
    </div>
  );
}


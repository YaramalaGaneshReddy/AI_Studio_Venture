import { useMutation, useQuery } from '@tanstack/react-query';
import { AlertCircle, Bot, Loader2, Send } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { createBoardroomSession, getProjects } from '../services/api';
import { useStudioStore } from '../store/useStudioStore';

export function BoardroomPage() {
  const selectedProjectId = useStudioStore((state) => state.selectedProjectId);
  const setSelectedProjectId = useStudioStore((state) => state.setSelectedProjectId);
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const [question, setQuestion] = useState('Should I target B2B first?');
  const [session, setSession] = useState(null);

  const mutation = useMutation({
    mutationFn: () => createBoardroomSession({ projectId: selectedProjectId || undefined, question }),
    onSuccess: setSession
  });

  const roleColors = {
    'CEO Agent': 'bg-violet-50 border-violet-200 text-violet-800',
    'CTO Agent': 'bg-blue-50 border-blue-200 text-blue-800',
    'CFO Agent': 'bg-emerald-50 border-emerald-200 text-emerald-800',
    'CMO Agent': 'bg-amber-50 border-amber-200 text-amber-800',
    'VC Agent': 'bg-rose-50 border-rose-200 text-rose-800'
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Startup Boardroom</h1>
        <p className="mt-1 text-sm text-slate-500">CEO, CTO, CFO, CMO, and VC agents debate strategic questions and produce consensus.</p>
      </header>

      <section className="panel rounded-md p-5">
        <div className="grid gap-3 md:grid-cols-[260px_1fr_auto]">
          <select
            className="h-10 rounded-md border border-line bg-white px-3 text-sm"
            value={selectedProjectId || ''}
            onChange={(e) => setSelectedProjectId(e.target.value || null)}
          >
            <option value="">No project (general question)</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.startupName}
              </option>
            ))}
          </select>
          <input
            className="h-10 rounded-md border border-line px-3 text-sm"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a strategic question..."
            onKeyDown={(e) => e.key === 'Enter' && !mutation.isPending && mutation.mutate()}
          />
          <Button onClick={() => mutation.mutate()} disabled={!question.trim() || mutation.isPending}>
            {mutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {mutation.isPending ? 'Debating...' : 'Ask'}
          </Button>
        </div>

        {mutation.isPending && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={14} className="animate-spin text-indigo-500" />
            <span>Boardroom agents are deliberating — this may take 30–60 seconds…</span>
          </div>
        )}

        {mutation.error && (
          <div className="mt-4 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-4">
            <AlertCircle size={16} className="mt-0.5 shrink-0 text-red-600" />
            <div>
              <p className="text-sm font-medium text-red-700">Boardroom request failed</p>
              <p className="mt-1 text-sm text-red-600">
                {mutation.error.response?.data?.message || mutation.error.message || 'Unable to reach the backend. Make sure the server is running.'}
              </p>
            </div>
          </div>
        )}
      </section>

      {session ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold">Executive Perspectives</h2>
            {session.messages.map((message) => (
              <article
                key={`${message.role}-${message.content?.slice(0, 20)}`}
                className={`rounded-md border p-4 ${roleColors[message.role] || 'border-line bg-white'}`}
              >
                <div className="flex items-center gap-2">
                  <Bot size={14} />
                  <p className="text-sm font-semibold">{message.role}</p>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed opacity-90">{message.content}</p>
              </article>
            ))}
          </div>
          <aside className="panel rounded-md p-5">
            <h2 className="text-lg font-semibold">Consensus</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{session.consensus}</p>
          </aside>
        </section>
      ) : null}
    </div>
  );
}

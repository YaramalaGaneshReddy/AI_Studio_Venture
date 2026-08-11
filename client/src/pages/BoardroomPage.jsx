import { useMutation, useQuery } from '@tanstack/react-query';
import { Send } from 'lucide-react';
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
    mutationFn: () => createBoardroomSession({ projectId: selectedProjectId, question }),
    onSuccess: setSession
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Startup Boardroom</h1>
        <p className="mt-1 text-sm text-slate-500">CEO, CTO, CFO, CMO, and VC agents debate strategic questions and produce consensus.</p>
      </header>
      <section className="panel rounded-md p-5">
        <div className="grid gap-3 md:grid-cols-[260px_1fr_auto]">
          <select className="h-10 rounded-md border border-line bg-white px-3 text-sm" value={selectedProjectId || ''} onChange={(event) => setSelectedProjectId(event.target.value)}>
            <option value="">Select project</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.startupName}
              </option>
            ))}
          </select>
          <input className="h-10 rounded-md border border-line px-3 text-sm" value={question} onChange={(event) => setQuestion(event.target.value)} />
          <Button onClick={() => mutation.mutate()} disabled={!selectedProjectId || mutation.isPending}>
            <Send size={16} />
            Ask
          </Button>
        </div>
      </section>
      {session ? (
        <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
          <div className="space-y-3">
            {session.messages.map((message) => (
              <article key={`${message.role}-${message.createdAt}`} className="rounded-md border border-line bg-white p-4">
                <p className="text-sm font-semibold">{message.role}</p>
                <p className="mt-2 text-sm text-slate-600">{message.content}</p>
              </article>
            ))}
          </div>
          <aside className="panel rounded-md p-5">
            <h2 className="text-lg font-semibold">Consensus</h2>
            <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{session.consensus}</p>
          </aside>
        </section>
      ) : null}
    </div>
  );
}

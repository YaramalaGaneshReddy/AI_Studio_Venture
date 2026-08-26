import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Mail, Play, RefreshCcw, Save } from 'lucide-react';
import { useMemo, useState } from 'react';
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { WorkflowGraph } from '../components/WorkflowGraph';
import { createProject, decideAgent, downloadExport, exportUrl, getProject, getProjects, runAgent, sendProjectEmail } from '../services/api';
import { useStudioStore } from '../store/useStudioStore';

const initialForm = {
  startupName: '',
  idea: '',
  industry: '',
  targetUsers: '',
  country: '',
  budget: '',
  timeline: ''
};

export function StudioPage() {
  const queryClient = useQueryClient();
  const { selectedProjectId, setSelectedProjectId } = useStudioStore();
  const [form, setForm] = useState(initialForm);
  const [autoMode, setAutoMode] = useState(true);
  const [editedContent, setEditedContent] = useState('');
  const [email, setEmail] = useState('');

  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: getProjects });
  const projectQuery = useQuery({
    queryKey: ['project', selectedProjectId],
    queryFn: () => getProject(selectedProjectId),
    enabled: Boolean(selectedProjectId),
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      const hasActiveAgents = query.state.data?.agentRuns?.some((run) => ['running', 'pending'].includes(run.status));
      return selectedProjectId && (status === 'running' || hasActiveAgents) ? 1000 : selectedProjectId ? 3000 : false;
    }
  });

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      setSelectedProjectId(project._id);
      setForm(initialForm);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const runMutation = useMutation({
    mutationFn: () => runAgent(selectedProjectId, autoMode ? 'auto' : 'manual'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', selectedProjectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    }
  });

  const decisionMutation = useMutation({
    mutationFn: ({ agentKey, decision }) => decideAgent(selectedProjectId, agentKey, decision, editedContent),
    onSuccess: () => {
      setEditedContent('');
      queryClient.invalidateQueries({ queryKey: ['project', selectedProjectId] });
    }
  });

  const emailMutation = useMutation({
    mutationFn: () => sendProjectEmail(selectedProjectId, email)
  });

  const project = projectQuery.data;
  const activeRun = useMemo(() => project?.agentRuns?.find((run) => run.status === 'awaiting_approval'), [project]);

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  function submitProject(event) {
    event.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-normal text-ink">Venture Studio</h1>
          <p className="mt-1 text-sm text-slate-500">Create, inspect, approve, export, and send investor-ready startup blueprints.</p>
        </div>
        <select
          className="h-10 rounded-md border border-line bg-white px-3 text-sm"
          value={selectedProjectId || ''}
          onChange={(event) => setSelectedProjectId(event.target.value || null)}
        >
          <option value="">Select project</option>
          {projectsQuery.data?.map((item) => (
            <option key={item._id} value={item._id}>
              {item.startupName}
            </option>
          ))}
        </select>
      </header>

      <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
        <form onSubmit={submitProject} className="panel rounded-md p-5">
          <h2 className="text-lg font-semibold">Startup Idea Submission</h2>
          <div className="mt-4 grid gap-3">
            {[
              ['startupName', 'Startup name'],
              ['idea', 'Startup idea'],
              ['industry', 'Industry'],
              ['targetUsers', 'Target users'],
              ['country', 'Country'],
              ['budget', 'Budget'],
              ['timeline', 'Timeline']
            ].map(([name, label]) =>
              name === 'idea' ? (
                <textarea key={name} name={name} value={form[name]} onChange={updateField} placeholder={label} required className="min-h-28 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent" />
              ) : (
                <input key={name} name={name} value={form[name]} onChange={updateField} placeholder={label} required className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-accent" />
              )
            )}
          </div>
          {createMutation.error ? (
            <p className="mt-3 text-sm text-red-600">
              {createMutation.error.response?.data?.message || createMutation.error.message}
            </p>
          ) : null}
          <Button className="mt-4 w-full" disabled={createMutation.isPending}>
            <Save size={16} />
            {createMutation.isPending ? 'Creating...' : 'Create Project'}
          </Button>
        </form>

        <div className="space-y-4">
          <div className="panel rounded-md p-5">
            <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
              <div>
                <h2 className="text-lg font-semibold">{project?.startupName || 'No project selected'}</h2>
                <p className="mt-1 text-sm text-slate-500">{project?.idea || 'Create or select a project to start the agent workflow.'}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm">
                  <input type="checkbox" checked={autoMode} onChange={(event) => setAutoMode(event.target.checked)} />
                  Fast Auto Mode
                </label>
                <Button onClick={() => runMutation.mutate()} disabled={!selectedProjectId || runMutation.isPending}>
                  <Play size={16} />
                  {runMutation.isPending ? 'Agents Running...' : 'Run Agents'}
                </Button>
              </div>
            </div>
            {runMutation.error ? (
              <p className="mt-3 text-sm text-red-600">
                {runMutation.error.response?.data?.message || runMutation.error.message}
              </p>
            ) : null}
          </div>

          {project?.agentRuns?.length ? <WorkflowGraph agents={project.agentRuns} /> : null}

          {project?.startupScore ? (
            <div className="panel rounded-md p-5">
              <h2 className="text-lg font-semibold">Startup Health Radar (Score: {project.startupScore.overall || 0}/100)</h2>
              <div className="mt-4 grid gap-4 lg:grid-cols-2 items-center">
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={[
                      { metric: 'Market Demand', score: project.startupScore.marketDemand || 0 },
                      { metric: 'Competition', score: project.startupScore.competition || 0 },
                      { metric: 'Revenue', score: project.startupScore.revenuePotential || 0 },
                      { metric: 'Technical', score: project.startupScore.technicalFeasibility || 0 },
                      { metric: 'Execution', score: project.startupScore.executionComplexity || 0 }
                    ]}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="metric" />
                      <Radar dataKey="score" stroke="#2563EB" fill="#3B82F6" fillOpacity={0.4} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between border-b border-line pb-1">
                    <span className="text-slate-500">Market Demand</span>
                    <span className="font-medium">{project.startupScore.marketDemand || 0}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-1">
                    <span className="text-slate-500">Competition</span>
                    <span className="font-medium">{project.startupScore.competition || 0}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-1">
                    <span className="text-slate-500">Revenue Potential</span>
                    <span className="font-medium">{project.startupScore.revenuePotential || 0}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-1">
                    <span className="text-slate-500">Technical Feasibility</span>
                    <span className="font-medium">{project.startupScore.technicalFeasibility || 0}/100</span>
                  </div>
                  <div className="flex justify-between border-b border-line pb-1">
                    <span className="text-slate-500">Execution Complexity</span>
                    <span className="font-medium">{project.startupScore.executionComplexity || 0}/100</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      {project ? (
        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="panel rounded-md p-5">
            <h2 className="text-lg font-semibold">Agent Reports</h2>
            <div className="mt-4 space-y-3">
              {project.agentRuns.map((run) => (
                <details key={run.key} className="rounded-md border border-line bg-white p-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
                    <span className="font-medium">{run.name}</span>
                    <StatusBadge status={run.status} />
                  </summary>
                  <pre className="mt-4 whitespace-pre-wrap rounded-md bg-slate-50 p-4 text-sm text-slate-700">{run.output || 'Waiting for this agent to run.'}</pre>
                </details>
              ))}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="panel rounded-md p-5">
              <h2 className="text-lg font-semibold">Human Approval</h2>
              {activeRun ? (
                <div className="mt-4 space-y-3">
                  <p className="text-sm text-slate-500">{activeRun.name} is waiting for your review.</p>
                  <textarea value={editedContent} onChange={(event) => setEditedContent(event.target.value)} placeholder="Optional edited report content" className="min-h-36 w-full rounded-md border border-line px-3 py-2 text-sm" />
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => decisionMutation.mutate({ agentKey: activeRun.key, decision: 'approve' })}>Approve</Button>
                    <Button variant="secondary" onClick={() => decisionMutation.mutate({ agentKey: activeRun.key, decision: 'regenerate' })}>
                      <RefreshCcw size={15} />
                    </Button>
                    <Button variant="secondary" onClick={() => decisionMutation.mutate({ agentKey: activeRun.key, decision: 'edit' })}>Edit</Button>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-slate-500">No agent is currently waiting for review.</p>
              )}
            </div>

            <div className="panel rounded-md p-5">
              <h2 className="text-lg font-semibold">Exports</h2>
              <div className="mt-4 grid gap-2">
                {['pdf', 'markdown', 'json'].map((format) => (
                  <button key={format} onClick={() => downloadExport(project._id || project.id, format)} className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-line bg-white text-sm font-medium capitalize hover:bg-slate-50">
                    <Download size={16} />
                    {format}
                  </button>
                ))}
                <input className="h-10 rounded-md border border-line px-3 text-sm" placeholder="founder@example.com" value={email} onChange={(event) => setEmail(event.target.value)} />
                <Button onClick={() => emailMutation.mutate()} disabled={!email || emailMutation.isPending}>
                  <Mail size={16} />
                  {emailMutation.isPending ? 'Sending Email...' : 'Send Email'}
                </Button>
                {emailMutation.data?.skipped ? (
                  <p className="text-xs text-amber-700 font-medium">SMTP / Resend is not configured on the server environment. Please set RESEND_API_KEY or SMTP parameters in your server Environment Variables.</p>
                ) : null}
                {emailMutation.data?.error ? (
                  <p className="text-xs text-red-600 font-medium">{emailMutation.data.error}</p>
                ) : null}
                {emailMutation.isSuccess && !emailMutation.data?.skipped && !emailMutation.data?.error ? (
                  <p className="text-xs text-emerald-600 font-medium">Email sent successfully to {email}!</p>
                ) : null}
                {emailMutation.error ? (
                  <p className="text-xs text-red-600 font-medium">{emailMutation.error.response?.data?.message || emailMutation.error.message}</p>
                ) : null}
              </div>
            </div>
          </aside>
        </section>
      ) : null}
    </div>
  );
}

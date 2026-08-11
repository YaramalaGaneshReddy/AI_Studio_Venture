import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, ChevronUp, Clock, Gauge, Layers, PlusCircle, Save } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { createProject, getProjects } from '../services/api';
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

export function DashboardPage({ onNavigate }) {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects, refetchInterval: 5000 });
  const setSelectedProjectId = useStudioStore((state) => state.setSelectedProjectId);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);

  const createMutation = useMutation({
    mutationFn: createProject,
    onSuccess: (project) => {
      setSelectedProjectId(project._id);
      setForm(initialForm);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onNavigate('studio');
    }
  });

  function updateField(e) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    createMutation.mutate(form);
  }

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink">Projects</h1>
          <p className="mt-1 text-sm text-slate-500">Track startup scores, execution status, and last updates.</p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)} variant="secondary">
          {showForm ? <ChevronUp size={16} /> : <PlusCircle size={16} />}
          {showForm ? 'Cancel' : 'New Startup'}
        </Button>
      </header>

      {/* Project creation form */}
      {showForm && (
        <section className="panel rounded-md p-5">
          <h2 className="text-lg font-semibold">Submit a Startup Idea</h2>
          <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              ['startupName', 'Startup name', false],
              ['industry', 'Industry (e.g. EdTech, FinTech)', false],
              ['targetUsers', 'Target users', false],
              ['country', 'Country / Market', false],
              ['budget', 'Budget (e.g. $25,000)', false],
              ['timeline', 'Timeline (e.g. 12 weeks)', false]
            ].map(([name, label]) => (
              <input
                key={name}
                name={name}
                value={form[name]}
                onChange={updateField}
                placeholder={label}
                required
                className="h-10 rounded-md border border-line px-3 text-sm outline-none focus:border-accent"
              />
            ))}
            <textarea
              name="idea"
              value={form.idea}
              onChange={updateField}
              placeholder="Describe your startup idea in detail…"
              required
              className="col-span-full min-h-24 rounded-md border border-line px-3 py-2 text-sm outline-none focus:border-accent"
            />
            {createMutation.error && (
              <p className="col-span-full text-sm text-red-600">
                {createMutation.error.response?.data?.message || createMutation.error.message}
              </p>
            )}
            <div className="col-span-full">
              <Button className="w-full sm:w-auto" disabled={createMutation.isPending}>
                <Save size={16} />
                {createMutation.isPending ? 'Creating...' : 'Create Project & Open Studio'}
              </Button>
            </div>
          </form>
        </section>
      )}

      {/* Summary metrics */}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={Layers} label="Projects" value={data.length} />
        <Metric
          icon={Gauge}
          label="Average score"
          value={Math.round(data.reduce((s, p) => s + (p.startupScore?.overall || 0), 0) / Math.max(data.length, 1))}
        />
        <Metric icon={Clock} label="In progress" value={data.filter((p) => p.status !== 'completed').length} />
      </section>

      {/* Projects table */}
      <section className="panel overflow-hidden rounded-md">
        <div className="grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] border-b border-line px-5 py-3 text-xs font-semibold uppercase text-slate-500">
          <span>Startup</span>
          <span>Status</span>
          <span>Score</span>
          <span>Updated</span>
          <span />
        </div>
        {data.map((project) => (
          <div key={project._id} className="grid grid-cols-[1.4fr_1fr_1fr_1fr_auto] items-center border-b border-line px-5 py-4 text-sm last:border-b-0">
            <div>
              <p className="font-medium">{project.startupName}</p>
              <p className="mt-1 line-clamp-1 text-slate-500">{project.industry}</p>
            </div>
            <StatusBadge status={project.status} />
            <span>{project.startupScore?.overall || 0}/100</span>
            <span className="text-slate-500">{new Date(project.updatedAt).toLocaleDateString()}</span>
            <Button
              variant="secondary"
              onClick={() => {
                setSelectedProjectId(project._id);
                onNavigate('studio');
              }}
            >
              Open
            </Button>
          </div>
        ))}
        {!data.length ? (
          <p className="p-5 text-sm text-slate-500">
            No projects yet.{' '}
            <button className="text-accent underline" onClick={() => setShowForm(true)}>
              Create your first startup
            </button>
            .
          </p>
        ) : null}
      </section>
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="panel rounded-md p-5">
      <Icon size={18} className="text-slate-500" />
      <p className="mt-3 text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-3xl font-semibold">{value}</p>
    </div>
  );
}

import { useQuery } from '@tanstack/react-query';
import { Clock, Gauge, Layers } from 'lucide-react';
import { Button } from '../components/Button';
import { StatusBadge } from '../components/StatusBadge';
import { getProjects } from '../services/api';
import { useStudioStore } from '../store/useStudioStore';

export function DashboardPage({ onNavigate }) {
  const { data = [] } = useQuery({ queryKey: ['projects'], queryFn: getProjects, refetchInterval: 5000 });
  const setSelectedProjectId = useStudioStore((state) => state.setSelectedProjectId);

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Projects</h1>
        <p className="mt-1 text-sm text-slate-500">Track startup scores, execution status, and last updates.</p>
      </header>
      <section className="grid gap-4 md:grid-cols-3">
        <Metric icon={Layers} label="Projects" value={data.length} />
        <Metric icon={Gauge} label="Average score" value={Math.round(data.reduce((sum, item) => sum + (item.startupScore?.overall || 0), 0) / Math.max(data.length, 1))} />
        <Metric icon={Clock} label="In progress" value={data.filter((item) => item.status !== 'completed').length} />
      </section>
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
        {!data.length ? <p className="p-5 text-sm text-slate-500">No projects yet. Create one in Studio.</p> : null}
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

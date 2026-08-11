import { useQuery } from '@tanstack/react-query';
import {
  Bar, BarChart, CartesianGrid, PolarAngleAxis, PolarGrid,
  Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis
} from 'recharts';
import { api } from '../services/api';

export function AnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await api.get('/analytics');
      return response.data;
    },
    refetchInterval: 5000
  });

  // Derive KPI values
  const completedRuns = (data?.runtime || []).filter((r) => r.status === 'completed');
  const avgRuntime = completedRuns.length
    ? Math.round(completedRuns.reduce((s, r) => s + r.runtimeMs, 0) / completedRuns.length)
    : 0;
  const completionRate = data?.completionRate != null ? Math.round(data.completionRate * 100) : 0;
  const totalTokens = data?.tokenUsage || 0;
  const mostUsed = data?.mostUsedAgents?.reduce((top, a) => (!top || a.count > top.count ? a : top), null);

  const kpiCards = [
    { label: 'Avg Agent Runtime', value: avgRuntime ? `${(avgRuntime / 1000).toFixed(1)}s` : '—', sub: 'across completed runs', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Completion Rate', value: `${completionRate}%`, sub: 'agents completed / total', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Total Tokens Used', value: totalTokens.toLocaleString(), sub: 'estimated prompt + output', color: 'text-violet-600', bg: 'bg-violet-50' },
    { label: 'Most Used Agent', value: mostUsed?.name?.replace(' Agent', '') || '—', sub: `${mostUsed?.count || 0} runs`, color: 'text-amber-600', bg: 'bg-amber-50' }
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Agent runtime, completion, token usage, and health scoring.</p>
      </header>

      {/* KPI Cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((card) => (
          <div key={card.label} className="panel rounded-md p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{card.label}</p>
            <p className={`mt-3 text-3xl font-bold ${card.color}`}>
              {isLoading ? '…' : card.value}
            </p>
            <p className="mt-1 text-xs text-slate-400">{card.sub}</p>
          </div>
        ))}
      </section>

      {/* Charts */}
      <section className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Agent Runtime (ms)">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.runtime || []} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" hide />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                formatter={(v) => [`${v} ms`, 'Runtime']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.name || ''}
              />
              <Bar dataKey="runtimeMs" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Startup Health Score">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={data?.scoreRadar || []}>
              <PolarGrid stroke="#E5E7EB" />
              <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11 }} />
              <Radar dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              <Tooltip formatter={(v) => [`${v}/100`, 'Score']} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>

        <ChartPanel title="Agent Usage Count" className="lg:col-span-2">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data?.mostUsedAgents || []} margin={{ left: 0, right: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
    </div>
  );
}

function ChartPanel({ title, children, className = '' }) {
  return (
    <div className={`panel rounded-md p-5 ${className}`}>
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

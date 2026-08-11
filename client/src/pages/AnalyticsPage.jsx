import { useQuery } from '@tanstack/react-query';
import { BarChart, Bar, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, Radar } from 'recharts';
import { api } from '../services/api';

export function AnalyticsPage() {
  const { data } = useQuery({
    queryKey: ['analytics'],
    queryFn: async () => {
      const response = await api.get('/analytics');
      return response.data;
    },
    refetchInterval: 5000
  });

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <header>
        <h1 className="text-3xl font-semibold text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-slate-500">Agent runtime, completion, token usage, and health scoring.</p>
      </header>
      <section className="grid gap-6 lg:grid-cols-2">
        <ChartPanel title="Agent Runtime">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data?.runtime || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="runtimeMs" fill="#2563EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartPanel>
        <ChartPanel title="Startup Health Score">
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={data?.scoreRadar || []}>
              <PolarGrid />
              <PolarAngleAxis dataKey="metric" />
              <Radar dataKey="score" stroke="#10B981" fill="#10B981" fillOpacity={0.25} />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </ChartPanel>
      </section>
    </div>
  );
}

function ChartPanel({ title, children }) {
  return (
    <div className="panel rounded-md p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

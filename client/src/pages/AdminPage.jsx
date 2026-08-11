import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, FolderKanban, Cpu, Activity, ShieldAlert, Trash2, CheckCircle2, Shield } from 'lucide-react';
import { getAdminStats, getAdminUsers, getAdminProjects, updateUserRole, deleteUser } from '../services/api';
import { Button } from '../components/Button';

export function AdminPage() {
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: getAdminStats,
    refetchInterval: 5000
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAdminUsers
  });

  const { data: projects, isLoading: projectsLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: getAdminProjects
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateUserRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (userId) => deleteUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
    }
  });

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <header className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-ink flex items-center gap-2">
            <Shield className="text-blue-600" size={28} /> Admin Dashboard
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            System metrics, user privileges, registered founders, and global project analytics.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
          <CheckCircle2 size={14} /> System Online & Healthy
        </div>
      </header>

      {/* KPI Stats Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats?.totalUsers ?? '...'}
          trend="Registered founders & admins"
          color="text-blue-600"
          bg="bg-blue-50"
        />
        <StatCard
          icon={FolderKanban}
          label="Venture Blueprints"
          value={stats?.totalProjects ?? '...'}
          trend="Total active projects"
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          icon={Cpu}
          label="Agent Executions"
          value={stats?.totalAgentRuns ?? '...'}
          trend={`${stats?.completedRuns || 0} completed runs`}
          color="text-emerald-600"
          bg="bg-emerald-50"
        />
        <StatCard
          icon={Activity}
          label="System Health"
          value="100%"
          trend="API latency ~45ms"
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </section>

      {/* User Management Section */}
      <section className="panel rounded-lg border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink mb-1">User Management</h2>
        <p className="text-sm text-slate-500 mb-5">
          View registered accounts, toggle admin access privileges, or manage users.
        </p>

        {usersLoading ? (
          <p className="text-sm text-slate-400">Loading user records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {users?.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-medium text-ink">{u.name}</td>
                    <td className="py-3.5 text-slate-600">{u.email}</td>
                    <td className="py-3.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          u.role === 'admin'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role === 'admin' ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3.5 text-slate-500">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Button
                        variant="secondary"
                        className="h-8 px-2.5 text-xs"
                        onClick={() =>
                          roleMutation.mutate({
                            userId: u._id,
                            role: u.role === 'admin' ? 'user' : 'admin'
                          })
                        }
                      >
                        Make {u.role === 'admin' ? 'User' : 'Admin'}
                      </Button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete user ${u.name}?`)) {
                            deleteMutation.mutate(u._id);
                          }
                        }}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-red-200 text-red-600 hover:bg-red-50 transition"
                        title="Delete User"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Global Venture Blueprints */}
      <section className="panel rounded-lg border border-line bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-ink mb-1">Platform Projects</h2>
        <p className="text-sm text-slate-500 mb-5">
          Overview of all AI startup projects generated across users.
        </p>

        {projectsLoading ? (
          <p className="text-sm text-slate-400">Loading project records...</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <th className="pb-3">Project Title</th>
                  <th className="pb-3">Target Industry</th>
                  <th className="pb-3">Owner</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Agents Run</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {projects?.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/50">
                    <td className="py-3.5 font-medium text-ink">{p.startupName}</td>
                    <td className="py-3.5 text-slate-600">{p.industry}</td>
                    <td className="py-3.5 text-slate-600">{p.user?.name || 'Unknown'}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 capitalize">
                        {p.status || 'Active'}
                      </span>
                    </td>
                    <td className="py-3.5 text-right font-medium text-slate-700">
                      {p.agentRuns?.length || 0} agents
                    </td>
                  </tr>
                ))}
                {(!projects || projects.length === 0) && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-slate-400">
                      No venture projects created yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, trend, color, bg }) {
  return (
    <div className="panel rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${bg} ${color}`}>
          <Icon size={18} />
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-ink">{value}</p>
        <p className="mt-1 text-xs text-slate-400">{trend}</p>
      </div>
    </div>
  );
}

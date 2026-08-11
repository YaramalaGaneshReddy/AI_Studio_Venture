import { BarChart3, Bot, FolderKanban, Lightbulb, LogOut, Search, ShieldCheck, Shield } from 'lucide-react';
import { clsx } from 'clsx';
import { useStudioStore } from '../store/useStudioStore';

const navItems = [
  { id: 'studio', label: 'Studio', icon: Lightbulb },
  { id: 'dashboard', label: 'Projects', icon: FolderKanban },
  { id: 'boardroom', label: 'Boardroom', icon: Bot },
  { id: 'memory', label: 'Memory', icon: Search },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'admin', label: 'Admin Panel', icon: Shield }
];

export function AppShell({ activeView, onNavigate, children }) {
  const user = useStudioStore((state) => state.user);
  const logout = useStudioStore((state) => state.logout);

  return (
    <div className="min-h-screen bg-mist">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white px-4 py-5 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-md bg-ink text-white">
              <ShieldCheck size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold">AI Venture Studio</p>
              <p className="text-xs text-slate-500">Investor blueprint lab</p>
            </div>
          </div>
          <nav className="mt-8 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={clsx(
                    'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                    activeView === item.id ? 'bg-ink text-white' : 'text-slate-600 hover:bg-slate-100'
                  )}
                >
                  <Icon size={17} />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {user ? (
          <div className="border-t border-line pt-4">
            <div className="flex items-center justify-between px-2">
              <div className="truncate">
                <p className="truncate text-sm font-medium text-ink">{user.name}</p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
                <span className="mt-1 inline-block rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600 capitalize">
                  {user.role || 'user'}
                </span>
              </div>
              <button
                onClick={logout}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                title="Log out"
              >
                <LogOut size={16} />
              </button>
            </div>
          </div>
        ) : null}
      </aside>
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">{children}</div>
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-white lg:hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={clsx('flex flex-1 flex-col items-center gap-1 py-2 text-[11px]', activeView === item.id ? 'text-ink' : 'text-slate-500')}
            >
              <Icon size={18} />
              {item.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

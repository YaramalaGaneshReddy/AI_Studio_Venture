import { useEffect, useRef, useState } from 'react';
import { AppShell } from './layouts/AppShell';
import { AdminPage } from './pages/AdminPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthPage } from './pages/AuthPage';
import { BoardroomPage } from './pages/BoardroomPage';
import { DashboardPage } from './pages/DashboardPage';
import { MemoryPage } from './pages/MemoryPage';
import { StudioPage } from './pages/StudioPage';
import { getMe } from './services/api';
import { useStudioStore } from './store/useStudioStore';

const views = {
  studio: StudioPage,
  dashboard: DashboardPage,
  boardroom: BoardroomPage,
  memory: MemoryPage,
  analytics: AnalyticsPage,
  admin: AdminPage
};

export default function App() {
  const [activeView, setActiveView] = useState('studio');
  const user = useStudioStore((state) => state.user);
  const setUser = useStudioStore((state) => state.setUser);
  const logout = useStudioStore((state) => state.logout);
  const [loadingMe, setLoadingMe] = useState(true);
  const didFetch = useRef(false);

  useEffect(() => {
    // Guard: only run once even in StrictMode double-invoke
    if (didFetch.current) return;
    didFetch.current = true;

    const handleUnauthorized = () => {
      logout();
      setLoadingMe(false);
    };
    window.addEventListener('avs-unauthorized', handleUnauthorized);

    const token = localStorage.getItem('avs_token');
    if (token && !user) {
      getMe()
        .then((res) => setUser(res.user))
        .catch(() => {
          // Token is stale / invalid — clear it and show login page
          logout();
        })
        .finally(() => setLoadingMe(false));
    } else {
      setLoadingMe(false);
    }

    return () => window.removeEventListener('avs-unauthorized', handleUnauthorized);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ActiveView = views[activeView] || StudioPage;

  if (loadingMe) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-gradient-to-br from-slate-50 to-indigo-50/30">
        <svg className="h-8 w-8 animate-spin text-indigo-500" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
        </svg>
        <p className="text-sm text-slate-500">Authenticating session…</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <AppShell activeView={activeView} onNavigate={setActiveView}>
      <ActiveView onNavigate={setActiveView} />
    </AppShell>
  );
}

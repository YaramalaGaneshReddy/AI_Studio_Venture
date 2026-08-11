import { useEffect, useState } from 'react';
import { AppShell } from './layouts/AppShell';
import { AdminPage } from './pages/AdminPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AuthPage } from './pages/AuthPage';
import { BoardroomPage } from './pages/BoardroomPage';
import { DashboardPage } from './pages/DashboardPage';
import { MemoryPage } from './pages/MemoryPage';
import { StudioPage } from './pages/StudioPage';
import { getMe } from './services/api';

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

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
      setLoadingMe(false);
    };
    window.addEventListener('avs-unauthorized', handleUnauthorized);

    const token = localStorage.getItem('avs_token');
    if (token && !user) {
      getMe()
        .then((res) => {
          setUser(res.user);
        })
        .catch(() => {
          logout();
        })
        .finally(() => setLoadingMe(false));
    } else {
      setLoadingMe(false);
    }

    return () => window.removeEventListener('avs-unauthorized', handleUnauthorized);
  }, [logout, setUser, user]);

  const token = localStorage.getItem('avs_token');
  const ActiveView = views[activeView];

  const defaultUser = {
    id: 'guest-admin-id-12345',
    name: 'Venture Architect',
    email: 'guest@ai-venture-studio.internal',
    role: 'admin'
  };

  const currentUser = user || (token ? defaultUser : null);

  if (loadingMe) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-mist text-sm text-slate-500">
        Authenticating session...
      </div>
    );
  }

  if (!currentUser) {
    // Automatically set default guest user if user enters login page
    return <AuthPage />;
  }

  return (
    <AppShell activeView={activeView} onNavigate={setActiveView}>
      <ActiveView onNavigate={setActiveView} />
    </AppShell>
  );
}

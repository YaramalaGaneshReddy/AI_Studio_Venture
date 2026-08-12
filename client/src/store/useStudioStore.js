import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStudioStore = create(
  persist(
    (set, get) => ({
      selectedProjectId: null,
      user: null,
      setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
      setUser: (user) => set({ user }),
      logout: () => {
        localStorage.removeItem('avs_token');
        set({ user: null, selectedProjectId: null });
      },
      // Called on app boot: if a persisted user exists but the JWT is gone, clear state
      syncTokenGuard: () => {
        const { user, logout } = get();
        if (user && !localStorage.getItem('avs_token')) {
          logout();
        }
      }
    }),
    {
      name: 'avs-store',
      // Only persist the user object, not transient UI state
      partialize: (state) => ({ user: state.user })
    }
  )
);

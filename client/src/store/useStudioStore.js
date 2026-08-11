import { create } from 'zustand';

export const useStudioStore = create((set) => ({
  selectedProjectId: null,
  user: null,
  setSelectedProjectId: (selectedProjectId) => set({ selectedProjectId }),
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('avs_token');
    set({ user: null, selectedProjectId: null });
  }
}));

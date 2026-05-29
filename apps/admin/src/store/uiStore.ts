import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UiState {
  darkMode: boolean;
  sidebarCollapsed: boolean;
  mobileDrawerOpen: boolean;
  toggleDarkMode: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  setMobileDrawerOpen: (v: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      darkMode: false,
      sidebarCollapsed: false,
      mobileDrawerOpen: false,
      toggleDarkMode: () =>
        set((s) => {
          const next = !s.darkMode;
          document.documentElement.classList.toggle('dark', next);
          return { darkMode: next };
        }),
      setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
      setMobileDrawerOpen: (mobileDrawerOpen) => set({ mobileDrawerOpen }),
    }),
    {
      name: 'acoustic-admin-ui',
      partialize: (s) => ({ darkMode: s.darkMode, sidebarCollapsed: s.sidebarCollapsed }),
      onRehydrateStorage: () => (state) => {
        if (state?.darkMode) {
          document.documentElement.classList.add('dark');
        }
      },
    },
  ),
);

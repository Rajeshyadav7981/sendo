import { create } from 'zustand';

interface UiState {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  openSubmenu: string | null;
  setOpenSubmenu: (key: string | null) => void;
}

export const useUiStore = create<UiState>((set, get) => ({
  isSidebarOpen: typeof window !== 'undefined' ? window.innerWidth > 768 : true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  toggleSidebar: () => set({ isSidebarOpen: !get().isSidebarOpen }),
  openSubmenu: null,
  setOpenSubmenu: (key) => set({ openSubmenu: get().openSubmenu === key ? null : key }),
}));

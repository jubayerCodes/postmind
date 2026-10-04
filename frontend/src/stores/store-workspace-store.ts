import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreWorkspaceState {
  activeStoreId: string | null;
  setActiveStoreId: (id: string | null) => void;
}

export const useStoreWorkspaceStore = create<StoreWorkspaceState>()(
  persist(
    (set) => ({
      activeStoreId: null,
      setActiveStoreId: (id) => set({ activeStoreId: id }),
    }),
    {
      name: 'postmind_active_store_id',
    },
  ),
);

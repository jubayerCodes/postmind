import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface StoreWorkspaceState {
  activeStoreId: string | null;
  isSwitchingWorkspace: boolean;
  switchingTargetId: string | null;
  setActiveStoreId: (id: string | null) => void;
  setIsSwitchingWorkspace: (isSwitching: boolean, targetId?: string | null) => void;
}

export const useStoreWorkspaceStore = create<StoreWorkspaceState>()(
  persist(
    (set) => ({
      activeStoreId: null,
      isSwitchingWorkspace: false,
      switchingTargetId: null,
      setActiveStoreId: (id) => set({ activeStoreId: id }),
      setIsSwitchingWorkspace: (isSwitching, targetId = null) =>
        set({
          isSwitchingWorkspace: isSwitching,
          switchingTargetId: isSwitching ? targetId : null,
        }),
    }),
    {
      name: 'postmind_active_store_id',
      partialize: (state) => ({ activeStoreId: state.activeStoreId }),
    },
  ),
);


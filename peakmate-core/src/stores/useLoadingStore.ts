import { create } from 'zustand';

interface LoadingStore {
  count: number;
  isLoading: boolean;
  start: () => void;
  stop: () => void;
}

export const useLoadingStore = create<LoadingStore>((set, get) => ({
  count: 0,
  isLoading: false,
  start: () => {
    const count = get().count + 1;
    set({ count, isLoading: true });
  },
  stop: () => {
    const count = Math.max(0, get().count - 1);
    set({ count, isLoading: count > 0 });
  },
}));

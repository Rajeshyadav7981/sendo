import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TripState {
  isRunning: boolean;
  startTime: number | null;
  vehicleNumber: string | null;
  setRunning: (v: boolean, vehicleNumber?: string) => void;
  reset: () => void;
}

export const useTripStore = create<TripState>()(
  persist(
    (set) => ({
      isRunning: false,
      startTime: null,
      vehicleNumber: null,
      setRunning: (v, vehicleNumber) =>
        set({
          isRunning: v,
          startTime: v ? Date.now() : null,
          vehicleNumber: v ? (vehicleNumber ?? null) : null,
        }),
      reset: () => set({ isRunning: false, startTime: null, vehicleNumber: null }),
    }),
    { name: 'sendo-driver-trip' },
  ),
);

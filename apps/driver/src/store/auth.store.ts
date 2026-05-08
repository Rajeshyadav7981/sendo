import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DriverProfile {
  driverId: string;
  driverName?: string;
  contactNumber?: string;
  vehicleNumber?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  driver: DriverProfile | null;
  setDriver: (d: DriverProfile | null) => void;
  setAuthenticated: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      driver: null,
      setDriver: (driver) => set({ driver, isAuthenticated: !!driver }),
      setAuthenticated: (v) => set({ isAuthenticated: v }),
      logout: () => set({ isAuthenticated: false, driver: null }),
    }),
    { name: 'sendo-driver-auth' },
  ),
);

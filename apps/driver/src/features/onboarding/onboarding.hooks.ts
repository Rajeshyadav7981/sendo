import { useQuery } from '@tanstack/react-query';
import { onboardingApi } from './onboarding.api';

export const onboardingKeys = {
  all: ['onboarding'] as const,
  vehicle: (vehicleNumber: string) =>
    [...onboardingKeys.all, 'vehicle', vehicleNumber] as const,
};

export function useVehicleOnboarding(vehicleNumber: string) {
  return useQuery({
    queryKey: onboardingKeys.vehicle(vehicleNumber),
    queryFn: () => onboardingApi.vehicle(vehicleNumber),
    enabled: !!vehicleNumber,
  });
}

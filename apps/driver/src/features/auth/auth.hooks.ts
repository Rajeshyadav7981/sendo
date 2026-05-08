import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './auth.api';
import { useAuthStore } from '@store/auth.store';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export function useSendOtp() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.sendOtp,
    onSuccess: (_, phone) => {
      toastSuccess('OTP sent');
      navigate(`/otp-sent?phone=${encodeURIComponent(phone)}`, { replace: true });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useVerifyOtp() {
  const navigate = useNavigate();
  const setDriver = useAuthStore((s) => s.setDriver);
  return useMutation({
    mutationFn: ({ phone, otp }: { phone: string; otp: string }) => authApi.verifyOtp(phone, otp),
    onSuccess: async (_data, { phone }) => {
      try {
        const profile = await authApi.checkPhone(phone);
        const d = profile.driverDetails as Record<string, unknown>;
        setDriver({
          driverId: String(d.driverId ?? ''),
          driverName: [d.firstName, d.surname].filter(Boolean).join(' '),
          contactNumber: phone,
        });
      } catch {
        // No driver record found — still authenticated, will need onboarding
        setDriver({ driverId: '', contactNumber: phone });
      }
      navigate('/', { replace: true });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

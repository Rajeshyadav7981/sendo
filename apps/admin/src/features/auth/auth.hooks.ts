import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { authApi } from './auth.api';
import { useAuthStore } from '@store/auth.store';
import { getApiErrorMessage } from '@shared/api/error';
import { toastError, toastSuccess } from '@shared/lib/toast';

export function useLogin() {
  const setUser = useAuthStore((s) => s.setUser);
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      navigate('/home', { replace: true });
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useSignUp() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: authApi.signUp,
    onSuccess: () => {
      toastSuccess('Registration successful — please log in');
      navigate('/login');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: authApi.forgotPassword,
    onSuccess: () => toastSuccess('OTP sent to email'),
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useVerifyOtp() {
  return useMutation({
    mutationFn: ({ email, userOtp }: { email: string; userOtp: string }) =>
      authApi.verifyOtp(email, userOtp),
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

export function useResetPassword() {
  const navigate = useNavigate();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.resetPassword(email, password),
    onSuccess: () => {
      toastSuccess('Password updated successfully');
      navigate('/login');
    },
    onError: (err) => toastError(getApiErrorMessage(err)),
  });
}

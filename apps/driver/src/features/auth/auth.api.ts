import { apiClient } from '@shared/api/client';

export const authApi = {
  sendOtp: (phone: string) =>
    apiClient.post<{ success: true; message: string }>('/send-otp/sended', { phone }),
  verifyOtp: (phone: string, otp: string) =>
    apiClient.post<{ success: true; message: string }>('/send-otp/verify-otp', { phone, otp }),
  checkPhone: (phoneNumber: string) =>
    apiClient.post<{ message: string; driverDetails: Record<string, unknown> }>(
      '/onboarding/checkPhoneNumber',
      { phoneNumber },
    ),
};

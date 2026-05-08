import { apiClient } from '@shared/api/client';

export const expensesApi = {
  vehicle: () => apiClient.get<unknown[]>('/vehicle/expenses'),
  createVehicle: (body: Record<string, unknown>) =>
    apiClient.post<unknown>('/vehicle/expenses', body),
  other: () => apiClient.get<unknown[]>('/vehicle/other-expenses'),
  createOther: (body: Record<string, unknown>) =>
    apiClient.post<unknown>('/vehicle/other-expenses', body),
};

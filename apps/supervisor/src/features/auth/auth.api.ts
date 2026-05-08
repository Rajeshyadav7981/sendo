import { trackerClient } from '@shared/api/client';

export interface EmployeeLoginResponse {
  ok?: boolean;
  message?: string;
}

export const authApi = {
  loginEmployee: (password: string): Promise<EmployeeLoginResponse> =>
    trackerClient.post<EmployeeLoginResponse>('/auth/employee', { password }),
};

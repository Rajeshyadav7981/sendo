import type { AxiosError } from 'axios';
import type { ApiErrorBody } from '@shared/types/api';

export function getApiErrorMessage(err: unknown): string {
  const axErr = err as AxiosError<ApiErrorBody>;
  const body = axErr?.response?.data;
  if (body?.message) {
    return Array.isArray(body.message) ? body.message.join(', ') : body.message;
  }
  return axErr?.message ?? 'Something went wrong';
}

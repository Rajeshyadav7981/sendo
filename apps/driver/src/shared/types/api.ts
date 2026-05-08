export interface ApiEnvelope<T> {
  success: true;
  data: T;
  timestamp: string;
}

export interface ApiErrorBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path?: string;
}

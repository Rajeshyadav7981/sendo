import { message } from 'antd';

const DURATION_SEC = 3;

message.config({ duration: DURATION_SEC, maxCount: 5, top: 72 });

type ToastType = 'success' | 'error' | 'warning' | 'info' | 'loading';

const fns: Record<ToastType, (text: string, duration?: number) => unknown> = {
  success: (t) => message.success(t, DURATION_SEC),
  error: (t) => message.error(t, DURATION_SEC),
  warning: (t) => message.warning(t, DURATION_SEC),
  info: (t) => message.info(t, DURATION_SEC),
  loading: (t) => message.loading(t, DURATION_SEC),
};

export const toast = (text: string, type: ToastType = 'success'): void => {
  fns[type](String(text ?? ''));
};

export const toastSuccess = (t: string): void => void fns.success(String(t ?? ''));
export const toastError = (t: string): void => void fns.error(String(t ?? ''));
export const toastWarning = (t: string): void => void fns.warning(String(t ?? ''));
export const toastInfo = (t: string): void => void fns.info(String(t ?? ''));

import { message } from 'antd';

const DURATION = 3;
message.config({ duration: DURATION, maxCount: 3, top: 60 });

export const toast = (text: string, type: 'success' | 'error' | 'warning' | 'info' = 'success'): void => {
  const fns = { success: message.success, error: message.error, warning: message.warning, info: message.info };
  fns[type](String(text), DURATION);
};

export const toastSuccess = (t: string): void => void message.success(String(t), DURATION);
export const toastError = (t: string): void => void message.error(String(t), DURATION);

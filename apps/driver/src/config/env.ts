const env = import.meta.env;

export const config = {
  apiBase: (env.VITE_API_BASE ?? '').replace(/\/$/, ''),
  appName: env.VITE_APP_NAME ?? 'Sendo Driver',
  isDev: env.DEV,
  isProd: env.PROD,
} as const;

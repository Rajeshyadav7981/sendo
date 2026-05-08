import type { PropsWithChildren } from 'react';
import { ConfigProvider } from 'antd';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { queryClient } from '@shared/api/query-client';
import { ErrorBoundary } from '@shared/components/common/ErrorBoundary';

const antdTheme = {
  token: {
    colorPrimary: '#FFC107',
    colorInfo: '#FFC107',
    borderRadius: 6,
    fontFamily: 'Arial, sans-serif',
  },
  components: {
    Button: { colorPrimary: '#FFC107', colorPrimaryHover: '#e6ac00' },
  },
};

export function AppProviders({ children }: PropsWithChildren): JSX.Element {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ConfigProvider theme={antdTheme}>{children}</ConfigProvider>
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

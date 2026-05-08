import { Suspense, type ReactElement, type ReactNode } from 'react';
import { render, type RenderOptions, type RenderResult } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ConfigProvider } from 'antd';

export function makeTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });
}

interface ProvidersProps {
  children: ReactNode;
  initialEntries?: string[];
  routePath?: string;
}

function AllProviders({
  children,
  initialEntries = ['/'],
  routePath,
}: ProvidersProps): ReactElement {
  const client = makeTestQueryClient();
  const content = routePath ? (
    <Routes>
      <Route path={routePath} element={children} />
      <Route path="*" element={children} />
    </Routes>
  ) : (
    children
  );
  return (
    <QueryClientProvider client={client}>
      <ConfigProvider>
        <MemoryRouter initialEntries={initialEntries}>
          <Suspense fallback={<div data-testid="suspense-fallback">Loading…</div>}>
            {content}
          </Suspense>
        </MemoryRouter>
      </ConfigProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(
  ui: ReactElement,
  options: { initialEntries?: string[]; routePath?: string } & Omit<RenderOptions, 'wrapper'> = {},
): RenderResult {
  const { initialEntries, routePath, ...rest } = options;
  return render(ui, {
    wrapper: ({ children }) => (
      <AllProviders initialEntries={initialEntries} routePath={routePath}>
        {children}
      </AllProviders>
    ),
    ...rest,
  });
}

export * from '@testing-library/react';

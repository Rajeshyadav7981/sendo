import { BrowserRouter, useRoutes } from 'react-router-dom';
import { AppProviders } from './providers';
import { routes } from './routes';

function AppRoutes(): JSX.Element | null {
  return useRoutes(routes);
}

export function App(): JSX.Element {
  return (
    <AppProviders>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <AppRoutes />
      </BrowserRouter>
    </AppProviders>
  );
}

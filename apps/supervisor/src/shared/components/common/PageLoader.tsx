import { Spin } from 'antd';

export function PageLoader(): JSX.Element {
  return (
    <div className="auth-gate-loading">
      <Spin size="large" />
    </div>
  );
}

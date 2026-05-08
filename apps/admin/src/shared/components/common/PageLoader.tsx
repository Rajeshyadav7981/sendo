import { Spin } from 'antd';

export function PageLoader(): JSX.Element {
  return (
    <div className="flex h-[60vh] items-center justify-center">
      <Spin size="large" />
    </div>
  );
}

import { useOnline } from '@shared/hooks/useOnline';

export function OfflineBanner(): JSX.Element | null {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="fixed inset-x-0 top-0 z-[1100] bg-[#c62828] py-1.5 text-center text-xs font-bold text-white">
      You are offline — changes will sync when you reconnect
    </div>
  );
}

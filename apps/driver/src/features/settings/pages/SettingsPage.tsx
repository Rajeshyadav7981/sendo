import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { config } from '@config/env';

const ITEMS: Array<{ label: string; icon: string; route: string }> = [
  { label: 'My Profile', icon: '👤', route: '/my-profile' },
  { label: 'Notifications', icon: '🔔', route: '/notification' },
  { label: 'Help & Support', icon: '❓', route: '/help' },
  { label: 'Leave Request', icon: '📅', route: '/driver-leave-request' },
  { label: 'Legal', icon: '📄', route: '/legal' },
];

const DEFAULT_AVATAR =
  'https://img.freepik.com/free-vector/blue-circle-with-white-user_78370-4707.jpg';

export default function SettingsPage(): JSX.Element {
  const navigate = useNavigate();
  const driver = useAuthStore((s) => s.driver);
  const profilePicture = (driver as Record<string, unknown> | null)?.profilePicture as
    | string
    | undefined;
  const avatarUrl = profilePicture ? `${config.apiBase}/${profilePicture}` : DEFAULT_AVATAR;

  return (
    <div className="mx-auto max-w-md space-y-3 p-2">
      <div className="overflow-hidden rounded-md border-2 border-black shadow-md">
        <div className="bg-black px-4 py-3 text-lg font-bold text-yellow-400">Settings</div>
        <div className="flex items-center gap-3 bg-yellow-400 px-4 py-3">
          <img
            src={avatarUrl}
            alt="Profile"
            className="h-12 w-12 rounded-full border-2 border-black object-cover"
          />
          <div>
            <div className="text-base font-bold text-black">{driver?.driverName || 'Driver'}</div>
            <div className="text-xs text-gray-700">ID: {driver?.driverId || '—'}</div>
          </div>
        </div>
        <div className="bg-white py-1">
          {ITEMS.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className="flex w-full items-center justify-between border-b border-gray-200 px-4 py-3 text-left text-sm font-bold transition-colors hover:bg-gray-50"
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{item.icon}</span>
                {item.label}
              </span>
              <span className="text-gray-500">›</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

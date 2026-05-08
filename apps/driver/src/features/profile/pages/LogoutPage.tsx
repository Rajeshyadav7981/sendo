import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@store/auth.store';
import { useTripStore } from '@store/trip.store';

export default function LogoutPage(): JSX.Element {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);
  const resetTrip = useTripStore((s) => s.reset);

  const onConfirm = (): void => {
    logout();
    resetTrip();
    navigate('/login', { replace: true });
  };

  return (
    <div className="mx-auto mt-24 w-72 rounded-xl border border-gray-300 bg-white p-5 text-center shadow-md">
      <h2 className="text-lg font-bold">Are you sure you want to logout?</h2>
      <div className="mt-3 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="rounded-md bg-gray-500 px-4 py-2 text-sm font-bold text-white"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-bold text-white"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

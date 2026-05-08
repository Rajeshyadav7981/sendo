import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaBars, FaBell, FaUserCircle } from 'react-icons/fa';
import { apiClient } from '@shared/api/client';
import { toastError } from '@shared/lib/toast';
import { useAuthStore } from '@store/auth.store';
import { useUiStore } from '@store/ui.store';
import { useMobile } from '@shared/hooks/useMobile';

export function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const isMobile = useMobile();
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);
  const setSidebarOpen = useUiStore((s) => s.setSidebarOpen);
  const user = useAuthStore((s) => s.user);
  const logoutClient = useAuthStore((s) => s.logout);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const onClickAway = (e: MouseEvent): void => {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, [dropdownOpen]);

  const handleLogout = async (): Promise<void> => {
    try {
      await apiClient.post('/api/logout');
    } catch (err) {
      toastError('Logout failed');
      // eslint-disable-next-line no-console
      console.error(err);
    } finally {
      logoutClient();
      navigate('/login');
    }
  };

  return (
    <nav className="fixed inset-x-0 top-0 z-[1000] flex h-[70px] items-center justify-between bg-sendo-navbar-bg px-4 shadow-navbar">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="sendo-hamburger flex items-center rounded p-1.5 text-[22px] text-white"
          onClick={toggleSidebar}
          aria-label="Toggle menu"
        >
          <FaBars />
        </button>
        <img
          src="https://sendonow.com/Images/Logo.png"
          alt="Sendo"
          className="h-[38px] cursor-pointer object-contain"
          onClick={() => setSidebarOpen(true)}
        />
      </div>

      <div className="flex items-center gap-[18px]">
        {!isMobile && (
          <button
            type="button"
            className="relative flex items-center text-white"
            onClick={() => navigate('/notification')}
            aria-label="Notifications"
          >
            <FaBell size={20} />
            <span className="absolute -right-2 -top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-sendo-yellow text-[11px] font-bold text-black">
              1
            </span>
          </button>
        )}

        <div ref={dropdownRef} className="relative flex items-center gap-2 text-white">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((p) => !p);
            }}
            className="flex items-center gap-2"
            aria-haspopup="menu"
            aria-expanded={dropdownOpen}
          >
            <FaUserCircle size={28} color="#FFC107" />
            {!isMobile && (
              <span className="whitespace-nowrap text-[13px] font-bold text-sendo-yellow">
                {user?.fullName?.toUpperCase() ?? 'OMEG GLOBAL LOGISTICS'}
              </span>
            )}
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-11 z-[1100] min-w-[160px] overflow-hidden rounded-md border border-[#444] bg-[#222] shadow-[0_4px_12px_rgba(0,0,0,0.4)]"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full border-b border-[#333] bg-transparent px-4 py-3 text-left text-[14px] text-white hover:bg-sendo-yellow hover:text-black"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/my-profile');
                }}
              >
                👤 My Profile
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full bg-transparent px-4 py-3 text-left text-[14px] text-white hover:bg-[#c62828]"
                onClick={() => void handleLogout()}
              >
                🚪 Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

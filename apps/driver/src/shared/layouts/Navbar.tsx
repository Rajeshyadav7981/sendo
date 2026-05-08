import { type CSSProperties, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, ChevronDown, ChevronUp, Menu as MenuIcon, User, X } from 'lucide-react';
import { useAuthStore } from '@store/auth.store';
import { useNotificationsStore } from '@store/notifications.store';

const MENU_ITEMS: Array<{ label: string; to: string }> = [
  { label: 'My Profile', to: '/my-profile' },
  { label: 'Help', to: '/help' },
  { label: 'Vehicle Document', to: '/driver-document' },
  { label: 'Onboarding', to: '/driver-vehicle-onboarding' },
  { label: 'Driver Attendance', to: '/driver-attendance' },
  { label: 'Attendance Approval', to: '/driver-attendance-approval' },
  { label: 'Driver Advances', to: '/driver-advance' },
  { label: 'Driver Payout', to: '/driver-payout' },
  { label: 'Driver Leave Request', to: '/driver-leave-request' },
  { label: 'Refer & Earn', to: '/refer-earn' },
  { label: 'Diesel Tracking', to: '/diesel-tracking' },
  { label: 'Settings', to: '/setting' },
  { label: 'Notification', to: '/notification' },
  { label: 'Log Out', to: '/logout' },
];

export function Navbar(): JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const driver = useAuthStore((s) => s.driver);
  const unreadCount = useNotificationsStore((s) => s.unreadCount);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() =>
    typeof window === 'undefined' ? true : window.innerWidth <= 768,
  );

  useEffect(() => {
    const h = (): void => {
      const m = window.innerWidth <= 768;
      setIsMobile(m);
      if (!m) setMenuOpen(false);
    };
    window.addEventListener('resize', h);
    return () => window.removeEventListener('resize', h);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setProfileOpen(false);
  }, [location.pathname]);

  const closeMenu = (): void => setMenuOpen(false);

  const username = driver?.driverName || driver?.driverId || 'OMEG GLOBAL LOGISTICS';

  const navBar: CSSProperties = {
    position: 'sticky',
    top: 0,
    zIndex: 1001,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: '12px 24px',
    borderBottom: '2px solid #ffcc00',
    height: '80px',
    color: '#fff',
  };

  const logoImg: CSSProperties = { width: 35, height: 'auto' };

  const menuToggle: CSSProperties = {
    display: isMobile ? 'block' : 'none',
    fontSize: '30px',
    cursor: 'pointer',
    color: '#fff',
    background: 'none',
    border: 'none',
    padding: 0,
    lineHeight: 0,
  };

  const navLinks: CSSProperties = {
    display: isMobile ? 'none' : 'flex',
    gap: '2rem',
    alignItems: 'center',
  };

  const navIcons: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  };

  const notificationIcon: CSSProperties = {
    cursor: 'pointer',
    color: '#fff',
    position: 'relative',
    background: 'none',
    border: 'none',
    padding: 0,
  };

  const notificationBadge: CSSProperties = {
    position: 'absolute',
    top: '-13px',
    right: '-13px',
    backgroundColor: 'rgb(255,255,255)',
    color: 'rgb(0,0,0)',
    borderRadius: '50%',
    fontSize: '12px',
    padding: '3px 6px',
    fontWeight: 700,
    minWidth: 18,
    textAlign: 'center',
    lineHeight: 1,
  };

  const profileSection: CSSProperties = {
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '5px',
    color: '#fff',
    background: 'none',
    border: 'none',
    padding: 0,
    fontSize: '16px',
  };

  const dropdownMenu: CSSProperties = {
    position: 'fixed',
    right: '24px',
    top: '82px',
    background: '#222222',
    color: '#fff',
    borderRadius: '5px',
    boxShadow: '0px 4px 6px rgba(0,0,0,0.2)',
    display: 'flex',
    flexDirection: 'column',
    zIndex: 1000,
    width: '220px',
    padding: 0,
    border: '1px solid #444',
  };

  const dropdownLink: CSSProperties = {
    padding: '12px 16px',
    color: '#fff',
    textDecoration: 'none',
    display: 'block',
    fontSize: '14px',
    borderBottom: '1px solid #444',
  };

  const hamburgerMenu: CSSProperties = {
    position: 'fixed',
    top: 0,
    right: 0,
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#FFC107',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: '80px',
    zIndex: 100,
    boxShadow: '-5px 0 10px rgba(0,0,0,0.2)',
    overflowY: 'auto',
  };

  const hamburgerList: CSSProperties = {
    listStyle: 'none',
    padding: 0,
    width: '90%',
    marginTop: '32px',
  };

  const hamburgerItem: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '15px',
    margin: '10px 0',
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0px 2px 5px rgba(0,0,0,0.1)',
    cursor: 'pointer',
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#000',
  };

  const closeBtn: CSSProperties = {
    position: 'absolute',
    top: '20px',
    left: '20px',
    fontSize: '30px',
    color: '#000',
    cursor: 'pointer',
    background: 'none',
    border: 'none',
    padding: 0,
    lineHeight: 0,
  };

  return (
    <>
      <nav style={navBar}>
        <Link to="/home" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <img src="https://sendonow.com/favicon.ico" alt="Sendo Logo" style={logoImg} />
        </Link>

        <button
          type="button"
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => {
            if (menuOpen) {
              navigate('/home');
              setMenuOpen(false);
            } else {
              setMenuOpen(true);
              setProfileOpen(false);
            }
          }}
          style={menuToggle}
        >
          {menuOpen ? <X size={25} /> : <MenuIcon size={25} />}
        </button>

        <div style={navLinks}>
          <div style={navIcons}>
            <button
              type="button"
              onClick={() => navigate('/notification')}
              aria-label="Notifications"
              style={notificationIcon}
            >
              <Bell size={20} />
              {unreadCount > 0 ? (
                <span style={notificationBadge}>{unreadCount > 9 ? '9+' : unreadCount}</span>
              ) : null}
            </button>

            <button
              type="button"
              onClick={() => {
                setProfileOpen((p) => !p);
                setMenuOpen(false);
              }}
              style={profileSection}
              aria-label="Profile menu"
            >
              <User size={30} />
              <span style={{ fontSize: '14px', fontWeight: 600 }}>{username}</span>
              {profileOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </div>
      </nav>

      {!isMobile && profileOpen ? (
        <div style={dropdownMenu}>
          {MENU_ITEMS.map((item, idx) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setProfileOpen(false)}
              style={{
                ...dropdownLink,
                borderBottom: idx === MENU_ITEMS.length - 1 ? 'none' : '1px solid #444',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#ffcc00';
                e.currentTarget.style.color = '#000';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#fff';
              }}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      {isMobile && menuOpen ? (
        <div style={hamburgerMenu}>
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            style={closeBtn}
          >
            <X size={30} />
          </button>
          <ul style={hamburgerList}>
            {MENU_ITEMS.map((item, idx) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={closeMenu}
                style={{ textDecoration: 'none' }}
              >
                <li
                  style={{
                    ...hamburgerItem,
                    ...(idx === 0 ? { marginTop: '40px' } : {}),
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#e9ecef';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#fff';
                  }}
                >
                  {item.label}
                </li>
              </Link>
            ))}
          </ul>
        </div>
      ) : null}
    </>
  );
}

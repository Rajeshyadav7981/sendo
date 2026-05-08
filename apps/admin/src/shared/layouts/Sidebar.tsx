import { NavLink } from 'react-router-dom';
import { useUiStore } from '@store/ui.store';
import { useMobile } from '@shared/hooks/useMobile';
import { sidebarSections } from './sidebar-config';

export function Sidebar(): JSX.Element {
  const isMobile = useMobile();
  const isOpen = useUiStore((s) => s.isSidebarOpen);
  const setOpen = useUiStore((s) => s.setSidebarOpen);
  const openSubmenu = useUiStore((s) => s.openSubmenu);
  const setOpenSubmenu = useUiStore((s) => s.setOpenSubmenu);

  const closeOnMobile = (): void => {
    if (isMobile) setOpen(false);
  };

  return (
    <aside
      className={`fixed left-0 top-[70px] z-[900] h-[calc(100vh-70px)] overflow-y-auto bg-sendo-sidebar-bg py-2.5 text-white shadow-sidebar ${
        isOpen ? 'block' : 'hidden'
      }`}
      style={{ width: isMobile ? '30vw' : '250px' }}
    >
      {sidebarSections.map((section) => (
        <div key={section.key}>
          <button
            type="button"
            onClick={() => setOpenSubmenu(section.key)}
            className={`w-full cursor-pointer select-none border-0 bg-sendo-yellow px-3.5 py-2.5 text-center font-bold uppercase text-black ${
              isMobile ? 'text-[11px]' : 'text-sm'
            }`}
          >
            {section.label}
          </button>
          {openSubmenu === section.key && (
            <ul className="m-0 mb-1 list-none border-l-[3px] border-sendo-yellow bg-sendo-sidebar-row p-0 pb-2 pt-1">
              {section.links.map(({ to, label }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    onClick={closeOnMobile}
                    className={({ isActive }) =>
                      `block px-4 py-1.5 text-[13px] no-underline transition-colors ${
                        isActive
                          ? 'bg-sendo-yellow font-bold text-black'
                          : 'text-white hover:bg-[#222]'
                      }`
                    }
                  >
                    {label}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </aside>
  );
}

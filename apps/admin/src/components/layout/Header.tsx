import { Breadcrumb, Dropdown, Badge, Button } from 'antd';
import { Bell, Moon, Sun, Menu as MenuIcon, Settings, LogOut } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { breadcrumbLabels } from '../../config/navigation';
import { useUiStore } from '../../store/uiStore';
import type { UserDto } from '../../lib/api';

interface HeaderProps {
  user: UserDto | null;
  onLogout: () => void;
  notificationCount?: number;
}

export default function Header({ user, onLogout, notificationCount = 0 }: HeaderProps) {
  const location = useLocation();
  const { darkMode, toggleDarkMode, setMobileDrawerOpen, sidebarCollapsed } = useUiStore();

  const segments = location.pathname === '/' ? [] : location.pathname.split('/').filter(Boolean);
  const breadcrumbItems = [
    { title: <Link to="/">Bosh sahifa</Link> },
    ...segments.map((seg, i) => {
      const path = '/' + segments.slice(0, i + 1).join('/');
      const label = breadcrumbLabels[path] ?? seg;
      const isLast = i === segments.length - 1;
      return { title: isLast ? label : <Link to={path}>{label}</Link> };
    }),
  ];

  const displayName = user?.email?.split('@')[0] ?? 'Admin';

  const userMenu = {
    items: [
      { key: 'settings', icon: <Settings size={14} />, label: <Link to="/settings">Sozlamalar</Link> },
      { type: 'divider' as const },
      { key: 'logout', icon: <LogOut size={14} />, label: 'Chiqish', danger: true, onClick: onLogout },
    ],
  };

  return (
    <header
      className={[
        'fixed top-0 right-0 z-30 flex h-16 items-center border-b border-[var(--admin-border)] bg-[var(--admin-card)] px-4 shadow-sm transition-[left] duration-300 lg:px-6',
        sidebarCollapsed ? 'lg:left-[72px]' : 'lg:left-[260px]',
        'left-0',
      ].join(' ')}
    >
      <button
        type="button"
        className="mr-3 rounded-lg p-2 text-slate-500 hover:bg-slate-100 lg:hidden dark:hover:bg-slate-700"
        onClick={() => setMobileDrawerOpen(true)}
        aria-label="Menyu"
      >
        <MenuIcon size={22} />
      </button>

      <Breadcrumb items={breadcrumbItems} className="hidden flex-1 sm:block" />

      <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
        <Link to="/leads">
          <Badge count={notificationCount} size="small" offset={[-2, 2]}>
            <Button type="text" icon={<Bell size={18} />} className="flex items-center justify-center" />
          </Badge>
        </Link>

        <Button
          type="text"
          icon={darkMode ? <Sun size={18} /> : <Moon size={18} />}
          onClick={toggleDarkMode}
          aria-label="Dark mode"
        />

        <Dropdown menu={userMenu} placement="bottomRight" trigger={['click']}>
          <button
            type="button"
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white uppercase">
              {displayName.charAt(0)}
            </div>
            <span className="hidden text-sm font-medium text-[var(--admin-text)] md:inline">{displayName}</span>
          </button>
        </Dropdown>
      </div>
    </header>
  );
}

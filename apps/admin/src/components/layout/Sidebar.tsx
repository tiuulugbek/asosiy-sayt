import { useNavigate, useLocation } from 'react-router-dom';
import { Badge } from 'antd';
import { LogOut, Stethoscope, ChevronLeft, ChevronRight } from 'lucide-react';
import { navGroups, type NavItem } from '../../config/navigation';
import { useUiStore } from '../../store/uiStore';
import type { UserDto } from '../../lib/api';

interface SidebarProps {
  user: UserDto | null;
  onLogout: () => void;
  isLoggingOut?: boolean;
  leadBadge?: number;
  reviewBadge?: number;
}

function NavLink({
  item,
  active,
  collapsed,
  badge,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  badge?: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={[
        'group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-[#2563EB] text-white shadow-sm border-l-[3px] border-[#60A5FA]'
          : 'text-[#94A3B8] hover:bg-[#1E293B] hover:text-white border-l-[3px] border-transparent',
      ].join(' ')}
    >
      <span className={active ? 'text-white' : 'text-[#94A3B8] group-hover:text-white'}>{item.icon}</span>
      {!collapsed && (
        <>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {badge != null && badge > 0 && (
            <Badge count={badge} size="small" style={{ backgroundColor: '#EF4444' }} />
          )}
        </>
      )}
    </button>
  );
}

export default function Sidebar({ user, onLogout, isLoggingOut, leadBadge = 0, reviewBadge = 0 }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { sidebarCollapsed, setSidebarCollapsed } = useUiStore();

  const getBadge = (key?: NavItem['badgeKey']) => {
    if (key === 'leads') return leadBadge;
    if (key === 'reviews') return reviewBadge;
    return undefined;
  };

  const displayName = user?.email?.split('@')[0] ?? 'Admin';

  return (
    <aside
      className={[
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-[#0F172A] transition-all duration-300',
        sidebarCollapsed ? 'w-[72px]' : 'w-[260px]',
      ].join(' ')}
    >
      <div className="flex h-16 shrink-0 items-center gap-2 border-b border-white/10 px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2563EB]">
          <Stethoscope className="text-white" size={20} />
        </div>
        {!sidebarCollapsed && (
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-white">Acoustic.uz</div>
            <div className="text-xs text-[#94A3B8]">Admin panel</div>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-3 py-4">
        {navGroups.map((group) => (
          <div key={group.title} className="mb-5">
            {!sidebarCollapsed && (
              <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-[#64748B]">
                {group.title}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.key}
                  item={item}
                  active={location.pathname === item.key}
                  collapsed={sidebarCollapsed}
                  badge={getBadge(item.badgeKey)}
                  onClick={() => {
                    navigate(item.key);
                    useUiStore.getState().setMobileDrawerOpen(false);
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="mb-2 flex w-full items-center justify-center rounded-lg p-2 text-[#94A3B8] hover:bg-[#1E293B] hover:text-white"
          aria-label={sidebarCollapsed ? 'Expand' : 'Collapse'}
        >
          {sidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>

        {!sidebarCollapsed && user && (
          <div className="mb-2 flex items-center gap-3 rounded-lg bg-[#1E293B] px-3 py-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#2563EB] text-sm font-semibold text-white uppercase">
              {displayName.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-white">{displayName}</p>
              <p className="truncate text-xs text-[#94A3B8]">{user.email}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-[#94A3B8] hover:bg-red-500/10 hover:text-red-400 disabled:opacity-50"
        >
          <LogOut size={16} />
          {!sidebarCollapsed && <span>Chiqish</span>}
        </button>
      </div>
    </aside>
  );
}

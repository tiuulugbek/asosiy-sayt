import { Spin, Drawer, message } from 'antd';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState, useMemo } from 'react';
import { getCurrentUser, logout, getLeads, getReviewsAdmin, ApiError, UserDto } from '../lib/api';
import Sidebar from './layout/Sidebar';
import Header from './layout/Header';
import { useUiStore } from '../store/uiStore';

const getInitialVersion = (): { version: string; buildTime: string } => {
  if (typeof window !== 'undefined') {
    const windowVersion = (window as Window & { __APP_VERSION__?: string }).__APP_VERSION__;
    const windowBuildTime = (window as Window & { __BUILD_TIME__?: string }).__BUILD_TIME__;
    if (windowVersion && windowBuildTime) {
      return { version: windowVersion, buildTime: windowBuildTime };
    }
    const metaVersion = document.querySelector('meta[name="app-version"]')?.getAttribute('content');
    const metaBuildTime = document.querySelector('meta[name="build-time"]')?.getAttribute('content');
    if (metaVersion && metaBuildTime) {
      return { version: metaVersion, buildTime: metaBuildTime };
    }
  }
  return { version: '1.0.0', buildTime: new Date().toISOString() };
};

export default function AdminLayout() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { sidebarCollapsed, mobileDrawerOpen, setMobileDrawerOpen, darkMode } = useUiStore();
  const [versionInfo] = useState(getInitialVersion);

  const [userState, setUserState] = useState<UserDto | null>(() => {
    try {
      const stored = localStorage.getItem('admin_user');
      if (stored) {
        const user = JSON.parse(stored) as UserDto;
        queryClient.setQueryData(['auth', 'me'], user);
        return user;
      }
    } catch {
      // ignore
    }
    return null;
  });

  const { data: currentUser, isLoading, isError, error } = useQuery<UserDto, ApiError>({
    queryKey: ['auth', 'me'],
    queryFn: getCurrentUser,
    retry: false,
    enabled: !userState,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchInterval: 10 * 60 * 1000,
  });

  const { data: leads } = useQuery({
    queryKey: ['leads'],
    queryFn: getLeads,
    enabled: !!userState || !!currentUser,
    staleTime: 30 * 1000,
  });

  const { data: reviews } = useQuery({
    queryKey: ['reviews-admin'],
    queryFn: getReviewsAdmin,
    enabled: !!userState || !!currentUser,
    staleTime: 30 * 1000,
  });

  const newLeadsCount = useMemo(
    () => (leads ?? []).filter((l) => l.status === 'new').length,
    [leads],
  );

  const pendingReviewsCount = useMemo(
    () => (reviews ?? []).filter((r) => r.status === 'pending').length,
    [reviews],
  );

  useEffect(() => {
    if (currentUser && (!userState || currentUser.id !== userState.id)) {
      setUserState(currentUser);
      try {
        localStorage.setItem('admin_user', JSON.stringify(currentUser));
      } catch {
        // ignore
      }
    }
  }, [currentUser, userState]);

  useEffect(() => {
    const cachedUser = queryClient.getQueryData<UserDto>(['auth', 'me']);
    if (cachedUser && (!userState || cachedUser.id !== userState.id)) {
      setUserState(cachedUser);
    }
  }, [queryClient, userState]);

  useEffect(() => {
    if (isError) {
      const err = error as ApiError;
      if (err.status === 401) {
        queryClient.clear();
        localStorage.removeItem('admin_user');
        localStorage.removeItem('acoustic_token');
        setUserState(null);
        navigate('/login', { replace: true });
        message.warning('Sessiya tugadi. Iltimos, qayta kiring.');
      } else if (err.status !== 401) {
        message.error(err.message || 'Auth xatoligi');
      }
    }
  }, [isError, error, navigate, queryClient]);

  const { mutateAsync: logoutMutation, isPending: isLoggingOut } = useMutation<void, ApiError, void>({
    mutationFn: logout,
    onSuccess: () => {
      queryClient.clear();
      localStorage.removeItem('admin_user');
      setUserState(null);
      navigate('/login', { replace: true });
    },
    onError: (err) => message.error(err.message || 'Chiqishda xatolik'),
  });

  const userToDisplay = userState;

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' }).catch(() => undefined);
  }, []);

  if (isLoading || isLoggingOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--admin-bg)]">
        <Spin size="large" />
      </div>
    );
  }

  if (!userToDisplay && !isLoading) {
    navigate('/login', { replace: true });
    return null;
  }

  return (
    <div className="min-h-screen bg-[var(--admin-bg)]">
      <div className="hidden lg:block">
        <Sidebar
          user={userToDisplay}
          onLogout={() => logoutMutation()}
          isLoggingOut={isLoggingOut}
          leadBadge={newLeadsCount}
          reviewBadge={pendingReviewsCount}
        />
      </div>

      <Drawer
        placement="left"
        open={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        width={260}
        styles={{ body: { padding: 0, background: '#0F172A' } }}
        className="lg:hidden"
      >
        <Sidebar
          user={userToDisplay}
          onLogout={() => logoutMutation()}
          isLoggingOut={isLoggingOut}
          leadBadge={newLeadsCount}
          reviewBadge={pendingReviewsCount}
        />
      </Drawer>

      <Header
        user={userToDisplay}
        onLogout={() => logoutMutation()}
        notificationCount={newLeadsCount}
      />

      <main
        className={[
          'min-h-screen pt-16 transition-[margin-left] duration-300',
          sidebarCollapsed ? 'lg:ml-[72px]' : 'lg:ml-[260px]',
        ].join(' ')}
      >
        <div className="p-4 md:p-6 lg:p-6">
          <Outlet />
        </div>
        <footer className="border-t border-[var(--admin-border)] px-6 py-3 text-center text-xs text-[var(--admin-text-muted)]">
          Acoustic.uz Admin · v{versionInfo.version}
        </footer>
      </main>
    </div>
  );
}

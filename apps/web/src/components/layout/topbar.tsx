'use client';
import { Bell, Sun, Moon, Menu } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useQuery } from '@tanstack/react-query';
import { useTheme } from '@/lib/theme';
import { getRoleLabel, getInitials } from '@/lib/utils';
import { notificationsApi } from '@/lib/api';

interface TopbarProps {
  title: string;
  onMenuToggle?: () => void;
}

export function Topbar({ title, onMenuToggle }: TopbarProps) {
  const { data: session } = useSession();
  const { theme, toggle } = useTheme();
  const role = (session?.user as any)?.role ?? '';
  const user = session?.user as any;

  const { data: notifData } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.list(true) as any,
    refetchInterval: 30_000,
  });
  const unreadCount: number = (notifData as any)?.data?.unreadCount ?? 0;

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-4 md:px-6 py-3 flex items-center justify-between gap-4">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuToggle && (
          <button onClick={onMenuToggle} className="md:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <Menu className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
          {title}
        </h1>
      </div>

      {/* Right: notifications + theme toggle + user */}
      <div className="flex items-center gap-2 flex-shrink-0">

        {/* Dark/Light Toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          className="relative w-9 h-9 flex items-center justify-center rounded-lg
                     text-gray-500 dark:text-gray-400
                     hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>

        {/* Notification Bell */}
        <a
          href="/dashboard/notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-lg
                     text-gray-500 dark:text-gray-400
                     hover:text-gray-700 dark:hover:text-gray-200
                     hover:bg-gray-100 dark:hover:bg-gray-800
                     transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </a>

        {/* User avatar + role */}
        <div className="flex items-center gap-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name ? getInitials(user.name.split(' ')[0] ?? 'U', user.name.split(' ')[1] ?? 'S') : 'U'}
          </div>
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 leading-tight truncate max-w-[120px]">
              {user?.name ?? 'User'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">{getRoleLabel(role)}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

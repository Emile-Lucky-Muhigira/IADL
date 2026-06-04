'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { notificationsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Bell, CheckCheck, Loader2 } from 'lucide-react';

export default function NotificationsPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => notificationsApi.list(false) as any,
    refetchInterval: 30_000,
  });

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: any[] = (data as any)?.data?.data ?? [];
  const unread = notifications.filter((n: any) => !n.isRead).length;

  const typeColors: Record<string, string> = {
    ATTENDANCE_ALERT: 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-800',
    PAYMENT: 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800',
    GRADE: 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
  };

  return (
    <div>
      <Topbar title="Notifications" />
      <div className="p-6 max-w-2xl">
        <PageHeader
          title={`Notifications ${unread > 0 ? `(${unread} unread)` : ''}`}
          action={
            unread > 0 ? (
              <button
                onClick={() => markAll.mutate()}
                disabled={markAll.isPending}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                {markAll.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                Mark all read
              </button>
            ) : undefined
          }
        />

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="card p-10 flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
            <Bell className="w-10 h-10 mb-2" />
            <p className="text-sm">No notifications</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <div
                key={n.id}
                onClick={() => { if (!n.isRead) markOne.mutate(n.id); }}
                className={`card p-4 border cursor-pointer transition-all hover:shadow-md ${
                  !n.isRead
                    ? (typeColors[n.type] ?? 'bg-brand-50 dark:bg-brand-950/20 border-brand-200 dark:border-brand-800')
                    : 'opacity-70'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-brand-500 flex-shrink-0" />}
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{n.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{n.body}</p>
                  </div>
                  <p className="text-xs text-gray-400 dark:text-gray-500 whitespace-nowrap flex-shrink-0">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { attendanceApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { TrendingUp, Calendar, CheckCircle } from 'lucide-react';

export default function StudentAttendancePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'student', userId],
    queryFn: () => attendanceApi.byStudent(userId) as any,
    enabled: !!userId,
  });

  const result = (data as any)?.data ?? {};
  const records: any[] = result.records ?? [];
  const stats = result.stats ?? {};

  const statusVariant: Record<string, any> = { PRESENT: 'green', ABSENT: 'red', LATE: 'orange', EXCUSED: 'blue' };

  const columns = [
    { key: 'session', header: 'Session', render: (r: any) => <span className="font-medium">{r.session?.title}</span> },
    { key: 'scheduledAt', header: 'Date', render: (r: any) => r.session?.scheduledAt ? formatDate(r.session.scheduledAt) : '—' },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={statusVariant[r.status] ?? 'gray'}>{r.status}</Badge> },
    { key: 'markedAt', header: 'Marked At', render: (r: any) => formatDate(r.markedAt) },
  ];

  return (
    <div>
      <Topbar title="My Attendance" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Sessions" value={stats.total ?? 0} icon={Calendar} color="blue" />
          <StatCard title="Sessions Attended" value={stats.present ?? 0} icon={CheckCircle} color="green" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate ?? 0}%`} icon={TrendingUp} color={stats.attendanceRate < 80 ? 'red' : 'green'} />
        </div>

        {stats.attendanceRate < 80 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
            ⚠️ Your attendance is below the 80% requirement. Please attend sessions regularly to avoid academic issues.
          </div>
        )}

        <div className="card p-6">
          <h2 className="text-base font-semibold mb-4">Attendance History</h2>
          <DataTable columns={columns} data={records} loading={isLoading} emptyMessage="No attendance records found." />
        </div>
      </div>
    </div>
  );
}

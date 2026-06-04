'use client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { attendanceApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { TrendingUp, Calendar, CheckCircle } from 'lucide-react';

export default function ParentAttendancePage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const params = useSearchParams();
  const studentId = params.get('studentId') ?? userId;

  const { data, isLoading } = useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: () => attendanceApi.byStudent(studentId) as any,
    enabled: !!studentId,
  });

  const result = (data as any)?.data ?? {};
  const records: any[] = result.records ?? [];
  const stats = result.stats ?? {};
  const statusVariant: Record<string, any> = { PRESENT: 'green', ABSENT: 'red', LATE: 'orange', EXCUSED: 'blue' };

  const columns = [
    { key: 'session', header: 'Session', render: (r: any) => r.session?.title },
    { key: 'date', header: 'Date', render: (r: any) => r.session?.scheduledAt ? formatDate(r.session.scheduledAt) : '—' },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={statusVariant[r.status] ?? 'gray'}>{r.status}</Badge> },
  ];

  return (
    <div>
      <Topbar title="Attendance" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Sessions" value={stats.total ?? 0} icon={Calendar} color="blue" />
          <StatCard title="Present" value={stats.present ?? 0} icon={CheckCircle} color="green" />
          <StatCard title="Rate" value={`${stats.attendanceRate ?? 0}%`} icon={TrendingUp} color={stats.attendanceRate < 80 ? 'red' : 'green'} />
        </div>
        <div className="card p-6">
          <DataTable columns={columns} data={records} loading={isLoading} emptyMessage="No records found." />
        </div>
      </div>
    </div>
  );
}

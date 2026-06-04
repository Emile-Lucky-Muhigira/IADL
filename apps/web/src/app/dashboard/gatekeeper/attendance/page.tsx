'use client';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { TrendingUp, AlertTriangle, Users } from 'lucide-react';

export default function GatekeeperAttendancePage() {
  const { data: statsData } = useQuery({
    queryKey: ['attendance', 'branch', 'stats'],
    queryFn: () => api.get('/attendance/stats/branch') as any,
  });
  const { data: lowData } = useQuery({
    queryKey: ['attendance', 'low'],
    queryFn: () => api.get('/attendance/alerts/low') as any,
  });

  const stats = (statsData as any)?.data ?? {};
  const low: any[] = (lowData as any)?.data ?? [];

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => <span className="font-medium">{r.student.firstName} {r.student.lastName}</span> },
    { key: 'email', header: 'Email', render: (r: any) => r.student.email },
    { key: 'total', header: 'Sessions' },
    { key: 'present', header: 'Present' },
    { key: 'attendanceRate', header: 'Rate', render: (r: any) => (
      <Badge variant={r.attendanceRate < 60 ? 'red' : r.attendanceRate < 80 ? 'orange' : 'green'}>{r.attendanceRate}%</Badge>
    )},
  ];

  return (
    <div>
      <Topbar title="Attendance Overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Sessions" value={stats.totalSessions ?? 0} icon={TrendingUp} color="blue" />
          <StatCard title="Overall Rate" value={`${stats.overallAttendanceRate ?? 0}%`} icon={TrendingUp} color="green" />
          <StatCard title="Low Attendance" value={low.length} icon={AlertTriangle} color="red" />
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <h2 className="text-base font-semibold">Students Below 80% Attendance</h2>
          </div>
          <DataTable columns={columns} data={low} emptyMessage="All students are above the 80% threshold." />
        </div>
      </div>
    </div>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, attendanceApi } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Topbar } from '@/components/layout/topbar';
import { GraduationCap, UserCheck, BookOpen, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function GatekeeperDashboard() {
  const { data: branchData } = useQuery({
    queryKey: ['analytics', 'branch'],
    queryFn: () => analyticsApi.branch() as any,
  });
  const { data: lowAttData } = useQuery({
    queryKey: ['attendance', 'low'],
    queryFn: () => attendanceApi.lowAttendance() as any,
  });

  const stats = (branchData as any)?.data ?? {};
  const lowAttStudents: any[] = (lowAttData as any)?.data ?? [];

  return (
    <div>
      <Topbar title="Branch Overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Students"       value={stats.students ?? 0}                   icon={GraduationCap} color="blue" />
          <StatCard title="Trainers"       value={stats.trainers ?? 0}                   icon={UserCheck}     color="green" />
          <StatCard title="Active Courses" value={stats.courses ?? 0}                    icon={BookOpen}      color="orange" />
          <StatCard title="Enrollments"    value={stats.activeEnrollments ?? 0}          icon={TrendingUp}    color="teal" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate ?? 0}%`}      icon={TrendingUp}    color={stats.attendanceRate < 70 ? 'red' : 'brand'} />
          <StatCard title="Branch Revenue" value={formatCurrency(stats.totalRevenue ?? 0)} icon={DollarSign} color="brand" />
        </div>

        {lowAttStudents.length > 0 && (
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                Low Attendance Alerts ({lowAttStudents.length})
              </h2>
            </div>
            <div className="space-y-2">
              {lowAttStudents.slice(0, 5).map((s: any) => (
                <div key={s.student.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-800 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.student.firstName} {s.student.lastName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{s.student.email}</p>
                  </div>
                  <span className="badge bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300">
                    {s.attendanceRate}%
                  </span>
                </div>
              ))}
            </div>
            {lowAttStudents.length > 5 && (
              <a href="/dashboard/gatekeeper/attendance" className="text-sm text-brand-600 dark:text-brand-400 hover:underline mt-3 block">
                View all {lowAttStudents.length} students →
              </a>
            )}
          </div>
        )}

        <div className="card p-5">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/dashboard/gatekeeper/students"   className="btn-primary">View Students</a>
            <a href="/dashboard/gatekeeper/attendance" className="btn-secondary">Attendance</a>
            <a href="/dashboard/gatekeeper/finance"    className="btn-secondary">Finance</a>
            <a href="/dashboard/gatekeeper/messages"   className="btn-secondary">Messages</a>
          </div>
        </div>
      </div>
    </div>
  );
}

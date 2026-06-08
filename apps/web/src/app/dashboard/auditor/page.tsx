'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { GraduationCap, BookOpen, TrendingUp, DollarSign, ClipboardList, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function AuditorDashboard() {
  const { data: branchData } = useQuery({
    queryKey: ['analytics', 'branch'],
    queryFn: () => analyticsApi.branch() as any,
  });

  const stats = (branchData as any)?.data ?? {};

  return (
    <div>
      <Topbar title="Compliance & Audit Dashboard" />
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">You have read-only access to all system data for compliance and audit purposes.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Students" value={stats.students ?? 0} icon={GraduationCap} color="blue" />
          <StatCard title="Active Courses" value={stats.courses ?? 0} icon={BookOpen} color="orange" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate ?? 0}%`} icon={TrendingUp} color="green" />
          <StatCard title="Enrollments" value={stats.activeEnrollments ?? 0} icon={ClipboardList} color="purple" />
          <StatCard title="Revenue (Branch)" value={formatCurrency(stats.totalRevenue ?? 0)} icon={DollarSign} color="teal" />
          <StatCard title="Trainers" value={stats.trainers ?? 0} icon={GraduationCap} color="orange" />
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold mb-4">Audit Navigation</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <a href="/dashboard/auditor/attendance" className="btn-secondary flex items-center gap-2 justify-center">
              <ClipboardList className="w-4 h-4" /> View Attendance Records
            </a>
            <a href="/dashboard/auditor/finance" className="btn-secondary flex items-center gap-2 justify-center">
              <DollarSign className="w-4 h-4" /> View Financial Records
            </a>
            <a href="/dashboard/auditor/analytics" className="btn-secondary flex items-center gap-2 justify-center">
              <TrendingUp className="w-4 h-4" /> Analytics & Reports
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

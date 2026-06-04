'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { Building2, Users, BookOpen, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function AuditorAnalyticsPage() {
  const { data } = useQuery({ queryKey: ['analytics', 'branch'], queryFn: () => analyticsApi.branch() as any });
  const { data: revenueData } = useQuery({ queryKey: ['revenue', 30], queryFn: () => analyticsApi.revenueTimeline(30) as any });

  const stats   = (data as any)?.data ?? {};
  const revenue: any[] = (revenueData as any)?.data ?? [];

  return (
    <div>
      <Topbar title="Analytics & Reports" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Students"       value={stats.students ?? 0}            icon={GraduationCap} color="blue" />
          <StatCard title="Trainers"       value={stats.trainers ?? 0}            icon={Users}         color="purple" />
          <StatCard title="Active Courses" value={stats.courses ?? 0}             icon={BookOpen}      color="orange" />
          <StatCard title="Enrollments"    value={stats.activeEnrollments ?? 0}   icon={TrendingUp}    color="teal" />
          <StatCard title="Attendance Rate" value={`${stats.attendanceRate ?? 0}%`} icon={TrendingUp}   color="green" />
          <StatCard title="Branch Revenue" value={formatCurrency(stats.totalRevenue ?? 0)} icon={DollarSign} color="brand" />
        </div>
        {revenue.length > 0 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4 text-gray-900 dark:text-gray-100">Revenue Timeline (30 days)</h2>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={revenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                <Bar dataKey="amount" fill="#0090B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

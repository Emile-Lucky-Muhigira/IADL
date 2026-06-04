'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Topbar } from '@/components/layout/topbar';
import { Building2, Users, BookOpen, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function SuperAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.global() as any,
  });

  const stats = (data as any)?.data ?? {};

  return (
    <div>
      <Topbar title="Global Platform Overview" />
      <div className="p-6 space-y-6">

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stat-card h-28 animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))
          ) : (
            <>
              <StatCard title="Total Schools"    value={stats.totalSchools ?? 0}                    icon={Building2}    color="blue" />
              <StatCard title="Total Users"      value={stats.totalUsers ?? 0}                      icon={Users}         color="purple" />
              <StatCard title="Students"         value={stats.totalStudents ?? 0}                   icon={GraduationCap} color="green" />
              <StatCard title="Active Courses"   value={stats.totalCourses ?? 0}                    icon={BookOpen}      color="orange" />
              <StatCard title="Enrollments"      value={stats.totalEnrollments ?? 0}                icon={TrendingUp}    color="teal" />
              <StatCard title="Platform Revenue" value={formatCurrency(stats.totalRevenue ?? 0)}    icon={DollarSign}    color="brand" />
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">Quick Actions</h2>
            <div className="space-y-2">
              <a href="/dashboard/super-admin/schools" className="btn-primary block text-center">Onboard New School</a>
              <a href="/dashboard/super-admin/users"   className="btn-secondary block text-center">Manage Admins</a>
              <a href="/dashboard/super-admin/analytics" className="btn-secondary block text-center">View Analytics</a>
            </div>
          </div>
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">System Health</h2>
            <div className="space-y-3">
              {[
                { label: 'API Status', status: 'Operational', ok: true },
                { label: 'Database', status: 'Healthy', ok: true },
                { label: 'Event Bus', status: 'Active', ok: true },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{item.label}</span>
                  <span className={`badge ${item.ok ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' : 'bg-red-100 text-red-700'}`}>
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

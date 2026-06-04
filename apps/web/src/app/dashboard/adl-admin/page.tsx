'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { StatCard } from '@/components/ui/stat-card';
import { Topbar } from '@/components/layout/topbar';
import { Building2, Users, BookOpen, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ADLAdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'global'],
    queryFn: () => analyticsApi.global() as any,
  });

  const stats = (data as any)?.data ?? {};

  return (
    <div>
      <Topbar title="ADL Administration" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <div key={i} className="stat-card animate-pulse h-28 bg-gray-100" />)
            : <>
              <StatCard title="Total Schools" value={stats.totalSchools ?? 0} icon={Building2} color="blue" />
              <StatCard title="All Students" value={stats.totalStudents ?? 0} icon={GraduationCap} color="green" />
              <StatCard title="All Courses" value={stats.totalCourses ?? 0} icon={BookOpen} color="orange" />
              <StatCard title="Total Users" value={stats.totalUsers ?? 0} icon={Users} color="purple" />
              <StatCard title="Enrollments" value={stats.totalEnrollments ?? 0} icon={TrendingUp} color="teal" />
              <StatCard title="Platform Revenue" value={formatCurrency(stats.totalRevenue ?? 0)} icon={DollarSign} color="green" />
            </>}
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/dashboard/adl-admin/schools" className="btn-primary">+ Onboard School</a>
            <a href="/dashboard/adl-admin/users" className="btn-secondary">Manage Users</a>
            <a href="/dashboard/adl-admin/courses" className="btn-secondary">Manage Courses</a>
            <a href="/dashboard/adl-admin/certificates" className="btn-secondary">Issue Certificates</a>
          </div>
        </div>
      </div>
    </div>
  );
}

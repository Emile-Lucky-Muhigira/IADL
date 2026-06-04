'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { Building2, Users, BookOpen, DollarSign, GraduationCap, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';

export default function SuperAdminAnalyticsPage() {
  const { data }        = useQuery({ queryKey: ['analytics', 'global'],  queryFn: () => analyticsApi.global() as any });
  const { data: rev30 } = useQuery({ queryKey: ['revenue', 30],          queryFn: () => analyticsApi.revenueTimeline(30) as any });

  const stats   = (data as any)?.data ?? {};
  const rev: any[] = (rev30 as any)?.data ?? [];

  return (
    <div>
      <Topbar title="Global Analytics" />
      <div className="p-6 space-y-6">
        <PageHeader title="Platform-wide Statistics" />

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Schools"  value={stats.totalSchools ?? 0}                 icon={Building2}    color="blue" />
          <StatCard title="Total Users"    value={stats.totalUsers ?? 0}                   icon={Users}         color="purple" />
          <StatCard title="Students"       value={stats.totalStudents ?? 0}               icon={GraduationCap} color="green" />
          <StatCard title="Courses"        value={stats.totalCourses ?? 0}                icon={BookOpen}      color="orange" />
          <StatCard title="Enrollments"    value={stats.totalEnrollments ?? 0}            icon={TrendingUp}    color="teal" />
          <StatCard title="Total Revenue"  value={formatCurrency(stats.totalRevenue ?? 0)} icon={DollarSign}   color="brand" />
        </div>

        {rev.length > 0 && (
          <div className="card p-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Revenue — Last 30 Days</h2>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={rev} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']}
                  labelFormatter={(l) => `Date: ${l}`}
                />
                <Bar dataKey="amount" fill="#0090B8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

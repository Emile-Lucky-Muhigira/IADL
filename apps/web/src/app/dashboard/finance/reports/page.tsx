'use client';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { analyticsApi } from '@/lib/api';
import { DollarSign, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from 'recharts';

export default function FinanceReportsPage() {
  const { data: rev30 } = useQuery({ queryKey: ['revenue', 30],  queryFn: () => analyticsApi.revenueTimeline(30) as any });
  const { data: rev90 } = useQuery({ queryKey: ['revenue', 90],  queryFn: () => analyticsApi.revenueTimeline(90) as any });

  const t30: any[] = (rev30 as any)?.data ?? [];
  const t90: any[] = (rev90 as any)?.data ?? [];

  const total30 = t30.reduce((s: number, e: any) => s + e.amount, 0);
  const total90 = t90.reduce((s: number, e: any) => s + e.amount, 0);

  return (
    <div>
      <Topbar title="Financial Reports" />
      <div className="p-6 space-y-6">
        <PageHeader title="Revenue Reports" description="Financial performance over time" />

        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Revenue (30 days)" value={formatCurrency(total30)} icon={DollarSign} color="brand" />
          <StatCard title="Revenue (90 days)" value={formatCurrency(total90)} icon={TrendingUp}  color="green" />
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Daily Revenue — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={t30}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']} />
              <Bar dataKey="amount" fill="#0090B8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-5">Revenue Trend — Last 90 Days</h2>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={t90}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v) => v.slice(5)} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Revenue']} />
              <Line type="monotone" dataKey="amount" stroke="#0090B8" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

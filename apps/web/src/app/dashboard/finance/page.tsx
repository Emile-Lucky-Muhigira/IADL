'use client';
import { useQuery } from '@tanstack/react-query';
import { financeApi, analyticsApi } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { DollarSign, Users, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function FinanceDashboard() {
  const { data: summaryData } = useQuery({
    queryKey: ['finance', 'summary'],
    queryFn: () => financeApi.summary() as any,
  });
  const { data: outstandingData } = useQuery({
    queryKey: ['finance', 'outstanding'],
    queryFn: () => financeApi.outstanding() as any,
  });

  const summary = (summaryData as any)?.data ?? {};
  const outstanding: any[] = (outstandingData as any)?.data ?? [];

  return (
    <div>
      <Topbar title="Finance Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue ?? 0)} icon={DollarSign} color="green" />
          <StatCard title="Students with Balance" value={summary.studentsWithOutstandingBalance ?? 0} icon={AlertCircle} color="red" />
          <StatCard title="Recent Payments" value={summary.recentPayments?.length ?? 0} icon={TrendingUp} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">Recent Payments</h2>
            <div className="space-y-2">
              {(summary.recentPayments ?? []).map((p: any) => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{p.user?.firstName} {p.user?.lastName}</p>
                    <p className="text-xs text-gray-500">{formatDate(p.createdAt)}</p>
                  </div>
                  <span className="text-sm font-semibold text-green-600">{formatCurrency(Number(p.amount))}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">Outstanding Balances</h2>
            <div className="space-y-2">
              {outstanding.slice(0, 8).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-red-50 bg-red-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{s.firstName} {s.lastName}</p>
                    <p className="text-xs text-gray-500">{s.email}</p>
                  </div>
                  <span className="text-sm font-semibold text-red-600">{formatCurrency(s.balance)}</span>
                </div>
              ))}
              {outstanding.length === 0 && <p className="text-sm text-gray-400">No outstanding balances</p>}
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            <a href="/dashboard/finance/ledger" className="btn-primary">View Full Ledger</a>
            <a href="/dashboard/finance/outstanding" className="btn-secondary">Outstanding Accounts</a>
          </div>
        </div>
      </div>
    </div>
  );
}

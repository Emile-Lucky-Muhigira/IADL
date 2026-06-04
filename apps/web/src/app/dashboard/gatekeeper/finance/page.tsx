'use client';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { financeApi } from '@/lib/api';
import { DollarSign, AlertCircle, TrendingUp } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function GatekeeperFinancePage() {
  const { data: summaryData } = useQuery({ queryKey: ['finance', 'summary'], queryFn: () => financeApi.summary() as any });
  const { data: outstandingData } = useQuery({ queryKey: ['finance', 'outstanding'], queryFn: () => financeApi.outstanding() as any });

  const summary = (summaryData as any)?.data ?? {};
  const outstanding: any[] = (outstandingData as any)?.data ?? [];

  const paymentCols = [
    { key: 'student', header: 'Student', render: (r: any) => `${r.user?.firstName} ${r.user?.lastName}` },
    { key: 'amount', header: 'Amount', render: (r: any) => <span className="font-semibold text-green-600">{formatCurrency(Number(r.amount))}</span> },
    { key: 'createdAt', header: 'Date', render: (r: any) => formatDate(r.createdAt) },
  ];

  const outstandingCols = [
    { key: 'name', header: 'Student', render: (r: any) => `${r.firstName} ${r.lastName}` },
    { key: 'email', header: 'Email' },
    { key: 'balance', header: 'Balance', render: (r: any) => <span className="font-semibold text-red-600">{formatCurrency(r.balance)}</span> },
  ];

  return (
    <div>
      <Topbar title="Finance Overview" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue ?? 0)} icon={DollarSign} color="green" />
          <StatCard title="Outstanding Accounts" value={outstanding.length} icon={AlertCircle} color="red" />
          <StatCard title="Recent Payments" value={summary.recentPayments?.length ?? 0} icon={TrendingUp} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">Recent Payments</h2>
            <DataTable columns={paymentCols} data={summary.recentPayments ?? []} emptyMessage="No payments yet." />
          </div>
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">Outstanding Balances</h2>
            <DataTable columns={outstandingCols} data={outstanding.slice(0, 10)} emptyMessage="No outstanding balances." />
          </div>
        </div>
      </div>
    </div>
  );
}

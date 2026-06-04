'use client';
import { useQuery } from '@tanstack/react-query';
import { financeApi, analyticsApi } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, AlertCircle, TrendingUp, ShieldCheck } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function AuditorFinancePage() {
  const { data: summaryData } = useQuery({ queryKey: ['finance', 'summary'], queryFn: () => financeApi.summary() as any });
  const { data: ledgerData }  = useQuery({ queryKey: ['finance', 'ledger', 1], queryFn: () => financeApi.ledger({ page: 1, limit: 50 }) as any });

  const summary  = (summaryData as any)?.data ?? {};
  const entries: any[] = (ledgerData as any)?.data?.data ?? [];

  const typeVariant: Record<string, any> = { CREDIT: 'green', DEBIT: 'red', REFUND: 'blue' };

  const columns = [
    { key: 'user', header: 'Student', render: (r: any) => `${r.user?.firstName} ${r.user?.lastName}` },
    { key: 'description', header: 'Description' },
    { key: 'type', header: 'Type', render: (r: any) => <Badge variant={typeVariant[r.type]}>{r.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (r: any) => formatCurrency(Number(r.amount)) },
    { key: 'balance', header: 'Balance', render: (r: any) => formatCurrency(Number(r.balance)) },
    { key: 'createdAt', header: 'Date', render: (r: any) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <Topbar title="Financial Audit" />
      <div className="p-6 space-y-6">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">Read-only audit view. No modifications are permitted.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="Total Revenue" value={formatCurrency(summary.totalRevenue ?? 0)} icon={DollarSign} color="green" />
          <StatCard title="Recent Payments" value={summary.recentPayments?.length ?? 0} icon={TrendingUp} color="blue" />
          <StatCard title="Outstanding Accounts" value={summary.studentsWithOutstandingBalance ?? 0} icon={AlertCircle} color="red" />
        </div>

        <div className="card p-6">
          <PageHeader title="Ledger Entries (Latest 50)" />
          <DataTable columns={columns} data={entries} emptyMessage="No ledger entries found." />
        </div>
      </div>
    </div>
  );
}

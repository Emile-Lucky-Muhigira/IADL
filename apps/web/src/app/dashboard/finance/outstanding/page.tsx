'use client';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { financeApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

export default function OutstandingPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'outstanding'],
    queryFn: () => financeApi.outstanding() as any,
  });

  const students: any[] = (data as any)?.data ?? [];
  const totalOutstanding = students.reduce((sum: number, s: any) => sum + s.balance, 0);

  const columns = [
    { key: 'name', header: 'Student', render: (r: any) => <span className="font-medium">{r.firstName} {r.lastName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'balance', header: 'Outstanding Balance', render: (r: any) => <span className="font-bold text-red-600">{formatCurrency(r.balance)}</span> },
    { key: 'actions', header: '', render: (r: any) => (
      <a href={`/dashboard/finance/ledger?student=${r.id}`} className="text-brand-600 hover:underline text-sm">View Ledger</a>
    )},
  ];

  return (
    <div>
      <Topbar title="Outstanding Balances" />
      <div className="p-6">
        <PageHeader title="Outstanding Accounts" description={`${students.length} students with unpaid balances totalling ${formatCurrency(totalOutstanding)}`} />

        {students.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-sm text-red-800">Total outstanding: <strong>{formatCurrency(totalOutstanding)}</strong> across {students.length} students.</p>
          </div>
        )}

        <div className="card p-6">
          <DataTable columns={columns} data={students} loading={isLoading} emptyMessage="No outstanding balances. All accounts are clear." />
        </div>
      </div>
    </div>
  );
}

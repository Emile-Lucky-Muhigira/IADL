'use client';
import { Suspense } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { financeApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { DollarSign, AlertCircle } from 'lucide-react';

function ParentPaymentsContent() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;
  const params = useSearchParams();
  const studentId = params.get('studentId') ?? userId;

  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'student', studentId],
    queryFn: () => financeApi.studentLedger(studentId) as any,
    enabled: !!studentId,
  });

  const result = (data as any)?.data ?? {};
  const entries: any[] = result.data ?? [];
  const balance = result.currentBalance ?? 0;

  const typeVariant: Record<string, any> = { CREDIT: 'green', DEBIT: 'red', REFUND: 'blue' };

  const columns = [
    { key: 'description', header: 'Description', render: (r: any) => <span className="text-sm">{r.description}</span> },
    { key: 'type', header: 'Type', render: (r: any) => <Badge variant={typeVariant[r.type] ?? 'gray'}>{r.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (r: any) => formatCurrency(Number(r.amount)) },
    { key: 'balance', header: 'Running Balance', render: (r: any) => formatCurrency(Number(r.balance)) },
    { key: 'createdAt', header: 'Date', render: (r: any) => formatDate(r.createdAt) },
    { key: 'reference', header: 'Reference', render: (r: any) => <span className="text-xs font-mono text-gray-500">{r.reference}</span> },
  ];

  return (
    <div>
      <Topbar title="Payments & Ledger" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <StatCard title="Outstanding Balance" value={formatCurrency(balance)} icon={balance > 0 ? AlertCircle : DollarSign} color={balance > 0 ? 'red' : 'green'} />
          <StatCard title="Total Transactions" value={entries.length} icon={DollarSign} color="blue" />
        </div>
        {balance > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm">
            Outstanding balance of <strong>{formatCurrency(balance)}</strong>. Please contact the finance office to make a payment.
          </div>
        )}
        <div className="card p-6">
          <h2 className="text-base font-semibold mb-4">Payment History</h2>
          <DataTable columns={columns} data={entries} loading={isLoading} emptyMessage="No payment records found." />
        </div>
      </div>
    </div>
  );
}

export default function ParentPaymentsPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-500">Loading…</div>}>
      <ParentPaymentsContent />
    </Suspense>
  );
}

'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { financeApi, usersApi } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function LedgerPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ userId: '', type: 'CREDIT', amount: '', description: '', reference: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['finance', 'ledger', page],
    queryFn: () => financeApi.ledger({ page, limit: 20 }) as any,
  });

  const { data: studentsData } = useQuery({
    queryKey: ['users', 'students', 'finance'],
    queryFn: () => usersApi.list({ role: 'STUDENT', limit: 200, page: 1 }) as any,
  });

  const create = useMutation({
    mutationFn: (d: any) => financeApi.createEntry({ ...d, amount: Number(d.amount) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['finance'] }); setShowModal(false); },
  });

  const entries: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};
  const students: any[] = (studentsData as any)?.data?.data ?? [];

  const typeVariant: Record<string, any> = { CREDIT: 'green', DEBIT: 'red', REFUND: 'blue' };

  const columns = [
    { key: 'user', header: 'Student', render: (r: any) => <span className="font-medium">{r.user?.firstName} {r.user?.lastName}</span> },
    { key: 'description', header: 'Description' },
    { key: 'type', header: 'Type', render: (r: any) => <Badge variant={typeVariant[r.type] ?? 'gray'}>{r.type}</Badge> },
    { key: 'amount', header: 'Amount', render: (r: any) => <span className={r.type === 'CREDIT' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{formatCurrency(Number(r.amount))}</span> },
    { key: 'balance', header: 'Balance', render: (r: any) => formatCurrency(Number(r.balance)) },
    { key: 'reference', header: 'Reference', render: (r: any) => <span className="text-xs font-mono text-gray-500">{r.reference}</span> },
    { key: 'createdAt', header: 'Date', render: (r: any) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <Topbar title="Financial Ledger" />
      <div className="p-6">
        <PageHeader
          title="Ledger"
          description={`${meta.total ?? 0} transactions`}
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Record Payment</button>}
        />
        <div className="card p-6">
          <DataTable columns={columns} data={entries} loading={isLoading} />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Record Payment">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div>
            <label className="label">Student</label>
            <select className="input" required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Select student...</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} – {s.email}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Transaction Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="CREDIT">Payment (Credit)</option>
              <option value="DEBIT">Invoice / Charge (Debit)</option>
              <option value="REFUND">Refund</option>
            </select>
          </div>
          <div><label className="label">Amount (KES)</label><input type="number" className="input" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
          <div><label className="label">Description</label><input className="input" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Tuition payment - Term 1" /></div>
          <div><label className="label">Reference (optional)</label><input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="MPESA-XXXXXXXX" /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Saving...' : 'Record Entry'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

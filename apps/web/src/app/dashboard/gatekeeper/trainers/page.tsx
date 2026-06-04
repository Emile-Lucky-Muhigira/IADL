'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { api } from '@/lib/api';
import { Plus } from 'lucide-react';

export default function GatekeeperTrainersPage() {
  const { data: session } = useSession();
  const tenantId = (session?.user as any)?.tenantId;
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', firstName: '', lastName: '', phone: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['users', 'trainers', page, tenantId],
    queryFn: () => api.get(`/users?role=TRAINER&tenantId=${tenantId}&page=${page}&limit=20`) as any,
    enabled: !!tenantId,
  });

  const create = useMutation({
    mutationFn: (d: any) => api.post('/users', { ...d, role: 'TRAINER', tenantId }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['users'] }); setShowModal(false); },
  });

  const trainers: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};

  const columns = [
    { key: 'name', header: 'Trainer Name', render: (r: any) => <span className="font-medium">{r.firstName} {r.lastName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'phone', header: 'Phone', render: (r: any) => r.phone ?? '—' },
    { key: 'isActive', header: 'Status', render: (r: any) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div>
      <Topbar title="Trainer Management" />
      <div className="p-6">
        <PageHeader
          title="Trainers"
          description={`${meta.total ?? 0} trainers`}
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Add Trainer</button>}
        />
        <div className="card p-6">
          <DataTable columns={columns} data={trainers} loading={isLoading} />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Trainer">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name</label><input className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label className="label">Last Name</label><input className="input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Password</label><input type="password" className="input" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Adding...' : 'Add Trainer'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

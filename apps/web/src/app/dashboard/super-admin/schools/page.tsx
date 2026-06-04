'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Building2, Plus } from 'lucide-react';

export default function SchoolsPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', address: '', phone: '', email: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page],
    queryFn: () => api.get(`/tenants?page=${page}&limit=20`) as any,
  });

  const create = useMutation({
    mutationFn: (d: any) => api.post('/tenants', d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['tenants'] }); setShowModal(false); setForm({ name: '', domain: '', address: '', phone: '', email: '' }); },
  });

  const schools: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};

  const columns = [
    { key: 'name', header: 'School Name', render: (r: any) => <span className="font-medium">{r.name}</span> },
    { key: 'domain', header: 'Domain' },
    { key: 'phone', header: 'Phone' },
    { key: '_count', header: 'Users', render: (r: any) => r._count?.users ?? 0 },
    { key: '_count2', header: 'Courses', render: (r: any) => r._count?.courses ?? 0 },
    { key: 'isActive', header: 'Status', render: (r: any) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'createdAt', header: 'Onboarded', render: (r: any) => formatDate(r.createdAt) },
  ];

  return (
    <div>
      <Topbar title="Schools Management" />
      <div className="p-6">
        <PageHeader
          title="All Schools"
          description="Manage all ADL school branches"
          action={
            <button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" /> Onboard School
            </button>
          }
        />
        <div className="card p-6">
          <DataTable columns={columns} data={schools} loading={isLoading} emptyMessage="No schools onboarded yet." />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Onboard New School">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          {[
            { name: 'name', label: 'School Name', placeholder: 'ADL Nairobi' },
            { name: 'domain', label: 'Domain', placeholder: 'nairobi.adlschools.ac.ke' },
            { name: 'address', label: 'Address', placeholder: 'Westlands, Nairobi' },
            { name: 'phone', label: 'Phone', placeholder: '+254 700 000 000' },
            { name: 'email', label: 'Email', placeholder: 'nairobi@adlschools.ac.ke' },
          ].map((f) => (
            <div key={f.name}>
              <label className="label">{f.label}</label>
              <input className="input" placeholder={f.placeholder} value={(form as any)[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.value })} />
            </div>
          ))}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Creating...' : 'Onboard School'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

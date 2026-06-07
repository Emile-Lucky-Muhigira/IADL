'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { tenantsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Pencil, Power } from 'lucide-react';

const emptyForm = { name: '', domain: '', address: '', phone: '', email: '' };
const clean = (o: Record<string, any>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== '' && v != null));

export default function SchoolsPage() {
  const { data: session } = useSession();
  const canDeactivate = (session?.user as any)?.role === 'SUPER_ADMIN';

  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editSchool, setEditSchool] = useState<any | null>(null);
  const [confirmSchool, setConfirmSchool] = useState<any | null>(null);
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['tenants'] });

  const { data, isLoading } = useQuery({
    queryKey: ['tenants', page],
    queryFn: () => tenantsApi.list({ page, limit: 20 }) as any,
  });

  const create = useMutation({
    mutationFn: (d: any) => tenantsApi.create(clean(d)),
    onSuccess: () => { invalidate(); setShowModal(false); setForm(emptyForm); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => tenantsApi.update(id, clean({ name: data.name, address: data.address, phone: data.phone, email: data.email })),
    onSuccess: () => { invalidate(); setEditSchool(null); },
  });

  const deactivate = useMutation({
    mutationFn: (id: string) => tenantsApi.remove(id),
    onSuccess: () => { invalidate(); setConfirmSchool(null); },
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
    {
      key: 'actions',
      header: 'Actions',
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setEditSchool({ ...r })} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600" title="Edit school"><Pencil className="w-4 h-4" /></button>
          {canDeactivate && r.isActive && (
            <button onClick={() => setConfirmSchool(r)} className="p-1.5 rounded-lg text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Deactivate school"><Power className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="Schools Management" />
      <div className="p-6">
        <PageHeader
          title="All Schools"
          description="Manage all ADL school branches"
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Onboard School</button>}
        />
        <div className="card p-6">
          <DataTable columns={columns} data={schools} loading={isLoading} emptyMessage="No schools onboarded yet." />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      {/* Onboard */}
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
          {create.isError && <p className="text-sm text-red-600">Could not onboard school. The domain may already exist.</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Creating...' : 'Onboard School'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={!!editSchool} onClose={() => setEditSchool(null)} title="Edit School">
        {editSchool && (
          <form onSubmit={(e) => { e.preventDefault(); update.mutate({ id: editSchool.id, data: editSchool }); }} className="space-y-4">
            <div><label className="label">School Name</label><input className="input" required value={editSchool.name ?? ''} onChange={(e) => setEditSchool({ ...editSchool, name: e.target.value })} /></div>
            <div><label className="label">Domain</label><input className="input bg-gray-50 dark:bg-gray-800" value={editSchool.domain} disabled /></div>
            <div><label className="label">Address</label><input className="input" value={editSchool.address ?? ''} onChange={(e) => setEditSchool({ ...editSchool, address: e.target.value })} /></div>
            <div><label className="label">Phone</label><input className="input" value={editSchool.phone ?? ''} onChange={(e) => setEditSchool({ ...editSchool, phone: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" value={editSchool.email ?? ''} onChange={(e) => setEditSchool({ ...editSchool, email: e.target.value })} /></div>
            {update.isError && <p className="text-sm text-red-600">Could not save changes.</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={update.isPending} className="btn-primary flex-1">{update.isPending ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditSchool(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Deactivate */}
      <ConfirmDialog
        open={!!confirmSchool}
        danger
        title="Deactivate school"
        message={<>Deactivate <strong>{confirmSchool?.name}</strong>? Its users will lose access. Data is preserved.</>}
        confirmLabel="Deactivate"
        loading={deactivate.isPending}
        onConfirm={() => deactivate.mutate(confirmSchool.id)}
        onClose={() => setConfirmSchool(null)}
      />
    </div>
  );
}

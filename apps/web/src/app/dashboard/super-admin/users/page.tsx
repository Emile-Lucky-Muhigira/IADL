'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { usersApi } from '@/lib/api';
import { getRoleLabel, getRoleBadgeColor, formatDate } from '@/lib/utils';
import { Plus, Pencil, UserX, UserCheck } from 'lucide-react';

const CREATE_ROLES = ['SUPER_ADMIN', 'ADL_ADMIN'];
const ALL_ROLES = ['SUPER_ADMIN', 'ADL_ADMIN', 'SCHOOL_GATEKEEPER', 'TRAINER', 'ACCOUNTANT', 'PARENT', 'SYSTEM_AUDITOR', 'STUDENT'];

const emptyCreate = { email: '', password: '', firstName: '', lastName: '', phone: '', role: 'ADL_ADMIN' };

export default function SuperAdminUsersPage() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyCreate);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [confirmUser, setConfirmUser] = useState<any | null>(null);
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page],
    queryFn: () => usersApi.list({ page, limit: 20 }) as any,
  });

  const create = useMutation({
    mutationFn: (d: any) => usersApi.create(d),
    onSuccess: () => { invalidate(); setShowCreate(false); setForm(emptyCreate); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => usersApi.update(id, data),
    onSuccess: () => { invalidate(); setEditUser(null); },
  });

  const toggleActive = useMutation({
    mutationFn: (u: any) => (u.isActive ? usersApi.remove(u.id) : usersApi.update(u.id, { isActive: true })),
    onSuccess: () => { invalidate(); setConfirmUser(null); },
  });

  const users: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.firstName} {r.lastName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r: any) => <span className={`badge ${getRoleBadgeColor(r.role)}`}>{getRoleLabel(r.role)}</span> },
    { key: 'tenant', header: 'School', render: (r: any) => r.tenant?.name ?? 'Global' },
    { key: 'isActive', header: 'Status', render: (r: any) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'lastLoginAt', header: 'Last Login', render: (r: any) => r.lastLoginAt ? formatDate(r.lastLoginAt) : 'Never' },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setEditUser({ ...r })}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600"
            title="Edit user"
          >
            <Pencil className="w-4 h-4" />
          </button>
          <button
            onClick={() => setConfirmUser(r)}
            className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${r.isActive ? 'text-red-500' : 'text-green-600'}`}
            title={r.isActive ? 'Deactivate user' : 'Reactivate user'}
          >
            {r.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="User Management" />
      <div className="p-6">
        <PageHeader
          title="All Users"
          action={<button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create User</button>}
        />
        <div className="card p-6">
          <DataTable columns={columns} data={users} loading={isLoading} />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      {/* Create */}
      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Create New User">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">First Name</label><input className="input" required value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} /></div>
            <div><label className="label">Last Name</label><input className="input" required value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} /></div>
          </div>
          <div><label className="label">Email</label><input type="email" className="input" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="label">Phone</label><input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><label className="label">Password</label><input type="password" className="input" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              {CREATE_ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
            </select>
          </div>
          {create.isError && <p className="text-sm text-red-600">Could not create user. Check the details and try again.</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Creating...' : 'Create User'}</button>
            <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={!!editUser} onClose={() => setEditUser(null)} title="Edit User">
        {editUser && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update.mutate({ id: editUser.id, data: { firstName: editUser.firstName, lastName: editUser.lastName, phone: editUser.phone ?? undefined, role: editUser.role } });
            }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First Name</label><input className="input" required value={editUser.firstName ?? ''} onChange={(e) => setEditUser({ ...editUser, firstName: e.target.value })} /></div>
              <div><label className="label">Last Name</label><input className="input" required value={editUser.lastName ?? ''} onChange={(e) => setEditUser({ ...editUser, lastName: e.target.value })} /></div>
            </div>
            <div><label className="label">Email</label><input className="input bg-gray-50 dark:bg-gray-800" value={editUser.email} disabled /></div>
            <div><label className="label">Phone</label><input className="input" value={editUser.phone ?? ''} onChange={(e) => setEditUser({ ...editUser, phone: e.target.value })} /></div>
            <div>
              <label className="label">Role</label>
              <select className="input" value={editUser.role} onChange={(e) => setEditUser({ ...editUser, role: e.target.value })}>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
              </select>
            </div>
            {update.isError && <p className="text-sm text-red-600">Could not save changes.</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={update.isPending} className="btn-primary flex-1">{update.isPending ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditUser(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Deactivate / Reactivate */}
      <ConfirmDialog
        open={!!confirmUser}
        danger={confirmUser?.isActive}
        title={confirmUser?.isActive ? 'Deactivate user' : 'Reactivate user'}
        message={
          confirmUser?.isActive
            ? <>Deactivate <strong>{confirmUser?.firstName} {confirmUser?.lastName}</strong>? They will no longer be able to sign in. Their records are kept and you can reactivate them later.</>
            : <>Reactivate <strong>{confirmUser?.firstName} {confirmUser?.lastName}</strong> so they can sign in again?</>
        }
        confirmLabel={confirmUser?.isActive ? 'Deactivate' : 'Reactivate'}
        loading={toggleActive.isPending}
        onConfirm={() => toggleActive.mutate(confirmUser)}
        onClose={() => setConfirmUser(null)}
      />
    </div>
  );
}

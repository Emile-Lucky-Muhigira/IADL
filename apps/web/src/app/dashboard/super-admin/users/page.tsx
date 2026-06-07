'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { usersApi, tenantsApi } from '@/lib/api';
import { getRoleLabel, getRoleBadgeColor, formatDate, exportToCsv } from '@/lib/utils';
import { Plus, Pencil, UserX, UserCheck, KeyRound, Search, Download } from 'lucide-react';

const ALL_ROLES = ['SUPER_ADMIN', 'ADL_ADMIN', 'SCHOOL_GATEKEEPER', 'TRAINER', 'ACCOUNTANT', 'PARENT', 'SYSTEM_AUDITOR', 'STUDENT'];
const GLOBAL_ROLES = ['SUPER_ADMIN', 'ADL_ADMIN'];
const emptyCreate = { email: '', password: '', firstName: '', lastName: '', phone: '', role: 'TRAINER', tenantId: '' };

export default function SuperAdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(emptyCreate);
  const [editUser, setEditUser] = useState<any | null>(null);
  const [confirmUser, setConfirmUser] = useState<any | null>(null);
  const [resetUser, setResetUser] = useState<any | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const qc = useQueryClient();

  // Debounce the search box.
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, roleFilter],
    queryFn: () => usersApi.list({ page, limit: 20, search: search || undefined, role: roleFilter || undefined }) as any,
  });

  const { data: tenantsData } = useQuery({
    queryKey: ['tenants', 'all'],
    queryFn: () => tenantsApi.list({ limit: 100 }) as any,
  });
  const schools: any[] = (tenantsData as any)?.data?.data ?? [];

  const create = useMutation({
    mutationFn: (d: any) => {
      const isGlobal = GLOBAL_ROLES.includes(d.role);
      return usersApi.create({ ...d, tenantId: isGlobal ? undefined : d.tenantId || undefined });
    },
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
  const resetPassword = useMutation({
    mutationFn: ({ id, pwd }: { id: string; pwd: string }) => usersApi.resetPassword(id, pwd),
    onSuccess: () => { setResetUser(null); setNewPassword(''); },
  });

  const users: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};

  const handleExport = () => {
    exportToCsv('users.csv', users.map((u) => ({
      Name: `${u.firstName} ${u.lastName}`, Email: u.email, Role: getRoleLabel(u.role),
      School: u.tenant?.name ?? 'Global', Status: u.isActive ? 'Active' : 'Inactive',
      LastLogin: u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never',
    })));
  };

  const columns = [
    { key: 'name', header: 'Name', render: (r: any) => <span className="font-medium">{r.firstName} {r.lastName}</span> },
    { key: 'email', header: 'Email' },
    { key: 'role', header: 'Role', render: (r: any) => <span className={`badge ${getRoleBadgeColor(r.role)}`}>{getRoleLabel(r.role)}</span> },
    { key: 'tenant', header: 'School', render: (r: any) => r.tenant?.name ?? 'Global' },
    { key: 'isActive', header: 'Status', render: (r: any) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
    { key: 'lastLoginAt', header: 'Last Login', render: (r: any) => r.lastLoginAt ? formatDate(r.lastLoginAt) : 'Never' },
    {
      key: 'actions', header: 'Actions',
      render: (r: any) => (
        <div className="flex items-center gap-1">
          <button onClick={() => setEditUser({ ...r })} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600" title="Edit user"><Pencil className="w-4 h-4" /></button>
          <button onClick={() => setResetUser(r)} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-amber-600" title="Reset password"><KeyRound className="w-4 h-4" /></button>
          <button onClick={() => setConfirmUser(r)} className={`p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 ${r.isActive ? 'text-red-500' : 'text-green-600'}`} title={r.isActive ? 'Deactivate' : 'Reactivate'}>
            {r.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
          </button>
        </div>
      ),
    },
  ];

  const isGlobalRole = GLOBAL_ROLES.includes(form.role);

  return (
    <div>
      <Topbar title="User Management" />
      <div className="p-6">
        <PageHeader
          title="All Users"
          action={
            <div className="flex gap-2">
              <button onClick={handleExport} className="btn-secondary flex items-center gap-2"><Download className="w-4 h-4" /> Export CSV</button>
              <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> Create User</button>
            </div>
          }
        />

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input className="input pl-9" placeholder="Search by name or email..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
          </div>
          <select className="input sm:w-56" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            {ALL_ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
          </select>
        </div>

        <div className="card p-6">
          <DataTable columns={columns} data={users} loading={isLoading} emptyMessage="No users match your filters." />
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
          <div><label className="label">Temporary Password</label><input type="password" className="input" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Role</label>
              <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {ALL_ROLES.map((r) => <option key={r} value={r}>{getRoleLabel(r)}</option>)}
              </select>
            </div>
            <div>
              <label className="label">School {isGlobalRole && <span className="text-gray-400">(N/A)</span>}</label>
              <select className="input" value={form.tenantId} disabled={isGlobalRole} required={!isGlobalRole} onChange={(e) => setForm({ ...form, tenantId: e.target.value })}>
                <option value="">{isGlobalRole ? 'Global role' : 'Select a school'}</option>
                {schools.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
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
          <form onSubmit={(e) => { e.preventDefault(); update.mutate({ id: editUser.id, data: { firstName: editUser.firstName, lastName: editUser.lastName, phone: editUser.phone ?? undefined, role: editUser.role } }); }} className="space-y-4">
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

      {/* Reset password */}
      <Modal open={!!resetUser} onClose={() => { setResetUser(null); setNewPassword(''); }} title="Reset Password">
        {resetUser && (
          <form onSubmit={(e) => { e.preventDefault(); resetPassword.mutate({ id: resetUser.id, pwd: newPassword }); }} className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">Set a new password for <strong>{resetUser.firstName} {resetUser.lastName}</strong>. Share it securely; they can change it after signing in.</p>
            <div><label className="label">New Password</label><input type="text" className="input font-mono" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="At least 8 characters" /></div>
            {resetPassword.isError && <p className="text-sm text-red-600">Could not reset password.</p>}
            {resetPassword.isSuccess && <p className="text-sm text-green-600">Password reset.</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={resetPassword.isPending} className="btn-primary flex-1">{resetPassword.isPending ? 'Resetting...' : 'Reset Password'}</button>
              <button type="button" onClick={() => { setResetUser(null); setNewPassword(''); }} className="btn-secondary flex-1">Cancel</button>
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
            ? <>Deactivate <strong>{confirmUser?.firstName} {confirmUser?.lastName}</strong>? They will no longer be able to sign in. Records are kept and you can reactivate them later.</>
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

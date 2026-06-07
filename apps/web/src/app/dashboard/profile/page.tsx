'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { authApi } from '@/lib/api';
import { getRoleLabel } from '@/lib/utils';
import { User, Lock } from 'lucide-react';

export default function ProfilePage() {
  const { data } = useQuery({ queryKey: ['me'], queryFn: () => authApi.me() as any });
  const me = (data as any)?.data;

  const [profile, setProfile] = useState({ firstName: '', lastName: '', phone: '' });
  const [pwd, setPwd] = useState({ currentPassword: '', newPassword: '', confirm: '' });

  useEffect(() => {
    if (me) setProfile({ firstName: me.firstName ?? '', lastName: me.lastName ?? '', phone: me.phone ?? '' });
  }, [me]);

  const saveProfile = useMutation({
    mutationFn: () => authApi.updateProfile({ firstName: profile.firstName, lastName: profile.lastName, phone: profile.phone || undefined }),
  });
  const changePassword = useMutation({
    mutationFn: () => authApi.changePassword(pwd.currentPassword, pwd.newPassword),
    onSuccess: () => setPwd({ currentPassword: '', newPassword: '', confirm: '' }),
  });

  const pwdMismatch = pwd.newPassword.length > 0 && pwd.newPassword !== pwd.confirm;

  return (
    <div>
      <Topbar title="My Profile" />
      <div className="p-6 max-w-2xl space-y-6">
        <PageHeader title="My Profile" description="Manage your personal details and password." />

        {/* Profile details */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-semibold">Personal Details</h2>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); saveProfile.mutate(); }} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">First Name</label><input className="input" required value={profile.firstName} onChange={(e) => setProfile({ ...profile, firstName: e.target.value })} /></div>
              <div><label className="label">Last Name</label><input className="input" required value={profile.lastName} onChange={(e) => setProfile({ ...profile, lastName: e.target.value })} /></div>
            </div>
            <div><label className="label">Email</label><input className="input bg-gray-50 dark:bg-gray-800" value={me?.email ?? ''} disabled /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Phone</label><input className="input" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
              <div><label className="label">Role</label><input className="input bg-gray-50 dark:bg-gray-800" value={me ? getRoleLabel(me.role) : ''} disabled /></div>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={saveProfile.isPending} className="btn-primary">{saveProfile.isPending ? 'Saving...' : 'Save Changes'}</button>
              {saveProfile.isSuccess && <span className="text-sm text-green-600">Saved.</span>}
              {saveProfile.isError && <span className="text-sm text-red-600">Could not save.</span>}
            </div>
          </form>
        </div>

        {/* Change password */}
        <div className="card p-6">
          <div className="flex items-center gap-2 mb-4">
            <Lock className="w-5 h-5 text-brand-600" />
            <h2 className="text-base font-semibold">Change Password</h2>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); if (!pwdMismatch) changePassword.mutate(); }} className="space-y-4">
            <div><label className="label">Current Password</label><input type="password" className="input" required value={pwd.currentPassword} onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">New Password</label><input type="password" className="input" required minLength={8} value={pwd.newPassword} onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })} /></div>
              <div><label className="label">Confirm New Password</label><input type="password" className="input" required value={pwd.confirm} onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })} /></div>
            </div>
            {pwdMismatch && <p className="text-sm text-red-600">Passwords do not match.</p>}
            <div className="flex items-center gap-3 pt-1">
              <button type="submit" disabled={changePassword.isPending || pwdMismatch} className="btn-primary">{changePassword.isPending ? 'Updating...' : 'Update Password'}</button>
              {changePassword.isSuccess && <span className="text-sm text-green-600">Password updated.</span>}
              {changePassword.isError && <span className="text-sm text-red-600">Current password is incorrect.</span>}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

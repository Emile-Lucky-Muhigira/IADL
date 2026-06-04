'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Pagination } from '@/components/ui/pagination';
import { certificatesApi, usersApi, coursesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Award } from 'lucide-react';

export default function ADLAdminCertificatesPage() {
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ userId: '', courseId: '' });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['certificates', 'branch', page],
    queryFn: () => import('@/lib/api').then(({ api }) => api.get(`/certificates/branch?page=${page}&limit=20`)) as any,
  });

  const { data: studentsData } = useQuery({ queryKey: ['users', 'students'], queryFn: () => usersApi.list({ role: 'STUDENT', limit: 200 }) as any });
  const { data: coursesData } = useQuery({ queryKey: ['courses', 'all'], queryFn: () => coursesApi.list({ limit: 100 }) as any });

  const issue = useMutation({
    mutationFn: (d: any) => certificatesApi.issue(d.userId, d.courseId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['certificates'] }); setShowModal(false); },
  });

  const certs: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};
  const students: any[] = (studentsData as any)?.data?.data ?? [];
  const courses: any[] = (coursesData as any)?.data?.data ?? [];

  const columns = [
    { key: 'user', header: 'Student', render: (r: any) => <span className="font-medium">{r.user?.firstName} {r.user?.lastName}</span> },
    { key: 'course', header: 'Course', render: (r: any) => r.course?.title },
    { key: 'uniqueCode', header: 'Code', render: (r: any) => <span className="font-mono text-xs text-brand-600">{r.uniqueCode}</span> },
    { key: 'issuedAt', header: 'Issued', render: (r: any) => formatDate(r.issuedAt) },
    { key: 'verify', header: '', render: (r: any) => <a href={`/certificates/verify/${r.uniqueCode}`} target="_blank" className="text-brand-600 hover:underline text-sm">Verify</a> },
  ];

  return (
    <div>
      <Topbar title="Certificates" />
      <div className="p-6">
        <PageHeader
          title="Digital Certificates"
          description={`${meta.total ?? certs.length} certificates issued`}
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Award className="w-4 h-4" /> Issue Certificate</button>}
        />
        <div className="card p-6">
          <DataTable columns={columns} data={certs} loading={isLoading} emptyMessage="No certificates issued yet." />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Issue Certificate">
        <form onSubmit={(e) => { e.preventDefault(); issue.mutate(form); }} className="space-y-4">
          <div>
            <label className="label">Student (must have completed course)</label>
            <select className="input" required value={form.userId} onChange={(e) => setForm({ ...form, userId: e.target.value })}>
              <option value="">Select student...</option>
              {students.map((s: any) => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Course</label>
            <select className="input" required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select course...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          {issue.isError && <p className="text-red-600 text-sm">{(issue.error as any)?.message ?? 'Failed to issue certificate'}</p>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={issue.isPending} className="btn-primary flex-1">{issue.isPending ? 'Issuing...' : 'Issue Certificate'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

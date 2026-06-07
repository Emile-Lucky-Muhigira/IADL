'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Pagination } from '@/components/ui/pagination';
import { coursesApi } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Plus, BookOpen, Pencil, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

const emptyForm = { title: '', description: '', price: '', duration: '', syllabus: '' };

export default function TrainerCoursesPage() {
  const { data: session } = useSession();
  const role = (session?.user as any)?.role;
  const canDelete = role === 'SUPER_ADMIN' || role === 'ADL_ADMIN';

  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editCourse, setEditCourse] = useState<any | null>(null);
  const [confirmCourse, setConfirmCourse] = useState<any | null>(null);
  const qc = useQueryClient();

  const invalidate = () => qc.invalidateQueries({ queryKey: ['courses'] });

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page],
    queryFn: () => coursesApi.list({ page, limit: 20 }) as any,
  });

  const create = useMutation({
    mutationFn: (d: any) => coursesApi.create({ ...d, price: Number(d.price), duration: Number(d.duration) }),
    onSuccess: () => { invalidate(); setShowModal(false); setForm(emptyForm); },
  });

  const update = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      coursesApi.update(id, { title: data.title, description: data.description, syllabus: data.syllabus, price: Number(data.price), duration: Number(data.duration) }),
    onSuccess: () => { invalidate(); setEditCourse(null); },
  });

  const remove = useMutation({
    mutationFn: (id: string) => coursesApi.remove(id),
    onSuccess: () => { invalidate(); setConfirmCourse(null); },
  });

  const courses: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};

  const columns = [
    { key: 'title', header: 'Title', render: (r: any) => <span className="font-medium">{r.title}</span> },
    { key: 'price', header: 'Price', render: (r: any) => formatCurrency(Number(r.price)) },
    { key: 'duration', header: 'Hours', render: (r: any) => `${r.duration}h` },
    { key: 'students', header: 'Students', render: (r: any) => r._count?.enrollments ?? 0 },
    { key: 'sessions', header: 'Sessions', render: (r: any) => r._count?.sessions ?? 0 },
    {
      key: 'actions',
      header: 'Actions',
      render: (r: any) => (
        <div className="flex items-center gap-2">
          <a href={`/dashboard/trainer/courses/${r.id}`} className="text-brand-600 hover:underline text-sm">Manage</a>
          <button onClick={() => setEditCourse({ ...r, price: String(r.price), duration: String(r.duration) })} className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-brand-600" title="Edit course"><Pencil className="w-4 h-4" /></button>
          {canDelete && (
            <button onClick={() => setConfirmCourse(r)} className="p-1.5 rounded-lg text-red-500 hover:bg-gray-100 dark:hover:bg-gray-800" title="Deactivate course"><Trash2 className="w-4 h-4" /></button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Topbar title="My Courses" />
      <div className="p-6">
        <PageHeader
          title="Courses"
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Course</button>}
        />
        <div className="card p-6">
          {!isLoading && courses.length === 0 ? (
            <EmptyState icon={BookOpen} title="No courses yet" description="Create your first course to get started." action={<button onClick={() => setShowModal(true)} className="btn-primary">Create Course</button>} />
          ) : (
            <>
              <DataTable columns={columns} data={courses} loading={isLoading} />
              <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
            </>
          )}
        </div>
      </div>

      {/* Create */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create New Course" size="lg">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div><label className="label">Course Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Syllabus</label><textarea className="input min-h-[100px]" placeholder="Week 1: Introduction..." value={form.syllabus} onChange={(e) => setForm({ ...form, syllabus: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Price (KES)</label><input type="number" className="input" required value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className="label">Duration (hours)</label><input type="number" className="input" required value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Creating...' : 'Create Course'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Edit */}
      <Modal open={!!editCourse} onClose={() => setEditCourse(null)} title="Edit Course" size="lg">
        {editCourse && (
          <form onSubmit={(e) => { e.preventDefault(); update.mutate({ id: editCourse.id, data: editCourse }); }} className="space-y-4">
            <div><label className="label">Course Title</label><input className="input" required value={editCourse.title ?? ''} onChange={(e) => setEditCourse({ ...editCourse, title: e.target.value })} /></div>
            <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={editCourse.description ?? ''} onChange={(e) => setEditCourse({ ...editCourse, description: e.target.value })} /></div>
            <div><label className="label">Syllabus</label><textarea className="input min-h-[100px]" value={editCourse.syllabus ?? ''} onChange={(e) => setEditCourse({ ...editCourse, syllabus: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="label">Price (KES)</label><input type="number" className="input" required value={editCourse.price ?? ''} onChange={(e) => setEditCourse({ ...editCourse, price: e.target.value })} /></div>
              <div><label className="label">Duration (hours)</label><input type="number" className="input" required value={editCourse.duration ?? ''} onChange={(e) => setEditCourse({ ...editCourse, duration: e.target.value })} /></div>
            </div>
            {update.isError && <p className="text-sm text-red-600">Could not save changes.</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={update.isPending} className="btn-primary flex-1">{update.isPending ? 'Saving...' : 'Save Changes'}</button>
              <button type="button" onClick={() => setEditCourse(null)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        )}
      </Modal>

      {/* Deactivate */}
      <ConfirmDialog
        open={!!confirmCourse}
        danger
        title="Deactivate course"
        message={<>Deactivate <strong>{confirmCourse?.title}</strong>? It will be hidden from listings. Enrollments and records are preserved.</>}
        confirmLabel="Deactivate"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(confirmCourse.id)}
        onClose={() => setConfirmCourse(null)}
      />
    </div>
  );
}

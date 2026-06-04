'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { assessmentsApi, coursesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus } from 'lucide-react';

export default function TrainerAssessmentsPage() {
  const [showModal, setShowModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [form, setForm] = useState({ courseId: '', title: '', description: '', type: 'ASSIGNMENT', dueDate: '', maxScore: '100' });
  const qc = useQueryClient();

  const { data: coursesData } = useQuery({ queryKey: ['courses', 'all'], queryFn: () => coursesApi.list({ limit: 100 }) as any });
  const { data: assessmentsData, isLoading } = useQuery({
    queryKey: ['assessments', selectedCourse],
    queryFn: () => assessmentsApi.byCourse(selectedCourse) as any,
    enabled: !!selectedCourse,
  });

  const create = useMutation({
    mutationFn: (d: any) => assessmentsApi.byCourse(d.courseId).then(() => {}),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['assessments'] }); setShowModal(false); },
  });

  const courses: any[] = (coursesData as any)?.data?.data ?? [];
  const assessments: any[] = (assessmentsData as any)?.data ?? [];

  const typeVariant: Record<string, any> = { QUIZ: 'blue', ASSIGNMENT: 'orange', PROJECT: 'purple', EXAM: 'red' };

  const columns = [
    { key: 'title', header: 'Title', render: (r: any) => <span className="font-medium">{r.title}</span> },
    { key: 'type', header: 'Type', render: (r: any) => <Badge variant={typeVariant[r.type]}>{r.type}</Badge> },
    { key: 'dueDate', header: 'Due Date', render: (r: any) => r.dueDate ? formatDate(r.dueDate) : '—' },
    { key: 'maxScore', header: 'Max Score' },
    { key: 'submissions', header: 'Submissions', render: (r: any) => r._count?.submissions ?? 0 },
  ];

  return (
    <div>
      <Topbar title="Assessments" />
      <div className="p-6 space-y-4">
        <PageHeader
          title="Assessments & Assignments"
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Assessment</button>}
        />

        <div className="card p-4">
          <label className="label">Filter by Course</label>
          <select className="input max-w-xs" value={selectedCourse} onChange={(e) => setSelectedCourse(e.target.value)}>
            <option value="">Select course...</option>
            {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </div>

        {selectedCourse && (
          <div className="card p-6">
            <DataTable columns={columns} data={assessments} loading={isLoading} emptyMessage="No assessments for this course." />
          </div>
        )}
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Create Assessment">
        <form onSubmit={(e) => {
          e.preventDefault();
          import('@/lib/api').then(({ api }) => api.post('/assessments', { ...form, maxScore: Number(form.maxScore) })).then(() => { qc.invalidateQueries({ queryKey: ['assessments'] }); setShowModal(false); });
        }} className="space-y-4">
          <div>
            <label className="label">Course</label>
            <select className="input" required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select course...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div><label className="label">Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Description</label><textarea className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Type</label>
              <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                {['QUIZ', 'ASSIGNMENT', 'PROJECT', 'EXAM'].map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div><label className="label">Max Score</label><input type="number" className="input" value={form.maxScore} onChange={(e) => setForm({ ...form, maxScore: e.target.value })} /></div>
          </div>
          <div><label className="label">Due Date</label><input type="datetime-local" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} /></div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">Create Assessment</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

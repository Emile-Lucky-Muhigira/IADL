'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { sessionsApi, coursesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, CalendarDays } from 'lucide-react';

export default function TrainerSessionsPage() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ courseId: '', title: '', scheduledAt: '', duration: '90', isLive: true, meetingUrl: '' });
  const qc = useQueryClient();

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ['sessions', 'branch'],
    queryFn: () => sessionsApi.branch(false) as any,
  });

  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'trainer'],
    queryFn: () => coursesApi.list({ limit: 100 }) as any,
  });

  const create = useMutation({
    mutationFn: (d: any) => sessionsApi.create({ ...d, duration: Number(d.duration), isLive: Boolean(d.isLive) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['sessions'] }); setShowModal(false); },
  });

  const sessions: any[] = (sessionsData as any)?.data?.data ?? [];
  const courses: any[] = (coursesData as any)?.data?.data ?? [];

  const columns = [
    { key: 'title', header: 'Session Title', render: (r: any) => <span className="font-medium">{r.title}</span> },
    { key: 'course', header: 'Course', render: (r: any) => r.course?.title ?? '—' },
    { key: 'scheduledAt', header: 'Scheduled', render: (r: any) => formatDate(r.scheduledAt) },
    { key: 'duration', header: 'Duration', render: (r: any) => `${r.duration} min` },
    { key: 'isLive', header: 'Type', render: (r: any) => <Badge variant={r.isLive ? 'blue' : 'gray'}>{r.isLive ? 'Live' : 'Recorded'}</Badge> },
    { key: 'attendances', header: 'Attended', render: (r: any) => r._count?.attendances ?? 0 },
    { key: 'mark', header: '', render: (r: any) => (
      <a href={`/dashboard/trainer/sessions/${r.id}`} className="btn-primary text-xs px-3 py-1.5">
        Mark Attendance
      </a>
    )},
  ];

  return (
    <div>
      <Topbar title="Sessions" />
      <div className="p-6">
        <PageHeader
          title="Class Sessions"
          action={<button onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-2"><Plus className="w-4 h-4" /> New Session</button>}
        />
        <div className="card p-6">
          <DataTable columns={columns} data={sessions} loading={isLoading} />
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Schedule New Session">
        <form onSubmit={(e) => { e.preventDefault(); create.mutate(form); }} className="space-y-4">
          <div>
            <label className="label">Course</label>
            <select className="input" required value={form.courseId} onChange={(e) => setForm({ ...form, courseId: e.target.value })}>
              <option value="">Select course...</option>
              {courses.map((c: any) => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div><label className="label">Session Title</label><input className="input" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
          <div><label className="label">Date & Time</label><input type="datetime-local" className="input" required value={form.scheduledAt} onChange={(e) => setForm({ ...form, scheduledAt: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Duration (minutes)</label><input type="number" className="input" value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} /></div>
            <div>
              <label className="label">Type</label>
              <select className="input" value={String(form.isLive)} onChange={(e) => setForm({ ...form, isLive: e.target.value === 'true' })}>
                <option value="true">Live Session</option>
                <option value="false">Recorded</option>
              </select>
            </div>
          </div>
          {form.isLive && <div><label className="label">Meeting URL</label><input className="input" placeholder="https://meet.google.com/..." value={form.meetingUrl} onChange={(e) => setForm({ ...form, meetingUrl: e.target.value })} /></div>}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={create.isPending} className="btn-primary flex-1">{create.isPending ? 'Scheduling...' : 'Schedule Session'}</button>
            <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

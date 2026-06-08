'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { api, sessionsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { AlertTriangle } from 'lucide-react';

export default function TrainerAttendancePage() {
  const [selectedSession, setSelectedSession] = useState('');

  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'trainer'],
    queryFn: () => sessionsApi.branch(false) as any,
  });

  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['attendance', 'session', selectedSession],
    queryFn: () => api.get(`/attendance/session/${selectedSession}`) as any,
    enabled: !!selectedSession,
  });

  const { data: lowData } = useQuery({
    queryKey: ['attendance', 'low'],
    queryFn: () => api.get('/attendance/alerts/low') as any,
  });

  const markManual = useMutation({
    mutationFn: (d: any) => api.post('/attendance/manual', d),
  });

  const sessions: any[] = (sessionsData as any)?.data?.data ?? [];
  const records: any[] = (attendanceData as any)?.data ?? [];
  const low: any[] = (lowData as any)?.data ?? [];

  const statusVariant: Record<string, any> = { PRESENT: 'green', ABSENT: 'red', LATE: 'orange', EXCUSED: 'blue' };

  const columns = [
    { key: 'student', header: 'Student', render: (r: any) => <span className="font-medium">{r.user?.firstName} {r.user?.lastName}</span> },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={statusVariant[r.status] ?? 'gray'}>{r.status}</Badge> },
    { key: 'markedAt', header: 'Marked At', render: (r: any) => formatDate(r.markedAt) },
    { key: 'notes', header: 'Notes', render: (r: any) => r.notes ?? '—' },
    { key: 'override', header: 'Override', render: (r: any) => (
      <select className="text-xs border rounded px-1 py-0.5" defaultValue={r.status} onChange={(e) => markManual.mutate({ userId: r.userId, sessionId: selectedSession, status: e.target.value })}>
        {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
    )},
  ];

  return (
    <div>
      <Topbar title="Attendance" />
      <div className="p-6 space-y-6">
        <PageHeader title="Attendance Records" />

        <div className="card p-6">
          <label className="label">Select Session</label>
          <select className="input max-w-md" value={selectedSession} onChange={(e) => setSelectedSession(e.target.value)}>
            <option value="">Choose a session...</option>
            {sessions.map((s: any) => <option key={s.id} value={s.id}>{s.title} — {formatDate(s.scheduledAt)}</option>)}
          </select>
        </div>

        {selectedSession && (
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">Attendance List</h2>
            <DataTable columns={columns} data={records} loading={isLoading} emptyMessage="No attendance records for this session." />
          </div>
        )}

        {low.length > 0 && (
          <div className="card p-6">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h2 className="text-base font-semibold">Low Attendance ({low.length})</h2>
            </div>
            <div className="space-y-2">
              {low.map((s: any) => (
                <div key={s.student.id} className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/40 rounded-lg">
                  <div><p className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.student.firstName} {s.student.lastName}</p></div>
                  <Badge variant="orange">{s.attendanceRate}%</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

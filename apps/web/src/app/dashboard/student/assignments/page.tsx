'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { assessmentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Upload } from 'lucide-react';

export default function StudentAssignmentsPage() {
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['submissions', 'my'],
    queryFn: () => assessmentsApi.mySubmissions() as any,
  });

  const submit = useMutation({
    mutationFn: ({ id, content }: { id: string; content: string }) => assessmentsApi.submit(id, { content }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['submissions'] }); setSubmitting(null); setContent(''); },
  });

  const submissions: any[] = (data as any)?.data ?? [];

  const columns = [
    { key: 'assessment', header: 'Assignment', render: (r: any) => <span className="font-medium">{r.assessment?.title}</span> },
    { key: 'type', header: 'Type', render: (r: any) => <Badge variant="blue">{r.assessment?.type}</Badge> },
    { key: 'dueDate', header: 'Due Date', render: (r: any) => r.assessment?.dueDate ? formatDate(r.assessment.dueDate) : '—' },
    { key: 'score', header: 'Score', render: (r: any) => r.score !== null ? `${r.score}/${r.assessment?.maxScore}` : '—' },
    { key: 'status', header: 'Status', render: (r: any) => <Badge variant={r.score !== null ? 'green' : 'orange'}>{r.score !== null ? 'Graded' : 'Submitted'}</Badge> },
    { key: 'feedback', header: 'Feedback', render: (r: any) => <span className="text-xs text-gray-500 line-clamp-1">{r.feedback ?? '—'}</span> },
  ];

  return (
    <div>
      <Topbar title="My Assignments" />
      <div className="p-6">
        <PageHeader title="Assignments & Submissions" />
        <div className="card p-6">
          <DataTable columns={columns} data={submissions} loading={isLoading} emptyMessage="No assignments submitted yet." />
        </div>
      </div>

      <Modal open={!!submitting} onClose={() => setSubmitting(null)} title="Submit Assignment">
        <div className="space-y-4">
          <div><label className="label">Your Answer / Notes</label><textarea className="input min-h-[120px]" value={content} onChange={(e) => setContent(e.target.value)} placeholder="Type your response here..." /></div>
          <button onClick={() => submit.mutate({ id: submitting!, content })} disabled={submit.isPending} className="btn-primary w-full flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />{submit.isPending ? 'Submitting...' : 'Submit'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

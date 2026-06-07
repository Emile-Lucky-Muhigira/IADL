'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { auditApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';

const actionVariant: Record<string, any> = { POST: 'green', PATCH: 'blue', PUT: 'blue', DELETE: 'red' };

export default function AuditPage() {
  const [page, setPage] = useState(1);
  const [resource, setResource] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit', page, resource],
    queryFn: () => auditApi.list({ page, limit: 20, resource: resource || undefined }) as any,
  });

  const logs: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};

  const columns = [
    { key: 'createdAt', header: 'When', render: (r: any) => formatDate(r.createdAt) },
    { key: 'actor', header: 'User', render: (r: any) => r.actor ? <span className="font-medium">{r.actor.firstName} {r.actor.lastName}</span> : <span className="text-gray-400">—</span> },
    { key: 'action', header: 'Action', render: (r: any) => <Badge variant={actionVariant[r.action] ?? 'gray'}>{r.action}</Badge> },
    { key: 'resource', header: 'Resource', render: (r: any) => <span className="capitalize">{r.resource}</span> },
    { key: 'resourceId', header: 'Record', render: (r: any) => r.resourceId ? <span className="text-xs font-mono text-gray-500">{r.resourceId}</span> : '—' },
    { key: 'ipAddress', header: 'IP', render: (r: any) => <span className="text-xs text-gray-500">{r.ipAddress ?? '—'}</span> },
  ];

  return (
    <div>
      <Topbar title="Audit Trail" />
      <div className="p-6">
        <PageHeader title="Audit Trail" description="A read-only record of every change made in the system." />
        <div className="flex gap-3 mb-4">
          <select className="input sm:w-56" value={resource} onChange={(e) => { setResource(e.target.value); setPage(1); }}>
            <option value="">All resources</option>
            {['users', 'tenants', 'courses', 'enrollments', 'sessions', 'attendance', 'assessments', 'finance', 'certificates', 'messages'].map((r) => (
              <option key={r} value={r} className="capitalize">{r}</option>
            ))}
          </select>
        </div>
        <div className="card p-6">
          <DataTable columns={columns} data={logs} loading={isLoading} emptyMessage="No audit entries yet." />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

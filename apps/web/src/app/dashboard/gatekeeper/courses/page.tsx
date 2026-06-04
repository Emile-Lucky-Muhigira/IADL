'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';

export default function GatekeeperCoursesPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['courses', page],
    queryFn: () => api.get(`/courses?page=${page}&limit=20`) as any,
  });

  const courses: any[] = (data as any)?.data?.data ?? [];
  const meta = (data as any)?.data?.meta ?? {};

  const columns = [
    { key: 'title', header: 'Course Title', render: (r: any) => <span className="font-medium">{r.title}</span> },
    { key: 'trainers', header: 'Trainers', render: (r: any) => r.trainers?.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ') || '—' },
    { key: 'price', header: 'Fee', render: (r: any) => formatCurrency(Number(r.price)) },
    { key: 'duration', header: 'Duration', render: (r: any) => `${r.duration}h` },
    { key: 'enrollments', header: 'Students', render: (r: any) => r._count?.enrollments ?? 0 },
    { key: 'isActive', header: 'Status', render: (r: any) => <Badge variant={r.isActive ? 'green' : 'red'}>{r.isActive ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <div>
      <Topbar title="Courses" />
      <div className="p-6">
        <PageHeader title="Branch Courses" description="All courses offered by your school" />
        <div className="card p-6">
          <DataTable columns={columns} data={courses} loading={isLoading} />
          <Pagination page={page} totalPages={meta.totalPages ?? 1} onPageChange={setPage} />
        </div>
      </div>
    </div>
  );
}

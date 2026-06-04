'use client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { analyticsApi } from '@/lib/api';
import { GraduationCap, BookOpen, TrendingUp } from 'lucide-react';

export default function ParentChildrenPage() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['parent', 'children', userId],
    queryFn: () => import('@/lib/api').then(({ api }) => api.get(`/users/${userId}/children`)) as any,
    enabled: !!userId,
  });

  const children: any[] = (data as any)?.data ?? [];

  return (
    <div>
      <Topbar title="My Children" />
      <div className="p-6">
        <PageHeader title="Children & Progress" description="Track your children's academic journey" />
        {isLoading ? (
          <div className="space-y-4">{Array.from({ length: 2 }).map((_, i) => <div key={i} className="card h-48 animate-pulse bg-gray-100" />)}</div>
        ) : (
          <div className="space-y-4">
            {children.map((rel: any) => {
              const child = rel.student;
              return (
                <div key={child?.id} className="card p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-brand-100 rounded-2xl flex items-center justify-center text-brand-700 text-xl font-bold">
                      {child?.firstName?.[0]}{child?.lastName?.[0]}
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">{child?.firstName} {child?.lastName}</h2>
                      <p className="text-sm text-gray-500">{child?.email}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Enrolled Courses</h3>
                    <div className="flex flex-wrap gap-2">
                      {child?.enrollments?.map((e: any) => (
                        <Badge key={e.id} variant={e.status === 'ACTIVE' ? 'green' : 'gray'}>{e.course?.title}</Badge>
                      ))}
                      {(!child?.enrollments || child.enrollments.length === 0) && <span className="text-sm text-gray-400">No active enrollments</span>}
                    </div>
                  </div>
                  <div className="mt-4 flex gap-3">
                    <a href={`/dashboard/parent/attendance?studentId=${child?.id}`} className="btn-secondary text-sm flex items-center gap-1"><TrendingUp className="w-3 h-3" />Attendance</a>
                    <a href={`/dashboard/parent/payments?studentId=${child?.id}`} className="btn-secondary text-sm flex items-center gap-1"><BookOpen className="w-3 h-3" />Payments</a>
                  </div>
                </div>
              );
            })}
            {children.length === 0 && <div className="card p-10 text-center text-gray-400"><GraduationCap className="w-12 h-12 mx-auto mb-2" /><p>No children linked to your account.</p></div>}
          </div>
        )}
      </div>
    </div>
  );
}

'use client';
import { useQuery } from '@tanstack/react-query';
import { enrollmentsApi } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { BookOpen, Clock } from 'lucide-react';

export default function StudentCoursesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.myEnrollments() as any,
  });

  const enrollments: any[] = (data as any)?.data ?? [];

  return (
    <div>
      <Topbar title="My Courses" />
      <div className="p-6">
        <PageHeader title="Enrolled Courses" description={`${enrollments.length} courses`} />
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {enrollments.map((e: any) => {
              const course = e.course;
              return (
                <div key={e.id} className="card p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                      <BookOpen className="w-5 h-5 text-brand-600" />
                    </div>
                    <Badge variant={e.status === 'ACTIVE' ? 'green' : e.status === 'COMPLETED' ? 'blue' : 'gray'}>{e.status}</Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{course?.title}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{course?.description}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{course?.duration}h</div>
                    <span className="font-medium text-brand-600">{formatCurrency(Number(course?.price))}</span>
                  </div>
                  {course?.trainers?.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2">Trainer: {course.trainers.map((t: any) => `${t.firstName} ${t.lastName}`).join(', ')}</p>
                  )}
                </div>
              );
            })}
            {enrollments.length === 0 && <p className="text-gray-400 col-span-3 py-10 text-center">Not enrolled in any courses yet.</p>}
          </div>
        )}
      </div>
    </div>
  );
}

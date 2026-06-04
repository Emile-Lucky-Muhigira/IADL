'use client';
import { useQuery } from '@tanstack/react-query';
import { coursesApi, sessionsApi } from '@/lib/api';
import { Topbar } from '@/components/layout/topbar';
import { BookOpen, CalendarDays, Users } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';
import { formatDate } from '@/lib/utils';

export default function TrainerDashboard() {
  const { data: coursesData } = useQuery({
    queryKey: ['courses', 'trainer'],
    queryFn: () => coursesApi.list() as any,
  });
  const { data: sessionsData } = useQuery({
    queryKey: ['sessions', 'upcoming'],
    queryFn: () => sessionsApi.branch(true) as any,
  });

  const courses: any[] = (coursesData as any)?.data?.data ?? [];
  const upcomingSessions: any[] = (sessionsData as any)?.data?.data ?? [];

  return (
    <div>
      <Topbar title="Trainer Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard title="My Courses" value={courses.length} icon={BookOpen} color="blue" />
          <StatCard title="Upcoming Sessions" value={upcomingSessions.length} icon={CalendarDays} color="orange" />
          <StatCard
            title="Total Students"
            value={courses.reduce((a: number, c: any) => a + (c._count?.enrollments ?? 0), 0)}
            icon={Users}
            color="green"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">Upcoming Sessions</h2>
            <div className="space-y-3">
              {upcomingSessions.slice(0, 5).map((s: any) => (
                <div key={s.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-xs text-gray-500">{s.course?.title}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-brand-600 font-medium">{formatDate(s.scheduledAt)}</p>
                    <p className="text-xs text-gray-400">{s.duration} min</p>
                  </div>
                </div>
              ))}
              {upcomingSessions.length === 0 && <p className="text-sm text-gray-400">No upcoming sessions</p>}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">My Courses</h2>
            <div className="space-y-3">
              {courses.slice(0, 5).map((c: any) => (
                <div key={c.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="text-xs text-gray-500">{c.duration}h course</p>
                  </div>
                  <span className="badge bg-blue-100 text-blue-700">{c._count?.enrollments ?? 0} students</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

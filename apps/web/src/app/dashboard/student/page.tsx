'use client';
import { useQuery } from '@tanstack/react-query';
import { analyticsApi, enrollmentsApi, certificatesApi } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { BookOpen, Award, TrendingUp, CheckSquare } from 'lucide-react';

export default function StudentDashboard() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const { data: progressData } = useQuery({
    queryKey: ['analytics', 'student', userId],
    queryFn: () => analyticsApi.student(userId) as any,
    enabled: !!userId,
  });

  const { data: enrollmentsData } = useQuery({
    queryKey: ['enrollments', 'my'],
    queryFn: () => enrollmentsApi.myEnrollments() as any,
  });

  const { data: certsData } = useQuery({
    queryKey: ['certificates', 'my'],
    queryFn: () => certificatesApi.mine() as any,
  });

  const progress = (progressData as any)?.data ?? {};
  const enrollments: any[] = (enrollmentsData as any)?.data ?? [];
  const certs: any[] = (certsData as any)?.data ?? [];

  return (
    <div>
      <Topbar title="My Learning Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Enrolled Courses" value={progress.totalCourses ?? enrollments.length} icon={BookOpen} color="blue" />
          <StatCard title="Completed" value={progress.completedCourses ?? 0} icon={CheckSquare} color="green" />
          <StatCard title="Attendance" value={`${progress.attendanceRate ?? 0}%`} icon={TrendingUp} color="orange" />
          <StatCard title="Certificates" value={progress.certificates ?? certs.length} icon={Award} color="purple" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">My Courses</h2>
            <div className="space-y-3">
              {enrollments.map((e: any) => (
                <div key={e.id} className="p-3 border border-gray-100 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{e.course?.title}</p>
                    <span className={`badge ${e.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {e.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{e.course?.duration}h course</p>
                </div>
              ))}
              {enrollments.length === 0 && <p className="text-sm text-gray-400">No enrollments yet</p>}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-base font-semibold mb-4">My Certificates</h2>
            <div className="space-y-3">
              {certs.map((c: any) => (
                <div key={c.id} className="flex items-center gap-3 p-3 border border-gray-100 rounded-lg">
                  <Award className="w-8 h-8 text-yellow-500" />
                  <div>
                    <p className="text-sm font-medium">{c.course?.title}</p>
                    <p className="text-xs text-gray-500">Code: {c.uniqueCode}</p>
                  </div>
                </div>
              ))}
              {certs.length === 0 && <p className="text-sm text-gray-400">No certificates yet. Complete a course to earn one!</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

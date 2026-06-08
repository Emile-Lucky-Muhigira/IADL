'use client';
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Topbar } from '@/components/layout/topbar';
import { Badge } from '@/components/ui/badge';
import { sessionsApi, attendanceManageApi, enrollmentsApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import {
  ChevronLeft, CheckCircle, XCircle, Clock, AlertCircle,
  CheckSquare, Users, Save,
} from 'lucide-react';

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

const statusConfig: Record<AttendanceStatus, { label: string; variant: any; icon: any; color: string }> = {
  PRESENT: { label: 'Present', variant: 'green', icon: CheckCircle, color: 'text-green-600' },
  ABSENT: { label: 'Absent', variant: 'red', icon: XCircle, color: 'text-red-600' },
  LATE: { label: 'Late', variant: 'orange', icon: Clock, color: 'text-orange-500' },
  EXCUSED: { label: 'Excused', variant: 'blue', icon: AlertCircle, color: 'text-blue-500' },
};

export default function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [saved, setSaved] = useState(false);

  const { data: sessionData, isLoading: sessionLoading } = useQuery({
    queryKey: ['session', id],
    queryFn: () => sessionsApi.get(id) as any,
    enabled: !!id,
  });

  const { data: enrolledData, isLoading: enrolledLoading } = useQuery({
    queryKey: ['enrollments', 'course', sessionData?.data?.courseId],
    queryFn: () => enrollmentsApi.byCourse(sessionData.data.courseId) as any,
    enabled: !!(sessionData as any)?.data?.courseId,
  });

  const { data: existingData } = useQuery({
    queryKey: ['attendance', 'session', id],
    queryFn: () => attendanceManageApi.bySession(id) as any,
    enabled: !!id,
  });

  // Pre-populate from already-saved attendance records
  useEffect(() => {
    const records: any[] = (existingData as any)?.data ?? [];
    if (records.length === 0) return;
    const seeded: Record<string, AttendanceStatus> = {};
    records.forEach((r: any) => { seeded[r.userId] = r.status as AttendanceStatus; });
    setAttendance(seeded);
  }, [existingData]);

  const bulkMark = useMutation({
    mutationFn: (records: { userId: string; status: string }[]) =>
      attendanceManageApi.bulkMark(id, records),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['attendance'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    },
  });

  const session = (sessionData as any)?.data;
  const enrolled: any[] = (enrolledData as any)?.data?.data ?? [];

  const setStatus = (userId: string, status: AttendanceStatus) => {
    setAttendance((prev) => ({ ...prev, [userId]: status }));
    setSaved(false);
  };

  const markAll = (status: AttendanceStatus) => {
    const all: Record<string, AttendanceStatus> = {};
    enrolled.forEach((e: any) => { all[e.userId] = status; });
    setAttendance(all);
    setSaved(false);
  };

  const saveAttendance = () => {
    const records = Object.entries(attendance).map(([userId, status]) => ({ userId, status }));
    if (records.length === 0) return;
    bulkMark.mutate(records);
  };

  const stats = {
    present: Object.values(attendance).filter((s) => s === 'PRESENT').length,
    absent: Object.values(attendance).filter((s) => s === 'ABSENT').length,
    late: Object.values(attendance).filter((s) => s === 'LATE').length,
    excused: Object.values(attendance).filter((s) => s === 'EXCUSED').length,
    unmarked: enrolled.length - Object.keys(attendance).length,
  };

  if (sessionLoading) {
    return (
      <div>
        <Topbar title="Session" />
        <div className="p-6">
          <div className="card h-64 animate-pulse bg-gray-100" />
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div>
        <Topbar title="Session" />
        <div className="p-6">
          <div className="card p-10 text-center text-gray-400">Session not found.</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Topbar title="Mark Attendance" />
      <div className="p-6 space-y-5 max-w-4xl">

        {/* Back + session info */}
        <div>
          <button onClick={() => router.back()} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ChevronLeft className="w-4 h-4" /> Back to Sessions
          </button>
          <div className="card p-5">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-900">{session.title}</h2>
                <p className="text-sm text-gray-500">{session.course?.title}</p>
              </div>
              <Badge variant={session.isLive ? 'blue' : 'gray'}>
                {session.isLive ? 'Live Session' : 'Recorded'}
              </Badge>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
              <span>📅 {formatDate(session.scheduledAt)}</span>
              <span>⏱ {session.duration} min</span>
              {session.meetingUrl && (
                <a href={session.meetingUrl} target="_blank" className="text-brand-600 hover:underline">
                  🔗 Join Meeting
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Stats summary */}
        <div className="grid grid-cols-5 gap-3">
          {[
            { label: 'Present', count: stats.present, color: 'text-green-600 bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800' },
            { label: 'Absent', count: stats.absent, color: 'text-red-600 bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800' },
            { label: 'Late', count: stats.late, color: 'text-orange-600 bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800' },
            { label: 'Excused', count: stats.excused, color: 'text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800' },
            { label: 'Unmarked', count: stats.unmarked, color: 'text-gray-600 bg-gray-50 border-gray-200 dark:bg-gray-800/40 dark:border-gray-700' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-3 text-center ${s.color}`}>
              <p className="text-2xl font-bold">{s.count}</p>
              <p className="text-xs font-medium">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Bulk actions */}
        <div className="card p-4 flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-600 flex items-center gap-1.5">
            <Users className="w-4 h-4" /> Mark all as:
          </span>
          {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
            const cfg = statusConfig[status];
            const Icon = cfg.icon;
            return (
              <button
                key={status}
                onClick={() => markAll(status)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border font-medium transition-colors ${cfg.color} bg-white hover:bg-gray-50 border-gray-200`}
              >
                <Icon className="w-3.5 h-3.5" /> {cfg.label}
              </button>
            );
          })}
        </div>

        {/* Student list */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-200 bg-gray-50">
            <p className="text-sm font-medium text-gray-700">
              {enrolled.length} enrolled student{enrolled.length !== 1 ? 's' : ''}
            </p>
          </div>

          {enrolledLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : enrolled.length === 0 ? (
            <div className="p-10 text-center text-gray-400">No students enrolled in this course.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {enrolled.map((e: any) => {
                const student = e.user;
                const currentStatus = attendance[e.userId];

                return (
                  <div key={e.userId} className="flex items-center justify-between px-5 py-3 hover:bg-gray-50">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm flex-shrink-0">
                        {student?.firstName?.[0]}{student?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {student?.firstName} {student?.lastName}
                        </p>
                        <p className="text-xs text-gray-500">{student?.email}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {(Object.keys(statusConfig) as AttendanceStatus[]).map((status) => {
                        const cfg = statusConfig[status];
                        const Icon = cfg.icon;
                        const isActive = currentStatus === status;
                        return (
                          <button
                            key={status}
                            onClick={() => setStatus(e.userId, status)}
                            title={cfg.label}
                            className={`w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
                              isActive
                                ? `${cfg.color} border-current bg-current/10`
                                : 'text-gray-300 border-gray-200 hover:border-gray-400 hover:text-gray-500'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Save button */}
        <div className="flex items-center gap-4 sticky bottom-4">
          <button
            onClick={saveAttendance}
            disabled={bulkMark.isPending || Object.keys(attendance).length === 0}
            className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg"
          >
            <Save className="w-4 h-4" />
            {bulkMark.isPending ? 'Saving...' : 'Save Attendance'}
          </button>
          {saved && (
            <div className="flex items-center gap-2 text-green-600 bg-green-50 border border-green-200 px-4 py-2.5 rounded-lg text-sm font-medium">
              <CheckSquare className="w-4 h-4" /> Attendance saved successfully!
            </div>
          )}
          {bulkMark.isError && (
            <p className="text-red-600 text-sm">Failed to save. Please try again.</p>
          )}
        </div>
      </div>
    </div>
  );
}

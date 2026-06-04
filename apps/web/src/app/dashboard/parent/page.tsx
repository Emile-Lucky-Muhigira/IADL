'use client';
import { useQuery } from '@tanstack/react-query';
import { usersApi, financeApi } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { StatCard } from '@/components/ui/stat-card';
import { Users, DollarSign, TrendingUp, BookOpen } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export default function ParentDashboard() {
  const { data: session } = useSession();
  const userId = (session?.user as any)?.id;

  const { data: childrenData } = useQuery({
    queryKey: ['parent', 'children', userId],
    queryFn: () => usersApi.get(`${userId}/children`) as any,
    enabled: !!userId,
  });

  const children: any[] = (childrenData as any)?.data ?? [];
  const firstChild = children[0]?.student;

  const { data: ledgerData } = useQuery({
    queryKey: ['finance', 'student', firstChild?.id],
    queryFn: () => financeApi.studentLedger(firstChild.id) as any,
    enabled: !!firstChild?.id,
  });

  const balance = (ledgerData as any)?.data?.currentBalance ?? 0;

  return (
    <div>
      <Topbar title="Parent / Guardian Dashboard" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Children" value={children.length} icon={Users} color="blue" />
          <StatCard
            title="Enrolled Courses"
            value={children.reduce((a: number, c: any) => a + (c.student?.enrollments?.length ?? 0), 0)}
            icon={BookOpen}
            color="orange"
          />
          <StatCard title="Outstanding Balance" value={formatCurrency(balance)} icon={DollarSign} color={balance > 0 ? 'red' : 'green'} />
          <StatCard title="Alerts" value={0} icon={TrendingUp} color="purple" />
        </div>

        <div className="card p-6">
          <h2 className="text-base font-semibold mb-4">My Children</h2>
          <div className="space-y-4">
            {children.map((rel: any) => {
              const child = rel.student;
              return (
                <div key={child?.id} className="p-4 border border-gray-200 rounded-xl">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-700 font-bold text-sm">
                      {child?.firstName?.[0]}{child?.lastName?.[0]}
                    </div>
                    <div>
                      <p className="font-medium">{child?.firstName} {child?.lastName}</p>
                      <p className="text-xs text-gray-500">{child?.email}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {child?.enrollments?.map((e: any) => (
                      <span key={e.id} className="badge bg-blue-100 text-blue-700">{e.course?.title}</span>
                    ))}
                  </div>
                </div>
              );
            })}
            {children.length === 0 && <p className="text-sm text-gray-400">No children linked to your account yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}

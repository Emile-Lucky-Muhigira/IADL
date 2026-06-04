'use client';
import { useQuery } from '@tanstack/react-query';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { certificatesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Award, Download } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

export default function StudentCertificatesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['certificates', 'my'],
    queryFn: () => certificatesApi.mine() as any,
  });

  const certs: any[] = (data as any)?.data ?? [];

  return (
    <div>
      <Topbar title="My Certificates" />
      <div className="p-6">
        <PageHeader title="Earned Certificates" description="Your digital certificates from completed courses" />
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, i) => <div key={i} className="card h-40 animate-pulse bg-gray-100" />)}
          </div>
        ) : certs.length === 0 ? (
          <div className="card p-8">
            <EmptyState icon={Award} title="No certificates yet" description="Complete a course to earn your digital certificate." />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {certs.map((c: any) => (
              <div key={c.id} className="card p-6 border-2 border-brand-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -translate-y-16 translate-x-16" />
                <Award className="w-10 h-10 text-brand-600 mb-3" />
                <h3 className="font-bold text-gray-900 mb-1">{c.course?.title}</h3>
                <p className="text-xs text-gray-500 mb-3">Issued: {formatDate(c.issuedAt)}</p>
                <p className="text-xs text-brand-600 font-mono bg-brand-50 px-2 py-1 rounded mb-3">{c.uniqueCode}</p>
                <p className="text-xs text-gray-400">
                  Verify at: <span className="text-brand-600">/certificates/verify/{c.uniqueCode}</span>
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

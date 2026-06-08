'use client';
import { useQuery } from '@tanstack/react-query';
import { useSession } from 'next-auth/react';
import { Topbar } from '@/components/layout/topbar';
import { PageHeader } from '@/components/ui/page-header';
import { certificatesApi } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Award, Download } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { downloadCertificatePdf } from '@/lib/certificate-pdf';

export default function StudentCertificatesPage() {
  const { data: session } = useSession();
  const { data, isLoading } = useQuery({
    queryKey: ['certificates', 'my'],
    queryFn: () => certificatesApi.mine() as any,
  });

  const certs: any[] = (data as any)?.data ?? [];

  const studentName =
    (session?.user as any)?.name ||
    [(session?.user as any)?.firstName, (session?.user as any)?.lastName].filter(Boolean).join(' ') ||
    'Student';

  const handleDownload = (c: any) => {
    downloadCertificatePdf({
      studentName:
        [c.user?.firstName, c.user?.lastName].filter(Boolean).join(' ') || studentName,
      courseTitle: c.course?.title || 'Course',
      issuedAt: c.issuedAt,
      uniqueCode: c.uniqueCode,
      schoolName: c.tenant?.name,
    });
  };

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
                <p className="text-xs text-gray-400 mb-4">
                  Verify at: <span className="text-brand-600">/certificates/verify/{c.uniqueCode}</span>
                </p>
                <button
                  onClick={() => handleDownload(c)}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Certificate
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

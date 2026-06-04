import { Award, CheckCircle, XCircle, CalendarDays, User } from 'lucide-react';

interface Props { params: { code: string } }

async function fetchCert(code: string) {
  const apiUrl = process.env.API_URL ?? 'http://localhost:3001/api/v1';
  try {
    const res = await fetch(`${apiUrl}/certificates/verify/${code}`, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

export default async function CertificateVerifyPage({ params }: Props) {
  const cert = await fetchCert(params.code);

  return (
    <div className="min-h-screen bg-brand-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 text-center">
        {!cert ? (
          <>
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <XCircle className="w-9 h-9 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-gray-900 mb-2">Certificate Not Found</h1>
            <p className="text-gray-500 text-sm mb-4">
              The certificate code{' '}
              <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">{params.code}</code>{' '}
              is invalid or does not exist.
            </p>
            <a href="/" className="text-brand-600 hover:underline text-sm">← Return to platform</a>
          </>
        ) : (
          <>
            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-9 h-9 text-green-500" />
            </div>
            <p className="text-green-600 font-semibold text-sm mb-1">Verified Certificate</p>
            <h1 className="text-xl font-bold text-gray-900 mb-6">This is an authentic IADL certificate.</h1>

            <div className="bg-brand-50 border border-brand-200 rounded-xl p-5 text-left space-y-4">
              <div className="flex items-center gap-3">
                <Award className="w-9 h-9 text-brand-600 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Course</p>
                  <p className="font-bold text-gray-900">{cert.course?.title}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Awarded to</p>
                  <p className="font-semibold text-gray-900">{cert.user?.firstName} {cert.user?.lastName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-gray-400 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Issue Date</p>
                  <p className="font-semibold text-gray-900">
                    {new Intl.DateTimeFormat('en-KE', { dateStyle: 'long' }).format(new Date(cert.issuedAt))}
                  </p>
                </div>
              </div>
              <div className="pt-2 border-t border-brand-200">
                <p className="text-xs text-gray-400">Certificate ID</p>
                <p className="font-mono text-xs text-brand-700 break-all mt-0.5">{params.code}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mt-6">
              IADL Center — Angaza Center &copy; {new Date().getFullYear()}
            </p>
          </>
        )}
      </div>
    </div>
  );
}

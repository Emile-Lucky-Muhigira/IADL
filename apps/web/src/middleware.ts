import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const ALL_ROLES = [
  'SUPER_ADMIN', 'ADL_ADMIN', 'SCHOOL_GATEKEEPER',
  'TRAINER', 'STUDENT', 'PARENT', 'ACCOUNTANT', 'SYSTEM_AUDITOR',
];

const ROLE_PATHS: Record<string, string[]> = {
  '/dashboard/notifications': ALL_ROLES,
  '/dashboard/super-admin':   ['SUPER_ADMIN'],
  '/dashboard/adl-admin':     ['SUPER_ADMIN', 'ADL_ADMIN'],
  '/dashboard/gatekeeper':    ['SUPER_ADMIN', 'ADL_ADMIN', 'SCHOOL_GATEKEEPER'],
  '/dashboard/trainer':       ['SUPER_ADMIN', 'ADL_ADMIN', 'SCHOOL_GATEKEEPER', 'TRAINER'],
  '/dashboard/student':       ['STUDENT'],
  '/dashboard/parent':        ['PARENT'],
  '/dashboard/finance':       ['SUPER_ADMIN', 'ADL_ADMIN', 'SCHOOL_GATEKEEPER', 'ACCOUNTANT'],
  '/dashboard/auditor':       ['SUPER_ADMIN', 'ADL_ADMIN', 'SYSTEM_AUDITOR'],
};

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;
    const role = (token as any)?.role;

    for (const [path, allowedRoles] of Object.entries(ROLE_PATHS)) {
      if (pathname.startsWith(path) && !allowedRoles.includes(role)) {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    return NextResponse.next();
  },
  { callbacks: { authorized: ({ token }) => !!token } },
);

export const config = { matcher: ['/dashboard/:path*'] };

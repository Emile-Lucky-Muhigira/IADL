import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = 'KES') {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency, minimumFractionDigits: 0 }).format(amount);
}

export function formatDate(date: string | Date) {
  try {
    return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function formatDateShort(date: string | Date) {
  try {
    return new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(date));
  } catch {
    return String(date);
  }
}

export function getInitials(firstName: string, lastName?: string) {
  const a = firstName?.[0] ?? '';
  const b = lastName?.[0] ?? '';
  return (a + b).toUpperCase() || 'U';
}

export function getRoleBadgeColor(role: string) {
  const colors: Record<string, string> = {
    SUPER_ADMIN:      'bg-red-100    dark:bg-red-900/40    text-red-800    dark:text-red-300',
    ADL_ADMIN:        'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300',
    SCHOOL_GATEKEEPER:'bg-blue-100   dark:bg-blue-900/40   text-blue-800   dark:text-blue-300',
    TRAINER:          'bg-green-100  dark:bg-green-900/40  text-green-800  dark:text-green-300',
    STUDENT:          'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-300',
    PARENT:           'bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300',
    ACCOUNTANT:       'bg-brand-100  dark:bg-brand-900/40  text-brand-800  dark:text-brand-300',
    SYSTEM_AUDITOR:   'bg-gray-100   dark:bg-gray-800      text-gray-800   dark:text-gray-300',
  };
  return colors[role] ?? 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300';
}

export function getRoleLabel(role: string) {
  const labels: Record<string, string> = {
    SUPER_ADMIN:       'Super Admin',
    ADL_ADMIN:         'ADL Admin',
    SCHOOL_GATEKEEPER: 'School Gatekeeper',
    TRAINER:           'Trainer',
    STUDENT:           'Student',
    PARENT:            'Parent / Guardian',
    ACCOUNTANT:        'Finance Officer',
    SYSTEM_AUDITOR:    'System Auditor',
  };
  return labels[role] ?? role.replace(/_/g, ' ');
}

/** Export an array of flat objects to a downloaded CSV file (client-side). */
export function exportToCsv(filename: string, rows: Record<string, any>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => {
    const s = v == null ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => escape(r[h])).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function getDashboardPath(role: string) {
  const paths: Record<string, string> = {
    SUPER_ADMIN:       '/dashboard/super-admin',
    ADL_ADMIN:         '/dashboard/adl-admin',
    SCHOOL_GATEKEEPER: '/dashboard/gatekeeper',
    TRAINER:           '/dashboard/trainer',
    STUDENT:           '/dashboard/student',
    PARENT:            '/dashboard/parent',
    ACCOUNTANT:        '/dashboard/finance',
    SYSTEM_AUDITOR:    '/dashboard/auditor',
  };
  return paths[role] ?? '/dashboard/super-admin';
}

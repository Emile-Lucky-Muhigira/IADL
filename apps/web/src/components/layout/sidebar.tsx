'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { cn, getInitials, getRoleLabel } from '@/lib/utils';
import {
  LayoutDashboard, Users, BookOpen, ClipboardList, BarChart3,
  DollarSign, Award, Bell, MessageSquare, LogOut, GraduationCap,
  Building2, CalendarDays, CheckSquare, UserCheck,
} from 'lucide-react';

interface NavItem { label: string; href: string; icon: React.ElementType }

const navByRole: Record<string, NavItem[]> = {
  SUPER_ADMIN: [
    { label: 'Dashboard',  href: '/dashboard/super-admin',            icon: LayoutDashboard },
    { label: 'Schools',    href: '/dashboard/super-admin/schools',     icon: Building2 },
    { label: 'Users',      href: '/dashboard/super-admin/users',       icon: Users },
    { label: 'Analytics',  href: '/dashboard/super-admin/analytics',   icon: BarChart3 },
  ],
  ADL_ADMIN: [
    { label: 'Dashboard',    href: '/dashboard/adl-admin',              icon: LayoutDashboard },
    { label: 'Schools',      href: '/dashboard/adl-admin/schools',       icon: Building2 },
    { label: 'Users',        href: '/dashboard/adl-admin/users',         icon: Users },
    { label: 'Courses',      href: '/dashboard/adl-admin/courses',       icon: BookOpen },
    { label: 'Finance',      href: '/dashboard/adl-admin/finance',       icon: DollarSign },
    { label: 'Certificates', href: '/dashboard/adl-admin/certificates',  icon: Award },
    { label: 'Analytics',    href: '/dashboard/adl-admin/analytics',     icon: BarChart3 },
  ],
  SCHOOL_GATEKEEPER: [
    { label: 'Dashboard',  href: '/dashboard/gatekeeper',               icon: LayoutDashboard },
    { label: 'Students',   href: '/dashboard/gatekeeper/students',      icon: GraduationCap },
    { label: 'Trainers',   href: '/dashboard/gatekeeper/trainers',      icon: UserCheck },
    { label: 'Courses',    href: '/dashboard/gatekeeper/courses',       icon: BookOpen },
    { label: 'Attendance', href: '/dashboard/gatekeeper/attendance',    icon: ClipboardList },
    { label: 'Finance',    href: '/dashboard/gatekeeper/finance',       icon: DollarSign },
    { label: 'Messages',   href: '/dashboard/gatekeeper/messages',      icon: MessageSquare },
  ],
  TRAINER: [
    { label: 'Dashboard',    href: '/dashboard/trainer',                icon: LayoutDashboard },
    { label: 'My Courses',   href: '/dashboard/trainer/courses',        icon: BookOpen },
    { label: 'Sessions',     href: '/dashboard/trainer/sessions',       icon: CalendarDays },
    { label: 'Attendance',   href: '/dashboard/trainer/attendance',     icon: ClipboardList },
    { label: 'Assessments',  href: '/dashboard/trainer/assessments',    icon: CheckSquare },
    { label: 'Messages',     href: '/dashboard/trainer/messages',       icon: MessageSquare },
  ],
  STUDENT: [
    { label: 'Dashboard',    href: '/dashboard/student',                icon: LayoutDashboard },
    { label: 'My Courses',   href: '/dashboard/student/courses',        icon: BookOpen },
    { label: 'Assignments',  href: '/dashboard/student/assignments',    icon: CheckSquare },
    { label: 'Attendance',   href: '/dashboard/student/attendance',     icon: ClipboardList },
    { label: 'Certificates', href: '/dashboard/student/certificates',   icon: Award },
    { label: 'Messages',     href: '/dashboard/student/messages',       icon: MessageSquare },
  ],
  PARENT: [
    { label: 'Dashboard',  href: '/dashboard/parent',                   icon: LayoutDashboard },
    { label: 'Children',   href: '/dashboard/parent/children',          icon: Users },
    { label: 'Attendance', href: '/dashboard/parent/attendance',        icon: ClipboardList },
    { label: 'Payments',   href: '/dashboard/parent/payments',          icon: DollarSign },
    { label: 'Messages',   href: '/dashboard/parent/messages',          icon: MessageSquare },
  ],
  ACCOUNTANT: [
    { label: 'Dashboard',     href: '/dashboard/finance',               icon: LayoutDashboard },
    { label: 'Ledger',        href: '/dashboard/finance/ledger',        icon: DollarSign },
    { label: 'Outstanding',   href: '/dashboard/finance/outstanding',   icon: Users },
    { label: 'Reports',       href: '/dashboard/finance/reports',       icon: BarChart3 },
  ],
  SYSTEM_AUDITOR: [
    { label: 'Dashboard',  href: '/dashboard/auditor',                  icon: LayoutDashboard },
    { label: 'Attendance', href: '/dashboard/auditor/attendance',       icon: ClipboardList },
    { label: 'Finance',    href: '/dashboard/auditor/finance',          icon: DollarSign },
    { label: 'Analytics',  href: '/dashboard/auditor/analytics',        icon: BarChart3 },
  ],
};

export function Sidebar() {
  const { data: session } = useSession();
  const pathname  = usePathname();
  const role      = (session?.user as any)?.role ?? '';
  const user      = session?.user as any;
  const navItems  = navByRole[role] ?? [];

  return (
    <aside className="flex flex-col w-64 flex-shrink-0 bg-brand-900 dark:bg-gray-900 h-full border-r border-brand-800 dark:border-gray-700">

      {/* Logo */}
      <div className="px-5 py-5 border-b border-brand-800 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white dark:bg-brand-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <span className="text-brand-700 dark:text-white font-bold text-sm select-none">AC</span>
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">IADL Center</p>
            <p className="text-brand-300 dark:text-gray-400 text-xs">EMIS Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon   = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'sidebar-item',
                active ? 'sidebar-item-active' : 'sidebar-item-inactive',
              )}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* User + Sign out */}
      <div className="px-3 py-4 border-t border-brand-800 dark:border-gray-700 space-y-2">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-brand-600 dark:bg-brand-700 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user ? getInitials(
              user.name?.split(' ')[0] ?? 'U',
              user.name?.split(' ')[1] ?? 'S',
            ) : 'US'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">{user?.name ?? 'User'}</p>
            <p className="text-xs text-brand-300 dark:text-gray-400 truncate">{getRoleLabel(role)}</p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm
                     text-brand-200 dark:text-gray-400
                     hover:bg-brand-800 dark:hover:bg-gray-800
                     hover:text-white dark:hover:text-white
                     transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

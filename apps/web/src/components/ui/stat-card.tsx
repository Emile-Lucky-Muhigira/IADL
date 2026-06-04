import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendUp?: boolean;
  color?: 'blue' | 'green' | 'orange' | 'red' | 'teal' | 'purple' | 'brand';
  className?: string;
}

const colorMap: Record<string, string> = {
  blue:   'bg-blue-50   dark:bg-blue-950/40   text-blue-600   dark:text-blue-400',
  green:  'bg-green-50  dark:bg-green-950/40  text-green-600  dark:text-green-400',
  orange: 'bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400',
  red:    'bg-red-50    dark:bg-red-950/40    text-red-600    dark:text-red-400',
  teal:   'bg-teal-50   dark:bg-teal-950/40   text-teal-600   dark:text-teal-400',
  purple: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400',
  brand:  'bg-brand-50  dark:bg-brand-950/40  text-brand-600  dark:text-brand-400',
};

export function StatCard({ title, value, icon: Icon, trend, trendUp, color = 'brand', className }: StatCardProps) {
  return (
    <div className={cn('stat-card', className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</p>
        <div className={cn('p-2 rounded-lg', colorMap[color])}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {trend && (
        <p className={cn('text-xs mt-1', trendUp === undefined ? 'text-gray-500 dark:text-gray-400' : trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400')}>
          {trend}
        </p>
      )}
    </div>
  );
}

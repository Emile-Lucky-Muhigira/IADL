import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'green' | 'red' | 'orange' | 'blue' | 'purple' | 'gray' | 'teal' | 'brand';
  className?: string;
}

const variantMap: Record<string, string> = {
  green:  'bg-green-100  dark:bg-green-900/40  text-green-700  dark:text-green-300',
  red:    'bg-red-100    dark:bg-red-900/40    text-red-700    dark:text-red-300',
  orange: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
  blue:   'bg-blue-100   dark:bg-blue-900/40   text-blue-700   dark:text-blue-300',
  purple: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  gray:   'bg-gray-100   dark:bg-gray-800      text-gray-700   dark:text-gray-300',
  teal:   'bg-teal-100   dark:bg-teal-900/40   text-teal-700   dark:text-teal-300',
  brand:  'bg-brand-100  dark:bg-brand-900/40  text-brand-700  dark:text-brand-300',
};

export function Badge({ children, variant = 'gray', className }: BadgeProps) {
  return (
    <span className={cn('badge', variantMap[variant], className)}>
      {children}
    </span>
  );
}

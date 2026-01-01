import { Calendar, CalendarX, CalendarClock } from 'lucide-react';
import { cn, getDueDateStatus, getDaysUntilDue, formatDate, DUE_DATE_COLORS } from '@/lib/utils';
import type { DueDateStatus } from '@/lib/utils';

interface DueDateIndicatorProps {
  date: string;
  showLabel?: boolean;
  size?: 'sm' | 'md';
  className?: string;
}

// Get human-readable relative date text
function getRelativeDateText(date: string, status: DueDateStatus): string {
  const days = getDaysUntilDue(date);

  if (status === 'overdue') {
    if (days === -1) return 'Yesterday';
    return `${Math.abs(days)}d overdue`;
  }

  if (status === 'due-today') {
    return 'Today';
  }

  if (days === 1) return 'Tomorrow';
  if (days <= 7) return `In ${days}d`;

  return formatDate(date);
}

// Get the appropriate icon component based on status
function getIconForStatus(status: DueDateStatus) {
  switch (status) {
    case 'overdue':
      return CalendarX; // X through calendar for overdue
    case 'due-today':
      return CalendarClock; // Clock on calendar for due today
    case 'due-soon':
      return CalendarClock; // Clock for approaching deadline
    default:
      return Calendar; // Standard calendar
  }
}

export function DueDateIndicator({
  date,
  showLabel = true,
  size = 'sm',
  className
}: DueDateIndicatorProps) {
  const status = getDueDateStatus(date);
  const colors = DUE_DATE_COLORS[status];
  const relativeText = getRelativeDateText(date, status);

  const iconSize = size === 'sm' ? 'h-3 w-3' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  const Icon = getIconForStatus(status);

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1',
        className
      )}
      title={`Due: ${formatDate(date)}${status === 'overdue' ? ' (Overdue)' : status === 'due-today' ? ' (Due today)' : ''}`}
    >
      <Icon className={cn(iconSize, colors.icon)} />
      {showLabel && (
        <span className={cn(textSize, colors.text)}>
          {relativeText}
        </span>
      )}
    </div>
  );
}

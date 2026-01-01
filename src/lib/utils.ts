import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for combining Tailwind classes (enhanced with tailwind-merge)
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate a unique ID (for optimistic updates before DB confirms)
export function generateId(): string {
  return crypto.randomUUID();
}

// Format date for display
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
  });
}

// Check if a date is overdue
export function isOverdue(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return d < today;
}

// Check if a date is today
export function isToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return (
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear()
  );
}

// Check if a date is within the next N days (not including today)
export function isDueSoon(date: string | Date, days: number = 7): boolean {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffTime = d.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // Due soon = within N days but not today and not overdue
  return diffDays > 0 && diffDays <= days;
}

// Get days remaining until due date (negative if overdue)
export function getDaysUntilDue(date: string | Date): number {
  const d = typeof date === 'string' ? new Date(date) : new Date(date.getTime());
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);

  const diffTime = d.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Due date status types for visual styling
export type DueDateStatus = 'overdue' | 'due-today' | 'due-soon' | 'default';

// Get the status of a due date for styling purposes
export function getDueDateStatus(date: string | Date): DueDateStatus {
  if (isOverdue(date)) return 'overdue';
  if (isToday(date)) return 'due-today';
  if (isDueSoon(date, 7)) return 'due-soon';
  return 'default';
}

// Due date status colors (Tailwind classes) - Using Untitled UI color system
export const DUE_DATE_COLORS: Record<DueDateStatus, { icon: string; text: string; bg: string }> = {
  'overdue': {
    icon: 'text-[var(--error-500)]',
    text: 'text-[var(--error-600)] dark:text-[var(--error-500)]',
    bg: 'bg-[var(--error-50)] dark:bg-[var(--error-500)]/10',
  },
  'due-today': {
    icon: 'text-[var(--warning-600)]',
    text: 'text-[var(--warning-700)] dark:text-[var(--warning-500)]',
    bg: 'bg-[var(--warning-50)] dark:bg-[var(--warning-500)]/10',
  },
  'due-soon': {
    icon: 'text-[var(--warning-500)]',
    text: 'text-[var(--warning-600)] dark:text-[var(--warning-400)]',
    bg: 'bg-[var(--warning-25)] dark:bg-[var(--warning-500)]/10',
  },
  'default': {
    icon: 'text-muted-foreground/70',
    text: 'text-foreground',
    bg: '',
  },
};

// Get contrasting text color for a background
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Default column colors - Using Untitled UI color system
export const COLUMN_COLORS = [
  'var(--gray-300)',     // Gray (default)
  'var(--warning-500)',  // Orange
  'var(--error-500)',    // Red
  'var(--brand-500)',    // Purple
  'var(--blue-500)',     // Blue
  'var(--success-500)',  // Green
  '#00bcd4',             // Cyan (not in palette)
  'var(--warning-400)',  // Amber
];

// Priority colors - Using Untitled UI color system
export const PRIORITY_COLORS: Record<string, string> = {
  none: 'transparent',
  low: 'var(--success-500)',
  medium: 'var(--warning-500)',
  high: 'var(--error-500)',
};

// Priority labels
export const PRIORITY_LABELS: Record<string, string> = {
  none: 'No priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

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
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
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

// Get contrasting text color for a background
export function getContrastColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

// Default column colors
export const COLUMN_COLORS = [
  '#e3e2e0', // Gray (default)
  '#f5a623', // Orange
  '#eb5757', // Red
  '#9b51e0', // Purple
  '#2383e2', // Blue
  '#4caf50', // Green
  '#00bcd4', // Cyan
  '#ff9800', // Amber
];

// Priority colors
export const PRIORITY_COLORS: Record<string, string> = {
  none: 'transparent',
  low: '#4caf50',
  medium: '#f5a623',
  high: '#eb5757',
};

// Priority labels
export const PRIORITY_LABELS: Record<string, string> = {
  none: 'No priority',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

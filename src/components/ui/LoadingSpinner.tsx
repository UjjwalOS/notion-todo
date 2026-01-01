import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: number;
  className?: string;
}

export function LoadingSpinner({ size = 24, className = '' }: LoadingSpinnerProps) {
  return (
    <div className={`flex h-full items-center justify-center ${className}`}>
      <Loader2 size={size} className="animate-spin text-[var(--color-text-tertiary)]" />
    </div>
  );
}

import { Plus } from 'lucide-react';

interface AddColumnButtonProps {
  onClick: () => void;
}

export function AddColumnButton({ onClick }: AddColumnButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex h-fit w-72 flex-shrink-0 items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--color-border)] p-4 text-sm text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
    >
      <Plus size={16} />
      Add column
    </button>
  );
}

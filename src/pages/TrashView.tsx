export function TrashView() {
  return (
    <div className="flex h-full flex-col">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Trash
        </h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Items in trash will be permanently deleted after 30 days.
        </p>
        <div className="mt-8">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Trash is empty
          </p>
        </div>
      </div>
    </div>
  );
}

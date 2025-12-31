import { useAuthStore, useThemeStore } from '@/stores';
import type { Theme } from '@/types';

export function SettingsView() {
  const { user, signOut } = useAuthStore();
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="flex h-full flex-col">
      <div className="mx-auto w-full max-w-2xl p-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
          Settings
        </h1>

        <div className="mt-8 space-y-8">
          {/* Account Section */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-[var(--color-text-primary)]">
              Account
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-secondary)]">
                  Email
                </label>
                <p className="mt-1 text-[var(--color-text-primary)]">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={() => signOut()}
                className="rounded-md bg-[var(--color-danger)] px-4 py-2 text-sm font-medium text-white transition-colors hover:opacity-90"
              >
                Sign Out
              </button>
            </div>
          </section>

          {/* Theme Section */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-[var(--color-text-primary)]">
              Appearance
            </h2>
            <div>
              <label className="mb-2 block text-sm font-medium text-[var(--color-text-secondary)]">
                Theme
              </label>
              <div className="flex gap-2">
                {(['light', 'dark', 'system'] as Theme[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`rounded-md px-4 py-2 text-sm font-medium capitalize transition-colors ${
                      theme === t
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Export Section */}
          <section>
            <h2 className="mb-4 text-lg font-medium text-[var(--color-text-primary)]">
              Data
            </h2>
            <button
              onClick={() => {
                // TODO: Implement export
                alert('Export functionality coming soon!');
              }}
              className="rounded-md bg-[var(--color-bg-tertiary)] px-4 py-2 text-sm font-medium text-[var(--color-text-primary)] transition-colors hover:bg-[var(--color-bg-hover)]"
            >
              Export Data (JSON)
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

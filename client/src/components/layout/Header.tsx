import { useLettersStore } from '../../store/lettersStore';

export default function Header() {
  const letters = useLettersStore((s) => s.letters);
  const user = useLettersStore((s) => s.user);
  const logout = useLettersStore((s) => s.logout);
  const openSignInModal = useLettersStore((s) => s.openSignInModal);

  return (
    <header className="sticky top-0 z-30 bg-ink-50/80 backdrop-blur-md border-b border-ink-100">
      <div className="max-w-3xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-ink-900 flex items-center justify-center">
            <svg
              width="14"
              height="14"
              viewBox="0 0 14 14"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1 2.5C1 1.67 1.67 1 2.5 1h9C12.33 1 13 1.67 13 2.5v9c0 .83-.67 1.5-1.5 1.5h-9C1.67 13 1 12.33 1 11.5v-9z"
                stroke="white"
                strokeWidth="1.2"
              />
              <path d="M4 5h6M4 7.5h4" stroke="white" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="font-serif font-medium text-ink-900 text-lg tracking-tight">
            Letters
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs text-ink-400 tabular-nums">
            {letters.length} {letters.length === 1 ? 'letter' : 'letters'}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs text-ink-400">Live</span>
          </div>
          
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-ink-600">{user.username}</span>
              <button
                onClick={() => logout()}
                className="text-xs text-ink-400 hover:text-ink-700 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <button
              onClick={openSignInModal}
              className="px-3 py-1.5 text-sm font-medium text-ink-700 hover:text-ink-900 
                         bg-ink-100 hover:bg-ink-200 rounded-lg transition-colors"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

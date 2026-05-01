import { useEffect } from 'react';
import { useLettersStore } from './store/lettersStore';
import { useWebSocket } from './hooks/useWebSocket';
import Header from './components/layout/Header';
import LetterList from './components/letters/LetterList';
import LetterModal from './components/letters/LetterModal';
import ToastContainer from './components/ui/ToastContainer';

function FloatingAddButton() {
  const openEditor = useLettersStore((s) => s.openEditor);

  return (
    <button
      onClick={() => openEditor('new')}
      className="fixed bottom-8 right-8 z-30
                 w-14 h-14 rounded-2xl bg-ink-900 text-white shadow-card-hover
                 hover:bg-ink-800 active:scale-95 transition-all duration-150
                 flex items-center justify-center
                 focus:outline-none focus:ring-2 focus:ring-ink-900 focus:ring-offset-2"
      aria-label="Write new letter"
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </button>
  );
}

export default function App() {
  const fetchLetters = useLettersStore((s) => s.fetchLetters);
  useWebSocket();

  useEffect(() => {
    void fetchLetters();
  }, [fetchLetters]);

  return (
    <div className="min-h-screen">
      <Header />

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="font-serif text-3xl font-medium text-ink-900 leading-tight">
            Mini-Mika Letters Thread
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            A shared space for letters between people.
          </p>
        </div>

        <LetterList />
      </main>

      <FloatingAddButton />
      <LetterModal />
      <ToastContainer />
    </div>
  );
}

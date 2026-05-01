import { useLettersStore } from '../../store/lettersStore';
import type { Toast } from '../../types';
import { clsx } from 'clsx';

const variantStyles: Record<Toast['variant'], string> = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  info: 'bg-white border-ink-200 text-ink-800',
};

const variantIcons: Record<Toast['variant'], string> = {
  success: '✓',
  error: '✕',
  info: 'i',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useLettersStore((s) => s.removeToast);

  return (
    <div
      className={clsx(
        'flex items-center gap-3 px-4 py-3 rounded-xl border shadow-card',
        'animate-slide-up text-sm font-medium',
        variantStyles[toast.variant]
      )}
      role="alert"
    >
      <span className="font-bold text-xs w-4 text-center">{variantIcons[toast.variant]}</span>
      <span className="flex-1">{toast.message}</span>
      <button
        onClick={() => removeToast(toast.id)}
        className="opacity-50 hover:opacity-100 transition-opacity text-base leading-none"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}

export default function ToastContainer() {
  const toasts = useLettersStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  );
}

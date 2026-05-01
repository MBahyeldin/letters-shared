import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { PortableText, type PortableTextBlock } from '@portabletext/react';
import { useLettersStore } from '../../store/lettersStore';
import ConfirmDialog from '../ui/ConfirmDialog';
import type { Letter } from '../../types';

interface LetterCardProps {
  letter: Letter;
}

export default function LetterCard({ letter }: LetterCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: letter.id,
  });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const openEditor = useLettersStore((s) => s.openEditor);
  const deleteLetter = useLettersStore((s) => s.deleteLetter);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const formattedDate = (() => {
    try {
      return format(new Date(letter.letterDate), 'MMMM d, yyyy');
    } catch {
      return '';
    }
  })();

  const handleDelete = async () => {
    setConfirmOpen(false);
    await deleteLetter(letter.id);
  };

  return (
    <>
      <article
        ref={setNodeRef}
        style={style}
        className={clsx(
          'letter-card group relative cursor-default select-none',
          isDragging && 'opacity-50 scale-[1.02] shadow-card-hover z-10',
          'animate-slide-up'
        )}
      >
        {/* Drag handle */}
        <button
          className={clsx(
            'absolute left-4 top-1/2 -translate-y-1/2',
            'opacity-0 group-hover:opacity-40 hover:!opacity-80 transition-opacity duration-200',
            'cursor-grab active:cursor-grabbing p-1 rounded-lg hover:bg-ink-100',
            'touch-none'
          )}
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
          tabIndex={-1}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="6" cy="5" r="1.2" fill="currentColor" />
            <circle cx="10" cy="5" r="1.2" fill="currentColor" />
            <circle cx="6" cy="8" r="1.2" fill="currentColor" />
            <circle cx="10" cy="8" r="1.2" fill="currentColor" />
            <circle cx="6" cy="11" r="1.2" fill="currentColor" />
            <circle cx="10" cy="11" r="1.2" fill="currentColor" />
          </svg>
        </button>

        {/* Card body */}
        <div
          className="px-8 py-6 pl-12 cursor-pointer"
          onClick={() => openEditor(letter.id)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openEditor(letter.id)}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="min-w-0 flex-1">
              <h2 className="font-serif text-lg font-medium text-ink-900 leading-snug truncate">
                {letter.title || 'Untitled'}
              </h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-ink-400">
                <span>{letter.author}</span>
                <span>·</span>
                <time dateTime={letter.letterDate}>{formattedDate}</time>
              </div>
            </div>

            {/* Actions */}
            <div
              className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => openEditor(letter.id)}
                className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
                aria-label="Edit letter"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M10 2l2 2-7 7H3v-2l7-7z"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="p-1.5 rounded-lg text-ink-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                aria-label="Delete letter"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path
                    d="M2 3.5h10M5.5 3.5V2.5a.5.5 0 01.5-.5h2a.5.5 0 01.5.5v1M11 3.5l-.7 7.5a.5.5 0 01-.5.5H4.2a.5.5 0 01-.5-.5L3 3.5"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content preview */}
          {letter.contentJson.length > 0 && (
            <div className="text-sm text-ink-600 leading-relaxed line-clamp-3">
              <PortableText value={letter.contentJson as unknown as PortableTextBlock[]} />
            </div>
          )}

          {/* Footer */}
          <div className="mt-4 pt-3 border-t border-ink-100 flex items-center justify-between text-xs text-ink-400">
            <span>
              Updated {format(new Date(letter.updatedAt), 'MMM d')}
            </span>
            <span className="font-mono">#{letter.position + 1}</span>
          </div>
        </div>
      </article>

      <ConfirmDialog
        open={confirmOpen}
        title="Delete letter"
        message={`Are you sure you want to delete "${letter.title || 'Untitled'}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}

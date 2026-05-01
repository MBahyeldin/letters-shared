import { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { clsx } from 'clsx';
import { useLettersStore } from '../../store/lettersStore';
import RichTextEditor from '../editor/RichTextEditor';
import Button from '../ui/Button';
import type { SaveStatus } from '../../types';
import type { PortableTextBlock } from '@portabletext/editor';

const AUTOSAVE_DELAY = 1200;

export default function LetterModal() {
  const activeEditorId = useLettersStore((s) => s.activeEditorId);
  const letters = useLettersStore((s) => s.letters);
  const closeEditor = useLettersStore((s) => s.closeEditor);
  const createLetter = useLettersStore((s) => s.createLetter);
  const updateLetter = useLettersStore((s) => s.updateLetter);

  const isNew = activeEditorId === null || activeEditorId === 'new';
  const existingLetter = isNew ? null : letters.find((l) => l.id === activeEditorId) ?? null;

  // Get initial content directly from existingLetter for immediate availability
  const initialContent = existingLetter 
    ? existingLetter.contentJson as PortableTextBlock[] 
    : [];

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [letterDate, setLetterDate] = useState(() => format(new Date(), "yyyy-MM-dd'T'HH:mm"));
  const [contentJson, setContentJson] = useState<PortableTextBlock[]>(initialContent);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isSaving, setIsSaving] = useState(false);

  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const createdIdRef = useRef<string | null>(null);
  
  // Use refs for form values to keep save callback stable
  const formRef = useRef({ title, author, letterDate, contentJson });
  formRef.current = { title, author, letterDate, contentJson };
  
  const existingLetterRef = useRef(existingLetter);
  existingLetterRef.current = existingLetter;

  // Populate form when editing existing letter
  useEffect(() => {
    // Clear any pending autosave when closing the modal
    if (activeEditorId === null) {
      if (autosaveTimer.current) {
        clearTimeout(autosaveTimer.current);
        autosaveTimer.current = null;
      }
      return;
    }
    
    if (existingLetter) {
      setTitle(existingLetter.title);
      setAuthor(existingLetter.author);
      setLetterDate(
        format(new Date(existingLetter.letterDate), "yyyy-MM-dd'T'HH:mm")
      );
      setContentJson(existingLetter.contentJson as PortableTextBlock[]);
      createdIdRef.current = existingLetter.id;
    } else {
      setTitle('');
      setAuthor('');
      setLetterDate(format(new Date(), "yyyy-MM-dd'T'HH:mm"));
      setContentJson([]);
      createdIdRef.current = null;
    }
    setSaveStatus('idle');
  }, [activeEditorId]); // eslint-disable-line react-hooks/exhaustive-deps

  const getPayload = useCallback(() => {
    const { title, author, letterDate, contentJson } = formRef.current;
    return {
      title: title.trim() || 'Untitled',
      author: author.trim() || 'Anonymous',
      letterDate: new Date(letterDate).toISOString(),
      contentJson: contentJson as Record<string, unknown>[],
      contentHtml: '', // Portable Text doesn't generate HTML
    };
  }, []);

  const save = useCallback(async () => {
    setIsSaving(true);
    setSaveStatus('saving');
    try {
      if (createdIdRef.current) {
        await updateLetter(createdIdRef.current, getPayload());
      } else {
        const letter = await createLetter(getPayload());
        if (letter) createdIdRef.current = letter.id;
      }
      setSaveStatus('saved');
    } catch {
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  }, [getPayload, createLetter, updateLetter]);

  // Autosave on content changes (edit mode only)
  const scheduleAutosave = useCallback(() => {
    if (!existingLetterRef.current && !createdIdRef.current) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    setSaveStatus('idle');
    autosaveTimer.current = setTimeout(save, AUTOSAVE_DELAY);
  }, [save]);

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  useEffect(() => {
    if (existingLetterRef.current) scheduleAutosave();
  }, [title, author, letterDate, contentJson, scheduleAutosave]);

  // Keyboard close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeEditor();
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        void save();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [closeEditor, save]);

  const open = activeEditorId !== undefined && activeEditorId !== null
    ? true
    : false;

  if (!open) return null;

  const saveStatusLabel: Record<SaveStatus, string> = {
    idle: '',
    saving: 'Saving…',
    saved: 'Saved',
    error: 'Save failed',
  };

  return (
    <div className="fixed inset-0 z-40 flex items-start justify-center pt-16 pb-8 px-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/25 backdrop-blur-sm animate-fade-in"
        onClick={closeEditor}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-2xl animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-7 pb-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-ink-400 uppercase tracking-widest">
              {isNew ? 'New Letter' : 'Edit Letter'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {saveStatus !== 'idle' && (
              <span
                className={clsx(
                  'text-xs transition-opacity',
                  saveStatus === 'saving' && 'text-ink-400',
                  saveStatus === 'saved' && 'text-emerald-500',
                  saveStatus === 'error' && 'text-red-500'
                )}
              >
                {saveStatusLabel[saveStatus]}
              </span>
            )}
            <button
              onClick={closeEditor}
              className="p-1.5 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-8 pt-5 pb-8">
          {/* Title */}
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Letter title"
            className="w-full font-serif text-2xl font-medium text-ink-900 placeholder:text-ink-300
                       bg-transparent border-none outline-none mb-4 leading-snug"
          />

          {/* Meta row */}
          <div className="flex flex-wrap gap-3 mb-6">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <label className="text-xs text-ink-400 whitespace-nowrap">From</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Author name"
                className="input-base flex-1 min-w-0"
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="text-xs text-ink-400 whitespace-nowrap">Date</label>
              <input
                type="datetime-local"
                value={letterDate}
                onChange={(e) => setLetterDate(e.target.value)}
                className="input-base"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-ink-100 mb-6" />

          {/* Editor */}
          <RichTextEditor
            key={activeEditorId ?? 'new'}
            content={isNew ? [] : (existingLetter?.contentJson as PortableTextBlock[] ?? contentJson)}
            onChange={setContentJson}
            placeholder="Write your letter here…"
          />

          {/* Footer */}
          <div className="flex items-center justify-between mt-8 pt-5 border-t border-ink-100">
            <p className="text-xs text-ink-400">
              {isNew
                ? 'Press ⌘S to save'
                : 'Autosaves as you type · ⌘S to save now'}
            </p>
            <div className="flex gap-3">
              <Button variant="ghost" onClick={closeEditor}>
                Cancel
              </Button>
              <Button variant="primary" loading={isSaving} onClick={save}>
                {isNew ? 'Create letter' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

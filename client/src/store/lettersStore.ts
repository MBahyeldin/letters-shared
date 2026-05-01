import { create } from 'zustand';
import { api } from '../services/api';
import type { Letter, CreateLetterPayload, UpdateLetterPayload, Toast, ToastVariant } from '../types';

let toastCounter = 0;

interface LettersState {
  letters: Letter[];
  isLoading: boolean;
  error: string | null;
  toasts: Toast[];
  activeEditorId: string | null;

  // Actions
  fetchLetters: () => Promise<void>;
  createLetter: (data: CreateLetterPayload) => Promise<Letter | null>;
  updateLetter: (id: string, data: UpdateLetterPayload) => Promise<Letter | null>;
  deleteLetter: (id: string) => Promise<boolean>;
  reorderLetters: (orderedIds: string[]) => Promise<void>;

  // Optimistic helpers called by WebSocket
  applyLetterCreated: (letter: Letter) => void;
  applyLetterUpdated: (letter: Letter) => void;
  applyLetterDeleted: (id: string) => void;
  applyLetterReordered: (orders: { id: string; position: number }[]) => void;

  // Modal
  openEditor: (id: string | null) => void;
  closeEditor: () => void;

  // Toasts
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;
}

export const useLettersStore = create<LettersState>((set, get) => ({
  letters: [],
  isLoading: false,
  error: null,
  toasts: [],
  activeEditorId: null,

  fetchLetters: async () => {
    set({ isLoading: true, error: null });
    try {
      const letters = await api.getLetters();
      set({ letters, isLoading: false });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load letters';
      set({ error: msg, isLoading: false });
    }
  },

  createLetter: async (data) => {
    try {
      // Optimistic: insert a temporary letter
      const tempId = `__temp__${Date.now()}`;
      const optimistic: Letter = {
        id: tempId,
        ...data,
        position: get().letters.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set((s) => ({ letters: [...s.letters, optimistic] }));

      const letter = await api.createLetter(data);

      // Replace optimistic with real
      set((s) => ({
        letters: s.letters.map((l) => (l.id === tempId ? letter : l)),
      }));
      get().addToast('Letter created', 'success');
      return letter;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create letter';
      get().addToast(msg, 'error');
      set((s) => ({ letters: s.letters.filter((l) => !l.id.startsWith('__temp__')) }));
      return null;
    }
  },

  updateLetter: async (id, data) => {
    const previous = get().letters.find((l) => l.id === id);
    if (!previous) return null;

    // Optimistic update
    set((s) => ({
      letters: s.letters.map((l) =>
        l.id === id ? { ...l, ...data, updatedAt: new Date().toISOString() } : l
      ),
    }));

    try {
      const letter = await api.updateLetter(id, data);
      set((s) => ({
        letters: s.letters.map((l) => (l.id === id ? letter : l)),
      }));
      return letter;
    } catch (err) {
      // Rollback
      set((s) => ({
        letters: s.letters.map((l) => (l.id === id ? previous : l)),
      }));
      const msg = err instanceof Error ? err.message : 'Failed to update letter';
      get().addToast(msg, 'error');
      return null;
    }
  },

  deleteLetter: async (id) => {
    const previous = [...get().letters];
    set((s) => ({ letters: s.letters.filter((l) => l.id !== id) }));

    try {
      await api.deleteLetter(id);
      get().addToast('Letter deleted', 'success');
      return true;
    } catch (err) {
      set({ letters: previous });
      const msg = err instanceof Error ? err.message : 'Failed to delete letter';
      get().addToast(msg, 'error');
      return false;
    }
  },

  reorderLetters: async (orderedIds) => {
    const previous = [...get().letters];

    // Optimistic reorder
    const reordered = orderedIds
      .map((id, idx) => {
        const letter = get().letters.find((l) => l.id === id);
        return letter ? { ...letter, position: idx } : null;
      })
      .filter(Boolean) as Letter[];

    set({ letters: reordered });

    try {
      await api.reorderLetters({
        orders: orderedIds.map((id, position) => ({ id, position })),
      });
    } catch (err) {
      set({ letters: previous });
      const msg = err instanceof Error ? err.message : 'Failed to reorder letters';
      get().addToast(msg, 'error');
    }
  },

  applyLetterCreated: (letter) => {
    set((s) => {
      const exists = s.letters.some((l) => l.id === letter.id);
      if (exists) return s;
      return {
        letters: [...s.letters.filter((l) => !l.id.startsWith('__temp__')), letter]
          .sort((a, b) => a.position - b.position),
      };
    });
  },

  applyLetterUpdated: (letter) => {
    set((s) => ({
      letters: s.letters.map((l) => (l.id === letter.id ? letter : l)),
    }));
  },

  applyLetterDeleted: (id) => {
    set((s) => ({ letters: s.letters.filter((l) => l.id !== id) }));
  },

  applyLetterReordered: (orders) => {
    const orderMap = new Map(orders.map(({ id, position }) => [id, position]));
    set((s) => ({
      letters: s.letters
        .map((l) => ({ ...l, position: orderMap.get(l.id) ?? l.position }))
        .sort((a, b) => a.position - b.position),
    }));
  },

  openEditor: (id) => set({ activeEditorId: id }),
  closeEditor: () => set({ activeEditorId: null }),

  addToast: (message, variant = 'info') => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, variant }] }));
    setTimeout(() => get().removeToast(id), 3500);
  },

  removeToast: (id) => {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
  },
}));

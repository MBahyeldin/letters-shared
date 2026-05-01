import type { Letter, CreateLetterPayload, UpdateLetterPayload, ReorderPayload } from '../types';

const BASE = '/api/letters';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  getLetters: () => request<Letter[]>(BASE),

  getLetter: (id: string) => request<Letter>(`${BASE}/${id}`),

  createLetter: (data: CreateLetterPayload) =>
    request<Letter>(BASE, { method: 'POST', body: JSON.stringify(data) }),

  updateLetter: (id: string, data: UpdateLetterPayload) =>
    request<Letter>(`${BASE}/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  deleteLetter: (id: string) =>
    request<void>(`${BASE}/${id}`, { method: 'DELETE' }),

  reorderLetters: (payload: ReorderPayload) =>
    request<{ success: boolean }>(`${BASE}/reorder`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

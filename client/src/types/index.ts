export interface Letter {
  id: string;
  title: string;
  contentJson: Record<string, unknown>[];
  contentHtml: string;
  author: string;
  letterDate: string;
  position: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateLetterPayload = {
  title: string;
  contentJson: Record<string, unknown>[];
  contentHtml: string;
  author: string;
  letterDate: string;
};

export type UpdateLetterPayload = Partial<CreateLetterPayload>;

export interface ReorderPayload {
  orders: { id: string; position: number }[];
}

export type WsEventType =
  | 'LETTER_CREATED'
  | 'LETTER_UPDATED'
  | 'LETTER_DELETED'
  | 'LETTER_REORDERED';

export interface WsEvent {
  type: WsEventType;
  payload: unknown;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export type ToastVariant = 'success' | 'error' | 'info';

export interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
}

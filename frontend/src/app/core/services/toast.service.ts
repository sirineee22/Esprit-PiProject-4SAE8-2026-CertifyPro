import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastMessage {
  id: number;
  text: string;
  type: ToastType;
  durationMs: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  readonly toasts = signal<ToastMessage[]>([]);
  private nextId = 1;

  success(text: string, durationMs = 3000): void {
    this.push(text, 'success', durationMs);
  }

  error(text: string, durationMs = 4000): void {
    this.push(text, 'error', durationMs);
  }

  info(text: string, durationMs = 3000): void {
    this.push(text, 'info', durationMs);
  }

  warning(text: string, durationMs = 3500): void {
    this.push(text, 'warning', durationMs);
  }

  remove(id: number): void {
    this.toasts.update(items => items.filter(item => item.id !== id));
  }

  private push(text: string, type: ToastType, durationMs: number): void {
    const id = this.nextId++;
    const toast: ToastMessage = { id, text, type, durationMs };
    this.toasts.update(items => [...items, toast]);
    setTimeout(() => this.remove(id), durationMs);
  }
}

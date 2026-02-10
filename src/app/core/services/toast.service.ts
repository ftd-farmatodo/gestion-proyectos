import { Injectable, signal, computed } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: number;
  message: string;
  type: ToastType;
  duration?: number;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _toasts = signal<Toast[]>([]);
  private _nextId = 0;
  private defaultDuration = 4000;

  readonly toasts = this._toasts.asReadonly();
  readonly hasToasts = computed(() => this._toasts().length > 0);

  show(message: string, type: ToastType = 'info', duration?: number): void {
    const id = ++this._nextId;
    const toast: Toast = {
      id,
      message,
      type,
      duration: duration ?? this.defaultDuration,
    };
    this._toasts.update((list) => [...list, toast]);
    const ms = toast.duration ?? this.defaultDuration;
    if (ms > 0) {
      setTimeout(() => this.dismiss(id), ms);
    }
  }

  dismiss(id: number): void {
    this._toasts.update((list) => list.filter((t) => t.id !== id));
  }

  success(message: string, duration?: number): void {
    this.show(message, 'success', duration);
  }

  error(message: string, duration?: number): void {
    this.show(message, 'error', duration);
  }

  info(message: string, duration?: number): void {
    this.show(message, 'info', duration);
  }

  warning(message: string, duration?: number): void {
    this.show(message, 'warning', duration);
  }
}

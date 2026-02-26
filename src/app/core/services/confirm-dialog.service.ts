import { Injectable, computed, signal } from '@angular/core';

export type ConfirmDialogVariant = 'default' | 'danger';

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
}

interface ConfirmDialogState {
  options: Required<Pick<ConfirmDialogOptions, 'title' | 'message' | 'confirmText' | 'cancelText' | 'variant'>>;
  resolve: (value: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmDialogService {
  private _state = signal<ConfirmDialogState | null>(null);

  readonly state = this._state.asReadonly();
  readonly isOpen = computed(() => this._state() !== null);

  confirm(options: ConfirmDialogOptions): Promise<boolean> {
    const normalized = this.normalizeOptions(options);
    return new Promise<boolean>((resolve) => {
      this._state.set({ options: normalized, resolve });
    });
  }

  accept(): void {
    this.resolveAndClose(true);
  }

  cancel(): void {
    this.resolveAndClose(false);
  }

  private resolveAndClose(value: boolean): void {
    const current = this._state();
    if (!current) return;
    current.resolve(value);
    this._state.set(null);
  }

  private normalizeOptions(options: ConfirmDialogOptions): Required<Pick<ConfirmDialogOptions, 'title' | 'message' | 'confirmText' | 'cancelText' | 'variant'>> {
    return {
      title: options.title.trim(),
      message: options.message.trim(),
      confirmText: options.confirmText?.trim() || 'Confirmar',
      cancelText: options.cancelText?.trim() || 'Cancelar',
      variant: options.variant ?? 'default',
    };
  }
}

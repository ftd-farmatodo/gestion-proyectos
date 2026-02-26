import { Component, inject } from '@angular/core';
import { ToastService, Toast } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="fixed bottom-20 lg:bottom-4 right-4 z-[100] flex flex-col gap-2">
      @for (toast of toasts.toasts(); track toast.id) {
        <div
          class="flex min-w-[280px] max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg animate-slide-up"
          [style.background]="containerBg(toast)"
          [style.border-color]="containerBorder(toast)"
          [style.color]="containerText(toast)"
        >
          <div class="shrink-0 pt-0.5" [innerHTML]="iconSvg(toast)"></div>
          <p class="flex-1 text-sm font-medium">{{ toast.message }}</p>
          <button (click)="toasts.dismiss(toast.id)" class="shrink-0 opacity-60 hover:opacity-100">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  toasts = inject(ToastService);

  containerBg(toast: Toast): string {
    switch (toast.type) {
      case 'success': return 'color-mix(in srgb, var(--lime) 10%, var(--surface-card))';
      case 'error':   return 'color-mix(in srgb, var(--magenta) 10%, var(--surface-card))';
      case 'warning': return 'color-mix(in srgb, var(--orange) 10%, var(--surface-card))';
      default:        return 'color-mix(in srgb, var(--primary-light) 10%, var(--surface-card))';
    }
  }

  containerBorder(toast: Toast): string {
    switch (toast.type) {
      case 'success': return 'color-mix(in srgb, var(--lime) 30%, transparent)';
      case 'error':   return 'color-mix(in srgb, var(--magenta) 30%, transparent)';
      case 'warning': return 'color-mix(in srgb, var(--orange) 30%, transparent)';
      default:        return 'color-mix(in srgb, var(--primary-light) 30%, transparent)';
    }
  }

  containerText(toast: Toast): string {
    switch (toast.type) {
      case 'success': return 'var(--lime)';
      case 'error':   return 'var(--magenta)';
      case 'warning': return 'var(--orange)';
      default:        return 'var(--primary-light)';
    }
  }

  iconSvg(toast: Toast): string {
    switch (toast.type) {
      case 'success':
        return '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      case 'error':
        return '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>';
      case 'warning':
        return '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/></svg>';
      default:
        return '<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/></svg>';
    }
  }
}

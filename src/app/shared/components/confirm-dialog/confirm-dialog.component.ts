import { Component, HostListener, OnDestroy, computed, effect, inject } from '@angular/core';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  template: `
    @if (dialog.state(); as state) {
      <div
        class="fixed inset-0 z-[120] flex items-center justify-center bg-black/45 backdrop-blur-sm animate-fade-in"
        (click)="onOverlayClick($event)"
      >
        <div
          class="mx-4 w-full max-w-md rounded-2xl border p-5 shadow-2xl animate-slide-up"
          style="background: var(--surface-card); border-color: var(--border)"
          role="dialog"
          aria-modal="true"
          [attr.aria-labelledby]="'confirm-dialog-title'"
          [attr.aria-describedby]="'confirm-dialog-message'"
          (click)="$event.stopPropagation()"
        >
          <div class="flex items-start gap-3">
            <div
              class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
              [style.background]="state.options.variant === 'danger'
                ? 'color-mix(in srgb, var(--magenta) 14%, transparent)'
                : 'color-mix(in srgb, var(--accent) 14%, transparent)'"
            >
              <svg class="h-5 w-5" [style.color]="accentColor()" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.8">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m0 3.75h.008v.008H12v-.008zM10.34 3.94L1.82 18.06A1.75 1.75 0 003.31 20.75h17.38a1.75 1.75 0 001.49-2.69L13.66 3.94a1.75 1.75 0 00-3.32 0z"/>
              </svg>
            </div>
            <div class="min-w-0 flex-1">
              <h3 id="confirm-dialog-title" class="text-base font-bold leading-tight" style="color: var(--on-surface)">
                {{ state.options.title }}
              </h3>
              <p id="confirm-dialog-message" class="mt-1.5 text-sm leading-relaxed" style="color: var(--muted)">
                {{ state.options.message }}
              </p>
            </div>
          </div>

          <div class="mt-5 flex items-center justify-end gap-2">
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
              style="color: var(--muted)"
              (click)="dialog.cancel()"
            >
              {{ state.options.cancelText }}
            </button>
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
              [style.background]="confirmBg()"
              (click)="dialog.accept()"
              autofocus
            >
              {{ state.options.confirmText }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent implements OnDestroy {
  dialog = inject(ConfirmDialogService);

  private previousBodyOverflow = '';
  private readonly variant = computed(() => this.dialog.state()?.options.variant ?? 'default');
  private readonly lockBodyScroll = effect(() => {
    const open = this.dialog.isOpen();
    if (open) {
      this.previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = this.previousBodyOverflow;
    }
  });

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.dialog.isOpen()) {
      this.dialog.cancel();
    }
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.dialog.cancel();
    }
  }

  confirmBg(): string {
    return this.variant() === 'danger' ? 'var(--magenta)' : 'var(--accent)';
  }

  accentColor(): string {
    return this.variant() === 'danger' ? 'var(--magenta)' : 'var(--accent)';
  }

  ngOnDestroy(): void {
    this.lockBodyScroll.destroy();
    document.body.style.overflow = this.previousBodyOverflow;
  }
}

import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink, TranslatePipe],
  template: `
    <div class="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
           style="background: color-mix(in srgb, var(--accent) 10%, transparent)">
        <svg class="h-10 w-10" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
        </svg>
      </div>
      <h1 class="text-3xl font-bold tracking-tight mb-2" style="color: var(--on-surface)">404</h1>
      <p class="text-lg font-semibold mb-1" style="color: var(--on-surface)">{{ 'notFound.title' | translate }}</p>
      <p class="text-sm mb-6" style="color: var(--muted)">{{ 'notFound.message' | translate }}</p>
      <a routerLink="/dashboard"
         class="rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all hover:shadow-md"
         style="background: var(--accent)">
        {{ 'notFound.goHome' | translate }}
      </a>
    </div>
  `,
})
export class NotFoundComponent {}

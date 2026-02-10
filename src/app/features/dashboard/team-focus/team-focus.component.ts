import { Component, inject } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-team-focus',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="rounded-xl border p-6" style="background:var(--surface);border-color:var(--border)">
      <div class="mb-4 flex items-center gap-2">
        <svg class="h-5 w-5" style="color:var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
        </svg>
        <h2 class="text-lg font-semibold" style="color:var(--on-surface)">{{ 'dashboard.teamFocus' | translate }}</h2>
      </div>
      <div class="space-y-3">
        @for (item of dashboard.teamFocus(); track item.developer.id) {
          <div class="flex items-center gap-3 rounded-lg p-3 transition-colors" style="background:var(--surface-alt)">
            <div class="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold" style="background:var(--accent);color:white">
              {{ (item.developer.display_name ?? item.developer.email).charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium" style="color:var(--on-surface)">{{ item.developer.display_name ?? item.developer.email }}</p>
              @if (item.currentRequest) {
                <p class="truncate text-xs" style="color:var(--muted)">{{ item.currentRequest.title }}</p>
              } @else {
                <p class="text-xs italic" style="color:var(--muted)">{{ 'dashboard.noTask' | translate }}</p>
              }
            </div>
            @if (item.currentRequest) {
              <span class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                [class]="item.currentRequest.type === 'incidencia' ? 'bg-incidencia/10 text-incidencia dark:bg-red-900/30 dark:text-red-400' :
                         item.currentRequest.type === 'mejora' ? 'bg-mejora/10 text-mejora dark:bg-blue-900/30 dark:text-blue-400' :
                         'bg-proyecto/10 text-proyecto dark:bg-green-900/30 dark:text-green-400'">
                {{ item.currentRequest.type }}
              </span>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class TeamFocusComponent {
  dashboard = inject(DashboardService);
}

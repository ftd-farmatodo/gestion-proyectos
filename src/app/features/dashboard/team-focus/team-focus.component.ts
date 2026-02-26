import { Component, inject } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-team-focus',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <section class="dash-card overflow-hidden h-full">
      <!-- Section header -->
      <div class="flex items-center justify-between gap-2.5 px-5 py-4 border-b" style="border-color: var(--border)">
        <div class="flex items-center gap-2.5">
          <div class="flex h-8 w-8 items-center justify-center rounded-xl"
               style="background: color-mix(in srgb, var(--primary-light) 12%, transparent)">
            <svg class="h-4 w-4" style="color: var(--primary-light)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
            </svg>
          </div>
          <h2 class="text-sm font-semibold" style="color: var(--on-surface)">{{ 'dashboard.teamFocus' | translate }}</h2>
        </div>
        <!-- Member count badge -->
        <span class="flex h-6 min-w-6 items-center justify-center rounded-full px-2 text-[11px] font-bold"
              style="background: color-mix(in srgb, var(--primary-light) 10%, transparent); color: var(--primary-light)">
          {{ dashboard.teamFocus().length }}
        </span>
      </div>

      <!-- Horizontal profile cards grid -->
      <div class="p-4">
        @if (dashboard.teamFocus().length === 0) {
          <div class="py-8 text-center">
            <p class="text-sm" style="color: var(--muted)">{{ 'common.empty' | translate }}</p>
          </div>
        } @else {
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
          @for (item of dashboard.teamFocus(); track item.developer.id) {
            <div class="group relative flex flex-col items-center gap-2.5 rounded-xl px-3 py-4 text-center transition-all duration-200 hover:scale-[1.02]"
                 style="background: color-mix(in srgb, var(--on-surface) 2.5%, transparent)"
                 [class.ring-1]="!!item.focusedRequest"
                 [style.--tw-ring-color]="item.focusedRequest ? 'color-mix(in srgb, var(--lime) 40%, transparent)' : 'transparent'">

              <!-- Avatar with status ring -->
              <div class="relative">
                <!-- Status ring -->
                <div class="absolute -inset-1 rounded-full transition-opacity duration-300"
                     [style.background]="item.focusedRequest ? 'conic-gradient(var(--lime) 0deg, color-mix(in srgb, var(--lime) 20%, transparent) 360deg)' : 'color-mix(in srgb, var(--cool-gray) 20%, transparent)'"
                     [class.opacity-100]="!!item.focusedRequest"
                     [class.opacity-40]="!item.focusedRequest">
                </div>
                <!-- Avatar circle -->
                @if (item.developer.avatar_url) {
                  <img [src]="item.developer.avatar_url"
                       [alt]="item.developer.display_name ?? item.developer.email"
                       class="relative h-11 w-11 rounded-full object-cover ring-2"
                       style="ring-color: var(--surface-card)"
                       (error)="onImgError($event)" />
                } @else {
                  <div class="relative flex h-11 w-11 items-center justify-center rounded-full text-sm font-bold ring-2"
                       style="background: var(--accent); color: white; ring-color: var(--surface-card)">
                    {{ (item.developer.display_name ?? item.developer.email).charAt(0) }}
                  </div>
                }
                <!-- Pulsing indicator when focused -->
                @if (item.focusedRequest) {
                  <span class="absolute -bottom-0.5 -right-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full ring-2" style="ring-color: var(--surface-card)">
                    <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" style="background: var(--lime)"></span>
                    <span class="relative inline-flex h-3.5 w-3.5 rounded-full" style="background: var(--lime)"></span>
                  </span>
                }
              </div>

              <!-- Name -->
              <p class="text-xs font-semibold leading-tight" style="color: var(--on-surface)">
                {{ shortName(item.developer.display_name ?? item.developer.email) }}
              </p>

              <!-- Focus or count -->
              @if (item.focusedRequest) {
                <p class="line-clamp-2 text-[10px] font-medium leading-snug" style="color: var(--muted)">
                  <span class="font-mono" style="color: var(--primary-light)">{{ item.focusedRequest.internal_id }}</span>
                  {{ item.focusedRequest.title }}
                </p>
              } @else if (item.assignedCount > 0) {
                <span class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold"
                      style="background: color-mix(in srgb, var(--primary-light) 10%, transparent); color: var(--primary-light)">
                  {{ item.assignedCount }} {{ item.assignedCount === 1 ? ('dashboard.taskSingular' | translate) : ('dashboard.taskPlural' | translate) }}
                </span>
              } @else {
                <span class="text-[10px] italic" style="color: var(--cool-gray)">{{ 'dashboard.noTask' | translate }}</span>
              }
            </div>
          }
        </div>
        }
      </div>
    </section>
  `,
})
export class TeamFocusComponent {
  dashboard = inject(DashboardService);

  /** Get first name only for compact display */
  shortName(name: string): string {
    return name.split(' ')[0];
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }
}

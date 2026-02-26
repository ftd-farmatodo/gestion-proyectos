import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { TeamStore } from '../../services/team-store.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-team-setup',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="flex min-h-screen items-center justify-center p-4" style="background: var(--surface-alt)">
      <div class="w-full max-w-lg animate-scale-in">
        <!-- Card -->
        <div class="dash-card p-8 text-center">
          <!-- Icon -->
          <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl"
               style="background: color-mix(in srgb, var(--accent) 12%, transparent)">
            <svg class="h-8 w-8" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"/>
            </svg>
          </div>

          <h1 class="mt-5 text-xl font-bold tracking-tight" style="color: var(--on-surface)">
            {{ 'teamSetup.title' | translate }}
          </h1>
          <p class="mt-2 text-sm" style="color: var(--muted)">
            {{ 'teamSetup.subtitle' | translate }}
          </p>

          <!-- Team cards -->
          <div class="mt-6 grid gap-3">
            @if (teams().length === 0) {
              <div class="py-8 text-center">
                <p class="text-sm" style="color: var(--muted)">{{ 'common.empty' | translate }}</p>
              </div>
            }
            @for (team of teams(); track team.id) {
              <button (click)="selectTeam(team.id)"
                      class="group flex items-center gap-4 rounded-xl border px-5 py-4 text-left transition-all duration-200 hover:scale-[1.01]"
                      style="background: var(--surface-card); border-color: var(--border)"
                      [style.border-color]="selected === team.id ? 'var(--accent)' : null"
                      [style.box-shadow]="selected === team.id ? '0 0 0 3px var(--ring)' : null">
                <!-- Icon -->
                @if (team.icon) {
                  <span class="text-2xl">{{ team.icon }}</span>
                }
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold" style="color: var(--on-surface)">{{ team.name }}</p>
                  @if (team.description) {
                    <p class="mt-0.5 text-xs truncate" style="color: var(--muted)">{{ team.description }}</p>
                  }
                </div>
                <!-- Check -->
                @if (selected === team.id) {
                  <div class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full" style="background: var(--accent)">
                    <svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </div>
                }
              </button>
            }
          </div>

          <!-- Confirm button -->
          <button (click)="confirm()"
                  [disabled]="!selected"
                  class="mt-6 w-full rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style="background: var(--accent)"
                  [style.background]="selected ? 'var(--accent)' : null">
            {{ 'teamSetup.confirm' | translate }}
          </button>
        </div>
      </div>
    </div>
  `,
})
export class TeamSetupComponent {
  private auth = inject(AuthService);
  private teamStore = inject(TeamStore);
  private router = inject(Router);

  readonly teams = this.teamStore.activeTeams;
  selected: string | null = null;

  selectTeam(id: string): void {
    this.selected = id;
  }

  async confirm(): Promise<void> {
    if (!this.selected) return;
    try {
      await this.auth.setTeam(this.selected);
      await this.router.navigate(['/dashboard']);
    } catch {
      // Keep user in setup screen when persistence fails.
    }
  }
}

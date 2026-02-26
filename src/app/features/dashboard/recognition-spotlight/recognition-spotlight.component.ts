import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-recognition-spotlight',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    @if (entries().length > 0) {
      <section class="dash-card relative overflow-hidden">

        <!-- Progress bar (auto-rotation indicator) -->
        @if (entries().length > 1) {
          <div class="absolute top-0 left-0 right-0 h-[3px] z-10">
            <div class="h-full transition-none rounded-full"
                 [class.progress-animate]="!isPaused()"
                 [class.progress-paused]="isPaused()"
                 style="background: var(--accent); width: 0%">
            </div>
          </div>
        }

        <!-- Header -->
        <div class="flex items-center justify-between gap-2.5 px-5 py-4 border-b" style="border-color: var(--border)">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-xl"
                 style="background: color-mix(in srgb, var(--purple) 12%, transparent)">
              <svg class="h-4 w-4" style="color: var(--purple)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m5.25-6.388a6.003 6.003 0 01-5.25 6.388m0 0a6.023 6.023 0 01-2.77-.896"/>
              </svg>
            </div>
            <h2 class="text-sm font-semibold" style="color: var(--on-surface)">{{ 'recognition.title' | translate }}</h2>
          </div>

          <!-- Nav: dots + pause indicator -->
          @if (entries().length > 1) {
            <div class="flex items-center gap-2">
              <!-- Pause indicator on hover -->
              @if (isPaused()) {
                <svg class="h-3.5 w-3.5 opacity-50" style="color: var(--muted)" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                </svg>
              }
              <div class="flex items-center gap-1.5">
                @for (entry of entries(); track entry.developer.id; let i = $index) {
                  <button (click)="goTo(i)"
                          class="h-2 rounded-full transition-all duration-300"
                          [class.w-5]="i === activeIndex()"
                          [class.w-2]="i !== activeIndex()"
                          [style.background]="i === activeIndex() ? 'var(--accent)' : 'var(--border)'">
                  </button>
                }
              </div>
            </div>
          }
        </div>

        <!-- Spotlight cards container -->
        <div class="relative overflow-hidden" style="min-height: 220px"
             (mouseenter)="pauseRotation()" (mouseleave)="resumeRotation()">
          @for (entry of entries(); track entry.developer.id; let i = $index) {
            <div class="spotlight-card"
                 [class.spotlight-active]="i === activeIndex()"
                 [class.spotlight-prev]="i === prevIndex()"
                 [class.spotlight-next]="i !== activeIndex() && i !== prevIndex()">

              <div class="px-5 py-6 sm:py-8 sm:px-6">
                <!-- Top: spotlight label + type chip -->
                <div class="flex items-center justify-between mb-5">
                  <span class="text-[11px] font-semibold uppercase tracking-widest" style="color: var(--accent)">
                    {{ 'recognition.spotlight' | translate }}
                  </span>
                  @if (entry.achievementType) {
                    <span class="rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase"
                          [style.background]="typeBg(entry.achievementType)"
                          [style.color]="typeColor(entry.achievementType)">
                      {{ entry.achievementType }}
                    </span>
                  }
                </div>

                <!-- Main content: avatar + narrative -->
                <div class="flex flex-col sm:flex-row gap-5 sm:gap-6 items-start">

                  <!-- Avatar with glow -->
                  <div class="relative shrink-0 self-center sm:self-start">
                    <div class="absolute inset-0 rounded-full blur-xl opacity-20" style="background: var(--accent)"></div>
                    @if (entry.developer.avatar_url) {
                      <img [src]="entry.developer.avatar_url"
                           [alt]="entry.developer.display_name ?? entry.developer.email"
                           class="relative h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover ring-4 shadow-lg"
                           style="ring-color: color-mix(in srgb, var(--accent) 35%, transparent)"
                           (error)="onImgError($event)" />
                    } @else {
                      <div class="relative flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full text-2xl font-bold ring-4 shadow-lg"
                           style="background: var(--accent); color: white; ring-color: color-mix(in srgb, var(--accent) 35%, transparent)">
                        {{ (entry.developer.display_name ?? entry.developer.email).charAt(0) }}
                      </div>
                    }
                    @if (i === 0) {
                      <span class="absolute -top-1.5 -right-1 text-xl drop-shadow-md">🌟</span>
                    }
                  </div>

                  <!-- Narrative block -->
                  <div class="flex-1 min-w-0 text-center sm:text-left">
                    <h3 class="text-lg sm:text-xl font-bold tracking-tight" style="color: var(--on-surface)">
                      {{ entry.developer.display_name ?? entry.developer.email }}
                    </h3>

                    <!-- Business impact quote -->
                    <div class="mt-3 relative">
                      <svg class="absolute -top-2 -left-1 h-6 w-6 opacity-15 hidden sm:block" style="color: var(--accent)" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10H14.017zM0 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151C7.546 6.068 5.983 8.789 5.983 11H10v10H0z"/>
                      </svg>
                      <p class="text-sm sm:text-base leading-relaxed font-medium sm:pl-6" style="color: var(--on-surface)">
                        {{ entry.businessImpact }}
                      </p>
                    </div>

                    <!-- Impacted users chip -->
                    @if (entry.impactedUsers) {
                      <div class="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1"
                           style="background: color-mix(in srgb, var(--primary-light) 10%, transparent)">
                        <svg class="h-3.5 w-3.5" style="color: var(--primary-light)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"/>
                        </svg>
                        <span class="text-[11px] font-semibold" style="color: var(--primary-light)">
                          {{ entry.impactedUsers }}
                        </span>
                      </div>
                    }

                    <!-- Footer: badges + solutions count -->
                    <div class="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                      <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                            style="background: color-mix(in srgb, var(--on-surface) 6%, transparent); color: var(--muted)">
                        <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        {{ entry.completedCount }} {{ entry.completedCount === 1 ? ('recognition.solutionSingular' | translate) : ('recognition.solutionsDelivered' | translate) }}
                      </span>

                      @for (badge of entry.badges; track badge.key) {
                        <span class="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold"
                              [style.background]="'color-mix(in srgb, ' + badge.color + ' 12%, transparent)'"
                              [style.color]="badge.color">
                          <span>{{ badge.icon }}</span>
                          {{ ('recognition.badge_' + badge.key) | translate }}
                        </span>
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      </section>
    } @else {
      <!-- Empty state -->
      <section class="dash-card p-8 text-center">
        <div class="flex flex-col items-center gap-3">
          <div class="flex h-14 w-14 items-center justify-center rounded-2xl"
               style="background: color-mix(in srgb, var(--purple) 10%, transparent)">
            <svg class="h-7 w-7" style="color: var(--purple)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.896m5.25-6.388a6.003 6.003 0 01-5.25 6.388m0 0a6.023 6.023 0 01-2.77-.896"/>
            </svg>
          </div>
          <p class="text-sm font-medium" style="color: var(--muted)">{{ 'recognition.empty' | translate }}</p>
        </div>
      </section>
    }
  `,
  styles: [`
    .spotlight-card {
      position: absolute;
      inset: 0;
      opacity: 0;
      transform: translateX(30px) scale(0.98);
      transition: opacity 0.55s cubic-bezier(0.22, 1, 0.36, 1),
                  transform 0.55s cubic-bezier(0.22, 1, 0.36, 1);
      pointer-events: none;
    }
    .spotlight-active {
      position: relative;
      opacity: 1;
      transform: translateX(0) scale(1);
      pointer-events: auto;
    }
    .spotlight-prev {
      opacity: 0;
      transform: translateX(-30px) scale(0.98);
    }
    .spotlight-next {
      opacity: 0;
      transform: translateX(30px) scale(0.98);
    }

    /* Progress bar animation */
    .progress-animate {
      animation: progress-fill 6s linear forwards;
    }
    .progress-paused {
      animation-play-state: paused !important;
    }
    @keyframes progress-fill {
      from { width: 0%; }
      to { width: 100%; }
    }
  `],
})
export class RecognitionSpotlightComponent implements OnInit, OnDestroy {
  private dashboard = inject(DashboardService);

  readonly entries = this.dashboard.recognition;
  readonly activeIndex = signal(0);
  readonly prevIndex = signal(-1);
  readonly isPaused = signal(false);

  private intervalId: ReturnType<typeof setInterval> | null = null;
  private readonly ROTATE_MS = 6000;

  ngOnInit(): void {
    this.startRotation();
  }

  ngOnDestroy(): void {
    this.stopRotation();
  }

  goTo(index: number): void {
    if (index === this.activeIndex()) return;
    this.prevIndex.set(this.activeIndex());
    this.activeIndex.set(index);
    this.restartProgressBar();
    this.stopRotation();
    this.startRotation();
  }

  pauseRotation(): void {
    this.isPaused.set(true);
    this.stopRotation();
  }

  resumeRotation(): void {
    this.isPaused.set(false);
    this.startRotation();
  }

  onImgError(event: Event): void {
    (event.target as HTMLImageElement).style.display = 'none';
  }

  typeBg(type: string): string {
    if (type === 'incidencia') return 'color-mix(in srgb, var(--magenta) 12%, transparent)';
    if (type === 'mejora') return 'color-mix(in srgb, var(--primary-light) 12%, transparent)';
    return 'color-mix(in srgb, var(--lime) 12%, transparent)';
  }

  typeColor(type: string): string {
    if (type === 'incidencia') return 'var(--magenta)';
    if (type === 'mejora') return 'var(--primary-light)';
    return 'var(--lime)';
  }

  /** Restart progress bar by forcing a reflow */
  private restartProgressBar(): void {
    // The progress bar resets when activeIndex changes due to Angular re-rendering
  }

  private startRotation(): void {
    if (this.entries().length <= 1) return;
    this.intervalId = setInterval(() => {
      const total = this.entries().length;
      if (total <= 1) return;
      this.prevIndex.set(this.activeIndex());
      this.activeIndex.set((this.activeIndex() + 1) % total);
    }, this.ROTATE_MS);
  }

  private stopRotation(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

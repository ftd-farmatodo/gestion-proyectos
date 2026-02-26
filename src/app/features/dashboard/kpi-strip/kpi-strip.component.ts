import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ElementRef,
  afterNextRender,
} from '@angular/core';
import { DashboardService } from '../dashboard.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface KpiCard {
  key: string;
  icon: string;
  color: string;
  value: number;
}

@Component({
  selector: 'app-kpi-strip',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
      @for (card of cards(); track card.key; let i = $index) {
        <div class="dash-card dash-card-hover animate-scale-in relative overflow-hidden px-4 py-4 sm:px-5 sm:py-5"
             [style.animation-delay.ms]="i * 80">

          <!-- Colored accent bar -->
          <div class="absolute left-0 top-0 h-full w-1 rounded-l-2xl" [style.background]="card.color"></div>

          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-[11px] font-semibold uppercase tracking-wider" style="color: var(--muted)">
                {{ ('dashboard.kpi_' + card.key) | translate }}
              </p>
              <p class="mt-1.5 text-2xl font-bold tabular-nums tracking-tight sm:text-3xl"
                 style="color: var(--on-surface)">
                {{ animatedValues()[i] }}
              </p>
            </div>
            <!-- Icon -->
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                 [style.background]="'color-mix(in srgb, ' + card.color + ' 10%, transparent)'">
              <svg class="h-5 w-5" [style.color]="card.color" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                @switch (card.key) {
                  @case ('total') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z"/>
                  }
                  @case ('inProgress') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z"/>
                  }
                  @case ('completed') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  }
                  @case ('backlog') {
                    <path stroke-linecap="round" stroke-linejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"/>
                  }
                }
              </svg>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class KpiStripComponent implements OnInit, OnDestroy {
  private dashboard = inject(DashboardService);

  readonly cards = computed<KpiCard[]>(() => {
    const k = this.dashboard.kpis();
    return [
      { key: 'total', icon: 'stack', color: 'var(--primary-light)', value: k.total },
      { key: 'inProgress', icon: 'play', color: 'var(--accent)', value: k.inProgress },
      { key: 'completed', icon: 'check', color: 'var(--lime)', value: k.completed },
      { key: 'backlog', icon: 'inbox', color: 'var(--orange)', value: k.backlog },
    ];
  });

  readonly animatedValues = signal<number[]>([0, 0, 0, 0]);
  private rafId: number | null = null;

  constructor() {
    afterNextRender(() => this.startCountUp());
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }

  private startCountUp(): void {
    const targets = this.cards().map((c) => c.value);
    const duration = 600; // ms
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);

      this.animatedValues.set(
        targets.map((t) => Math.round(eased * t))
      );

      if (progress < 1) {
        this.rafId = requestAnimationFrame(tick);
      }
    };

    this.rafId = requestAnimationFrame(tick);
  }
}

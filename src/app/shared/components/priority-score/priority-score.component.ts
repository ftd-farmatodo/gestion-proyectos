import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-priority-score',
  standalone: true,
  template: `
    <div
      class="flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold tabular-nums"
      [style.background]="bgColor()"
      [style.color]="textColor()"
    >
      {{ displayScore() }}
    </div>
  `,
})
export class PriorityScoreComponent {
  score = input.required<number>();

  displayScore = computed(() => {
    const s = this.score();
    return s >= 10 ? Math.round(s).toString() : s.toFixed(1);
  });

  bgColor(): string {
    const s = this.score();
    if (s >= 4) return 'color-mix(in srgb, var(--magenta) 12%, transparent)';
    if (s >= 2.5) return 'color-mix(in srgb, var(--orange) 12%, transparent)';
    return 'color-mix(in srgb, var(--lime) 12%, transparent)';
  }

  textColor(): string {
    const s = this.score();
    if (s >= 4) return 'var(--magenta)';
    if (s >= 2.5) return 'var(--orange)';
    return 'var(--lime)';
  }
}

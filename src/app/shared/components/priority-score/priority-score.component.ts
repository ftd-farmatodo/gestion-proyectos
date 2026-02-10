import { Component, input, computed } from '@angular/core';

@Component({
  selector: 'app-priority-score',
  standalone: true,
  template: `
    <div
      class="flex h-9 w-9 items-center justify-center rounded-lg text-xs font-bold tabular-nums"
      [class]="colorClass()"
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

  colorClass(): string {
    const s = this.score();
    if (s >= 4) return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    if (s >= 2.5) return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  }
}

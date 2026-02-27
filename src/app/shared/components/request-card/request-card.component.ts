import { Component, inject, input, output, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import type { Request } from '../../models/request.model';
import { getImpactLevel } from '../../models/request.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { PriorityScoreComponent } from '../priority-score/priority-score.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { CountryStore } from '../../../core/services/country-store.service';
import { ObjectiveStoreService } from '../../../core/services/objective-store.service';
import { UserStoreService } from '../../../core/services/user-store.service';

@Component({
  selector: 'app-request-card',
  standalone: true,
  imports: [DatePipe, StatusBadgeComponent, PriorityScoreComponent, TranslatePipe],
  template: `
    <div
      class="group relative overflow-hidden rounded-2xl border-l-[3px] p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
      [style.border-left-color]="typeBorderColor()"
      style="background: var(--surface-card); border-top: 1px solid var(--border); border-right: 1px solid var(--border); border-bottom: 1px solid var(--border)"
      (click)="onCardClick($event)"
    >
      <div class="flex items-start justify-between gap-3">
        <div class="flex-1 min-w-0">
          <div class="mb-1.5 flex items-center gap-2">
            <span class="inline-block h-2 w-2 rounded-full shrink-0" [style.background]="typeBorderColor()"></span>
            <span class="text-[11px] font-semibold uppercase tracking-wider" [style.color]="typeBorderColor()">
              {{ ('types.' + request().type) | translate }}
            </span>
          </div>
          <h3 class="text-sm font-semibold leading-snug" style="color: var(--on-surface)">
                <span class="font-mono text-[10px] mr-1.5" style="color: var(--primary-light)">{{ request().internal_id }}</span>{{ request().title }}
              </h3>
          <p class="mt-1 line-clamp-2 text-xs leading-relaxed" style="color: var(--muted)">{{ request().description }}</p>
        </div>
        <div class="flex flex-col items-end gap-1.5 shrink-0">
          <app-priority-score [score]="request().priorityScore" />
          <span class="inline-flex items-center rounded-lg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide"
            [class]="impactBadgeClass()">
            {{ ('impact.' + impactLevel()) | translate }}
          </span>
        </div>
      </div>
      <div class="mt-3 flex items-center gap-2 flex-wrap">
        <app-status-badge [status]="request().status" />
        @if (request().requester_name) {
          <span class="text-[11px]" style="color: var(--on-surface)">
            {{ request().requester_name }}
            @if (request().requester_department) {
              <span style="color: var(--muted)"> · {{ request().requester_department }}</span>
            }
          </span>
        }
        @if ((request().countries ?? []).length > 0) {
          <span class="inline-flex items-center gap-1">
            @for (code of request().countries!; track code) {
              <span class="text-xs" [title]="getCountryName(code)">{{ getCountryFlag(code) }}</span>
            }
          </span>
        }
        @for (obj of linkedObjectives(); track obj.id) {
          <span class="inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-bold font-mono"
                style="background: color-mix(in srgb, var(--accent) 10%, transparent); color: var(--accent)">
            {{ obj.code }}
          </span>
        }
        @for (a of linkedAssignees(); track a.developer_id) {
          <span class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[10px] font-medium" style="background: color-mix(in srgb, var(--primary-light) 12%, transparent); color: var(--primary-light)">
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/>
            </svg>
            {{ getDeveloperName(a.developer_id) }}
          </span>
        }
        <span class="ml-auto text-[11px] tabular-nums" style="color: var(--muted)">
          {{ request().created_at | date:'shortDate' }}
        </span>
      </div>
    </div>
  `,
})
export class RequestCardComponent {
  private countryStore = inject(CountryStore);
  private objectiveStore = inject(ObjectiveStoreService);
  private userStore = inject(UserStoreService);
  request = input.required<Request>();
  openDetail = output<Request>();

  linkedObjectives = computed(() =>
    this.objectiveStore.getObjectivesByRequestId(this.request().id)
  );
  linkedAssignees = computed(() =>
    this.objectiveStore.getAssigneesByRequestId(this.request().id)
  );

  onCardClick(event: MouseEvent): void {
    event.stopPropagation();
    this.openDetail.emit(this.request());
  }

  impactLevel(): string {
    return getImpactLevel(this.request().importance);
  }

  impactBadgeClass(): string {
    const level = this.impactLevel();
    if (level === 'alto') return 'bg-[--magenta]/10 text-[--magenta]';
    if (level === 'medio') return 'bg-[--orange]/10 text-[--orange]';
    return 'bg-[--cool-gray]/10 text-[--cool-gray]';
  }

  typeBorderColor(): string {
    const t = this.request().type;
    if (t === 'incidencia') return 'var(--magenta)';
    if (t === 'mejora') return 'var(--primary-light)';
    return 'var(--lime)';
  }

  getCountryFlag(code: string): string {
    return this.countryStore.getByCode(code)?.flag ?? code;
  }

  getCountryName(code: string): string {
    return this.countryStore.getByCode(code)?.name ?? code;
  }

  getDeveloperName(devId: string): string {
    const dev = this.userStore.getById(devId);
    return dev?.display_name ?? dev?.email ?? devId;
  }
}

import { Component, HostListener, input, output, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { FiscalYearCloseRecord } from '../../../shared/models/fiscal-year.model';
import type { Request, RequestType } from '../../../shared/models/request.model';
import { RequestStoreService } from '../../../core/services/request-store.service';
import { RequestDetailDialogComponent } from '../../../shared/components/request-detail-dialog/request-detail-dialog.component';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { PriorityScoreComponent } from '../../../shared/components/priority-score/priority-score.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { UserStoreService } from '../../../core/services/user-store.service';

@Component({
  selector: 'app-fy-detail-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule, StatusBadgeComponent, PriorityScoreComponent, RequestDetailDialogComponent, TranslatePipe],
  template: `
    <div role="dialog" aria-modal="true"
         class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
         (click)="closeDialog.emit()">
      <div class="relative mx-4 flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border shadow-2xl animate-slide-up"
           style="background: var(--surface-card); border-color: var(--border)"
           (click)="$event.stopPropagation()">

        <!-- Header -->
        <div class="border-b px-6 py-5" style="border-color: var(--border)">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-bold" style="color: var(--on-surface)">
                {{ record().summary.teamName }} &mdash; {{ record().label }}
              </h2>
              <p class="mt-0.5 text-xs" style="color: var(--muted)">
                {{ 'history.closedOn' | translate }} {{ record().closedAt | date:'mediumDate' }}
              </p>
            </div>
            <button (click)="closeDialog.emit()"
                    class="shrink-0 rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                    style="color: var(--muted)"
                    [attr.aria-label]="'detail.close' | translate">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- KPI row -->
          <div class="mt-4 grid grid-cols-4 gap-3">
            <div class="rounded-xl p-3 text-center" style="background: var(--surface-alt)">
              <div class="text-lg font-bold tabular-nums" style="color: var(--on-surface)">{{ record().summary.totalRequests }}</div>
              <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'history.totalRequests' | translate }}</div>
            </div>
            <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--lime) 8%, transparent)">
              <div class="text-lg font-bold tabular-nums" style="color: var(--lime)">{{ record().summary.completed }}</div>
              <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--lime)">{{ 'history.completed' | translate }}</div>
            </div>
            <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--orange) 8%, transparent)">
              <div class="text-lg font-bold tabular-nums" style="color: var(--orange)">{{ record().summary.carriedOver }}</div>
              <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--orange)">{{ 'history.carriedOver' | translate }}</div>
            </div>
            <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--accent) 8%, transparent)">
              <div class="text-lg font-bold tabular-nums" style="color: var(--accent)">{{ record().summary.avgPriorityScore }}</div>
              <div class="text-[9px] font-semibold uppercase tracking-wider" style="color: var(--accent)">{{ 'history.avgScore' | translate }}</div>
            </div>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <!-- Filters -->
          <div class="flex flex-wrap gap-3">
            <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" class="gp-select">
              <option value="all">{{ 'backlog.allTypes' | translate }}</option>
              <option value="incidencia">{{ 'types.incidencia' | translate }}</option>
              <option value="mejora">{{ 'types.mejora' | translate }}</option>
              <option value="proyecto">{{ 'types.proyecto' | translate }}</option>
            </select>
            <select [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)" class="gp-select">
              <option value="all">{{ 'history.allStatuses' | translate }}</option>
              <option value="done">{{ 'history.completed' | translate }}</option>
            </select>
            <select [ngModel]="developerFilter()" (ngModelChange)="developerFilter.set($event)" class="gp-select">
              <option value="all">{{ 'matrix.allPeople' | translate }}</option>
              <option value="__unassigned__">{{ 'detail.unassigned' | translate }}</option>
              @for (dev of availableDevelopers(); track dev.id) {
                <option [value]="dev.id">{{ dev.name }}</option>
              }
            </select>
            <div class="flex-1 min-w-[200px]">
              <input type="text" [ngModel]="searchQuery()" (ngModelChange)="searchQuery.set($event)"
                     [placeholder]="'backlog.searchPlaceholder' | translate"
                     class="w-full rounded-xl border px-3 py-1.5 text-sm focus:ring-2"
                     style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)" />
            </div>
          </div>

          <!-- Request list -->
          @if (filteredRequests().length > 0) {
            <div class="space-y-2">
              @for (req of filteredRequests(); track req.id) {
                <div class="group flex items-center gap-3 rounded-xl border px-4 py-3 cursor-pointer transition-all hover:shadow-md"
                     style="background: var(--surface-card); border-color: var(--border)"
                     [style.border-left]="'3px solid ' + typeColor(req.type)"
                     (click)="selectedRequest.set(req)">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-0.5">
                      <span class="font-mono text-[10px] font-semibold" style="color: var(--primary-light)">{{ req.internal_id }}</span>
                      <span class="text-[10px] font-semibold uppercase tracking-wider" [style.color]="typeColor(req.type)">
                        {{ req.type }}
                      </span>
                      <app-status-badge [status]="req.status" />
                    </div>
                    <p class="text-sm font-medium truncate" style="color: var(--on-surface)">{{ req.title }}</p>
                    @if (req.developer_id) {
                      <span class="text-[10px]" style="color: var(--muted)">{{ getDeveloperName(req.developer_id) }}</span>
                    }
                  </div>
                  <app-priority-score [score]="req.priorityScore" />
                </div>
              }
            </div>
          } @else {
            <div class="py-12 text-center">
              <p class="text-sm italic" style="color: var(--muted)">{{ 'history.noRequests' | translate }}</p>
            </div>
          }
        </div>
      </div>
    </div>

    @if (selectedRequest(); as req) {
      <app-request-detail-dialog
        [request]="req"
        (closeDialog)="selectedRequest.set(null)"
        (addComment)="noop()"
      />
    }
  `,
})
export class FyDetailDialogComponent {
  private store = inject(RequestStoreService);
  private userStore = inject(UserStoreService);

  record = input.required<FiscalYearCloseRecord>();
  closeDialog = output<void>();

  selectedRequest = signal<Request | null>(null);
  typeFilter = signal<string>('all');
  statusFilter = signal<string>('all');
  developerFilter = signal<string>('all');
  searchQuery = signal<string>('');

  /** All requests from this closed FY */
  private fyRequests = computed(() => {
    const r = this.record();
    return this.store.requests().filter(
      (req) => req.team_id === r.teamId && req.fiscal_year === r.fyKey
    );
  });

  /** Distinct developers that appear in this FY's requests */
  availableDevelopers = computed(() => {
    const devIds = new Set(
      this.fyRequests()
        .map((r) => r.developer_id)
        .filter((id): id is string => !!id)
    );
    return [...devIds].map((id) => {
      const user = this.userStore.getById(id);
      return { id, name: user?.display_name ?? user?.email ?? id };
    }).sort((a, b) => a.name.localeCompare(b.name));
  });

  filteredRequests = computed(() => {
    let list = this.fyRequests();
    const type = this.typeFilter();
    if (type !== 'all') list = list.filter((r) => r.type === type);
    const status = this.statusFilter();
    if (status !== 'all') list = list.filter((r) => r.status === status);
    const dev = this.developerFilter();
    if (dev === '__unassigned__') {
      list = list.filter((r) => !r.developer_id);
    } else if (dev !== 'all') {
      list = list.filter((r) => r.developer_id === dev);
    }
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) => r.title.toLowerCase().includes(q) || r.internal_id.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => b.priorityScore - a.priorityScore);
  });

  getDeveloperName(devId: string): string {
    const dev = this.userStore.getById(devId);
    return dev?.display_name ?? dev?.email ?? devId;
  }

  typeColor(type: RequestType): string {
    if (type === 'incidencia') return 'var(--magenta)';
    if (type === 'mejora') return 'var(--primary-light)';
    return 'var(--lime)';
  }

  @HostListener('document:keydown.escape')
  onEscapeKey(): void {
    this.closeDialog.emit();
  }

  noop(): void { /* read-only, comments not supported in history */ }
}

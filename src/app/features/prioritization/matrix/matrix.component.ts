import { Component, inject, signal, computed, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { PrioritizationService } from '../prioritization.service';
import { QuadrantComponent } from '../quadrant/quadrant.component';
import { RequestDetailDialogComponent } from '../../../shared/components/request-detail-dialog/request-detail-dialog.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StatusConfigStore } from '../../../core/services/status-config.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import type { Request, RequestType, StatusConfig } from '../../../shared/models/request.model';

const QUADRANT_IDS = ['q1', 'q2', 'q3', 'q4'] as const;

type AssignmentFilter = 'all' | 'assigned' | 'unassigned';

@Component({
  selector: 'app-matrix',
  standalone: true,
  imports: [FormsModule, QuadrantComponent, RequestDetailDialogComponent, TranslatePipe],
  template: `
    <div class="space-y-5 p-4 lg:p-6 animate-fade-in">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--on-surface)">{{ 'matrix.title' | translate }}</h1>
        <p class="mt-1 text-sm" style="color: var(--muted)">
          {{ 'matrix.description' | translate }}
          <span class="ml-2 text-xs italic" style="color: var(--cool-gray)">{{ 'matrix.axisHint' | translate }}</span>
        </p>
      </div>

      <!-- Quick filters -->
      <div class="flex flex-wrap items-center gap-3">
        <!-- Type filter pills -->
        <div class="flex items-center rounded-xl border overflow-hidden" style="border-color: var(--border)">
          <button
            (click)="typeFilter.set('all')"
            class="px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [style.background]="typeFilter() === 'all' ? 'var(--primary)' : 'var(--surface-card)'"
            [style.color]="typeFilter() === 'all' ? 'white' : 'var(--muted)'"
          >{{ 'matrix.allTypes' | translate }}</button>
          <button
            (click)="typeFilter.set('incidencia')"
            class="px-3 py-1.5 text-[11px] font-semibold transition-colors border-l"
            [style.border-color]="'var(--border)'"
            [style.background]="typeFilter() === 'incidencia' ? 'var(--magenta)' : 'var(--surface-card)'"
            [style.color]="typeFilter() === 'incidencia' ? 'white' : 'var(--magenta)'"
          >{{ 'types.incidencia' | translate }}</button>
          <button
            (click)="typeFilter.set('mejora')"
            class="px-3 py-1.5 text-[11px] font-semibold transition-colors border-l"
            [style.border-color]="'var(--border)'"
            [style.background]="typeFilter() === 'mejora' ? 'var(--primary-light)' : 'var(--surface-card)'"
            [style.color]="typeFilter() === 'mejora' ? 'white' : 'var(--primary-light)'"
          >{{ 'types.mejora' | translate }}</button>
          <button
            (click)="typeFilter.set('proyecto')"
            class="px-3 py-1.5 text-[11px] font-semibold transition-colors border-l"
            [style.border-color]="'var(--border)'"
            [style.background]="typeFilter() === 'proyecto' ? 'var(--lime)' : 'var(--surface-card)'"
            [style.color]="typeFilter() === 'proyecto' ? 'white' : 'var(--lime)'"
          >{{ 'types.proyecto' | translate }}</button>
        </div>

        <!-- Assignment filter pills -->
        <div class="flex items-center rounded-xl border overflow-hidden" style="border-color: var(--border)">
          <button
            (click)="assignmentFilter.set('all')"
            class="px-3 py-1.5 text-[11px] font-semibold transition-colors"
            [style.background]="assignmentFilter() === 'all' ? 'var(--primary)' : 'var(--surface-card)'"
            [style.color]="assignmentFilter() === 'all' ? 'white' : 'var(--muted)'"
          >{{ 'matrix.allAssignment' | translate }}</button>
          <button
            (click)="assignmentFilter.set('assigned')"
            class="px-3 py-1.5 text-[11px] font-semibold transition-colors border-l"
            [style.border-color]="'var(--border)'"
            [style.background]="assignmentFilter() === 'assigned' ? 'var(--accent)' : 'var(--surface-card)'"
            [style.color]="assignmentFilter() === 'assigned' ? 'white' : 'var(--accent)'"
          >{{ 'matrix.assigned' | translate }}</button>
          <button
            (click)="assignmentFilter.set('unassigned')"
            class="px-3 py-1.5 text-[11px] font-semibold transition-colors border-l"
            [style.border-color]="'var(--border)'"
            [style.background]="assignmentFilter() === 'unassigned' ? 'var(--orange)' : 'var(--surface-card)'"
            [style.color]="assignmentFilter() === 'unassigned' ? 'white' : 'var(--orange)'"
          >{{ 'matrix.unassigned' | translate }}</button>
        </div>

        <!-- Person filter dropdown -->
        <select
          [ngModel]="personFilter()"
          (ngModelChange)="personFilter.set($event)"
          class="gp-select gp-select-sm">
          <option value="all">{{ 'matrix.allPeople' | translate }}</option>
          @for (dev of developers(); track dev.id) {
            <option [value]="dev.id">{{ dev.display_name ?? dev.email }}</option>
          }
        </select>

        <!-- Status filter dropdown -->
        <select
          [ngModel]="statusFilter()"
          (ngModelChange)="statusFilter.set($event)"
          class="gp-select gp-select-sm">
          <option value="all">{{ 'matrix.allStatuses' | translate }}</option>
          @for (s of activeStatuses(); track s.key) {
            <option [value]="s.key">{{ statusLabel(s) }}</option>
          }
        </select>

        <!-- Counter -->
        <span class="text-[11px] font-medium" style="color: var(--muted)">
          {{ 'matrix.showing' | translate }} {{ filteredTotal() }} {{ 'matrix.of' | translate }} {{ totalRequests() }}
        </span>

        <!-- Clear filters (only visible when active) -->
        @if (hasActiveFilters()) {
          <button
            (click)="clearFilters()"
            class="ml-auto inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
            style="color: var(--muted)"
          >
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
            {{ 'matrix.clearFilters' | translate }}
          </button>
        }
      </div>

      <!-- Matrix grid -->
      <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <app-quadrant
          quadrantKey="q1"
          [title]="'matrix.q1' | translate"
          [requests]="fq1()"
          [connectedTo]="quadrantIds"
          (openDetail)="onOpenDetail($event)"
        />
        <app-quadrant
          quadrantKey="q2"
          [title]="'matrix.q2' | translate"
          [requests]="fq2()"
          [connectedTo]="quadrantIds"
          (openDetail)="onOpenDetail($event)"
        />
        <app-quadrant
          quadrantKey="q3"
          [title]="'matrix.q3' | translate"
          [requests]="fq3()"
          [connectedTo]="quadrantIds"
          (openDetail)="onOpenDetail($event)"
        />
        <app-quadrant
          quadrantKey="q4"
          [title]="'matrix.q4' | translate"
          [requests]="fq4()"
          [connectedTo]="quadrantIds"
          (openDetail)="onOpenDetail($event)"
        />
      </div>
    </div>

    @if (selectedRequest()) {
      <app-request-detail-dialog
        [request]="selectedRequest()!"
        (closeDialog)="selectedRequest.set(null)"
        (addComment)="onAddComment($event)"
      />
    }
  `,
})
export class MatrixComponent implements OnDestroy {
  private statusConfigStore = inject(StatusConfigStore);
  private appContext = inject(AppContextService);
  private route = inject(ActivatedRoute);
  private userStore = inject(UserStoreService);

  quadrantIds = QUADRANT_IDS as unknown as string[];
  selectedRequest = signal<Request | null>(null);

  /** Available developers for the person filter */
  developers = computed(() => {
    const teamId = this.appContext.activeTeamId();
    return this.userStore.all().filter(
      (u) => (u.role === 'developer' || u.role === 'admin') && u.team_id === teamId
    );
  });

  /** Active statuses for the status filter */
  activeStatuses = computed(() => this.statusConfigStore.active());

  /** Filter state */
  typeFilter = signal<'all' | RequestType>('all');
  assignmentFilter = signal<AssignmentFilter>('all');
  personFilter = signal<string>('all');
  statusFilter = signal<string>('all');

  private querySub: Subscription;

  constructor(public prioritization: PrioritizationService) {
    this.querySub = this.route.queryParamMap.subscribe((params) => {
      const requestId = params.get('requestId');
      if (!requestId) return;
      const req = this.prioritization.requests().find((r) => r.id === requestId);
      if (req) this.selectedRequest.set({ ...req });
    });
  }

  /** Localized label for a status config */
  statusLabel(cfg: StatusConfig): string {
    return cfg.label_es;
  }

  /** Apply all filters to a request list */
  private applyFilters(requests: Request[]): Request[] {
    let list = requests;

    const type = this.typeFilter();
    if (type !== 'all') {
      list = list.filter((r) => r.type === type);
    }

    const assign = this.assignmentFilter();
    if (assign === 'assigned') {
      list = list.filter((r) => r.developer_id != null);
    } else if (assign === 'unassigned') {
      list = list.filter((r) => r.developer_id == null);
    }

    const person = this.personFilter();
    if (person !== 'all') {
      list = list.filter((r) => r.developer_id === person);
    }

    const status = this.statusFilter();
    if (status !== 'all') {
      list = list.filter((r) => r.status === status);
    }

    return list;
  }

  /** Filtered quadrants */
  fq1 = computed(() => this.applyFilters(this.prioritization.q1()));
  fq2 = computed(() => this.applyFilters(this.prioritization.q2()));
  fq3 = computed(() => this.applyFilters(this.prioritization.q3()));
  fq4 = computed(() => this.applyFilters(this.prioritization.q4()));

  /** Counters */
  filteredTotal = computed(() =>
    this.fq1().length + this.fq2().length + this.fq3().length + this.fq4().length
  );
  totalRequests = computed(() =>
    this.prioritization.q1().length + this.prioritization.q2().length +
    this.prioritization.q3().length + this.prioritization.q4().length
  );

  hasActiveFilters(): boolean {
    return (
      this.typeFilter() !== 'all' ||
      this.assignmentFilter() !== 'all' ||
      this.personFilter() !== 'all' ||
      this.statusFilter() !== 'all'
    );
  }

  clearFilters(): void {
    this.typeFilter.set('all');
    this.assignmentFilter.set('all');
    this.personFilter.set('all');
    this.statusFilter.set('all');
  }

  onOpenDetail(request: Request): void {
    this.selectedRequest.set(request);
  }

  onAddComment(event: { requestId: string; text: string }): void {
    this.prioritization.addComment(event.requestId, event.text);
    const updated = this.prioritization.requests().find(r => r.id === event.requestId);
    if (updated) {
      this.selectedRequest.set({ ...updated });
    }
  }

  ngOnDestroy(): void {
    this.querySub.unsubscribe();
  }
}

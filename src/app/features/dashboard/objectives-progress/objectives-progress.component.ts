import { Component, inject, signal, computed } from '@angular/core';
import { LowerCasePipe } from '@angular/common';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { ObjectiveStoreService } from '../../../core/services/objective-store.service';
import { RequestStoreService } from '../../../core/services/request-store.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { AppContextService } from '../../../core/services/app-context.service';
import type { Objective } from '../../../shared/models/request.model';

interface ObjectiveProgress {
  objective: Objective;
  totalLinked: number;
  completedCount: number;
  inProgressCount: number;
  percentage: number;
  developers: { id: string; name: string; completed: number; inProgress: number }[];
}

@Component({
  selector: 'app-objectives-progress',
  standalone: true,
  imports: [TranslatePipe, LowerCasePipe],
  template: `
    <div class="dash-card p-5">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-sm font-bold tracking-tight" style="color: var(--on-surface)">
            {{ 'objectives.progress' | translate }}
          </h2>
          <p class="text-[10px] mt-0.5" style="color: var(--muted)">{{ 'objectives.progressSubtitle' | translate }}</p>
        </div>
      </div>

      @if (objectiveProgress().length === 0) {
        <div class="text-center py-6">
          <div class="inline-flex items-center justify-center w-10 h-10 rounded-xl mb-2"
               style="background: color-mix(in srgb, var(--accent) 10%, transparent)">
            <svg class="w-5 h-5" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"/>
            </svg>
          </div>
          <p class="text-xs" style="color: var(--muted)">{{ 'objectives.noObjectivesYet' | translate }}</p>
          <p class="text-[10px] mt-0.5" style="color: var(--muted)">{{ 'objectives.noObjectivesHint' | translate }}</p>
        </div>
      } @else {
        <div class="space-y-3">
          @for (item of objectiveProgress(); track item.objective.id) {
            <div class="rounded-xl border p-4 transition-all"
                 style="border-color: var(--border); background: var(--surface-alt)"
                 (click)="toggleExpanded(item.objective.id)">
              <!-- Header -->
              <div class="flex items-center justify-between cursor-pointer">
                <div class="flex items-center gap-2 min-w-0">
                  <span class="font-mono text-[10px] px-1.5 py-0.5 rounded shrink-0"
                        style="background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent)">
                    {{ item.objective.code }}
                  </span>
                  <span class="text-sm font-semibold truncate" style="color: var(--on-surface)">{{ item.objective.title }}</span>
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  <span class="text-[10px] font-semibold" style="color: var(--muted)">
                    {{ item.completedCount }} / {{ item.totalLinked }}
                  </span>
                  <svg class="w-3.5 h-3.5 transition-transform" style="color: var(--muted)"
                       [style.transform]="expandedObjective() === item.objective.id ? 'rotate(180deg)' : 'rotate(0)'"
                       fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5"/>
                  </svg>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="mt-2.5 h-1.5 rounded-full overflow-hidden" style="background: color-mix(in srgb, var(--on-surface) 8%, transparent)">
                <div class="h-full rounded-full transition-all duration-500"
                     [style.width.%]="item.percentage"
                     [style.background]="item.percentage >= 100 ? 'var(--lime)' : item.percentage >= 50 ? 'var(--accent)' : 'var(--primary-light)'">
                </div>
              </div>
              <div class="flex justify-between mt-1">
                <span class="text-[9px]" style="color: var(--muted)">
                  {{ item.inProgressCount }} {{ 'status.in_progress' | translate | lowercase }}
                </span>
                <span class="text-[9px] font-semibold"
                      [style.color]="item.percentage >= 100 ? 'var(--lime)' : 'var(--muted)'">
                  {{ item.percentage }}%
                </span>
              </div>

              <!-- Expanded: developer breakdown -->
              @if (expandedObjective() === item.objective.id) {
                <div class="mt-3 pt-3 border-t space-y-2" style="border-color: var(--border)">
                  @if (item.developers.length === 0) {
                    <p class="text-[10px] italic" style="color: var(--muted)">{{ 'objectives.empty' | translate }}</p>
                  } @else {
                    @for (dev of item.developers; track dev.id) {
                      <div class="flex items-center justify-between">
                        <span class="text-[11px] font-medium" style="color: var(--on-surface)">{{ dev.name }}</span>
                        <div class="flex items-center gap-2">
                          <span class="text-[10px] px-1.5 py-0.5 rounded"
                                style="background: color-mix(in srgb, var(--lime) 12%, transparent); color: var(--lime)">
                            {{ dev.completed }} {{ 'objectives.completed' | translate }}
                          </span>
                          @if (dev.inProgress > 0) {
                            <span class="text-[10px] px-1.5 py-0.5 rounded"
                                  style="background: color-mix(in srgb, var(--primary-light) 12%, transparent); color: var(--primary-light)">
                              {{ dev.inProgress }} {{ 'status.in_progress' | translate | lowercase }}
                            </span>
                          }
                        </div>
                      </div>
                    }
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class ObjectivesProgressComponent {
  private objectiveStore = inject(ObjectiveStoreService);
  private requestStore = inject(RequestStoreService);
  private userStore = inject(UserStoreService);
  private appContext = inject(AppContextService);

  expandedObjective = signal<string | null>(null);

  toggleExpanded(id: string): void {
    this.expandedObjective.update((cur) => (cur === id ? null : id));
  }

  readonly objectiveProgress = computed<ObjectiveProgress[]>(() => {
    const objectives = this.objectiveStore.activeObjectives();
    const allRequests = this.requestStore.contextRequests();
    const roMappings = this.objectiveStore.requestObjectives();
    const raMappings = this.objectiveStore.requestAssignees();

    return objectives.map((obj) => {
      const linkedRequestIds = roMappings
        .filter((ro) => ro.objective_id === obj.id)
        .map((ro) => ro.request_id);

      const linkedRequests = allRequests.filter((r) => linkedRequestIds.includes(r.id));
      const completedCount = linkedRequests.filter((r) => r.status === 'done').length;
      const inProgressCount = linkedRequests.filter((r) => r.status === 'in_progress' || r.status === 'qa_review').length;
      const total = linkedRequests.length || 1;
      const percentage = Math.min(100, Math.round((completedCount / total) * 100));

      const devMap = new Map<string, { completed: number; inProgress: number }>();
      for (const req of linkedRequests) {
        const assignees = raMappings
          .filter((ra) => ra.request_id === req.id)
          .map((ra) => ra.developer_id);
        for (const devId of assignees) {
          const entry = devMap.get(devId) ?? { completed: 0, inProgress: 0 };
          if (req.status === 'done') entry.completed++;
          else if (req.status === 'in_progress' || req.status === 'qa_review') entry.inProgress++;
          devMap.set(devId, entry);
        }
      }

      const developers = [...devMap.entries()].map(([id, counts]) => {
        const user = this.userStore.getById(id);
        return {
          id,
          name: user?.display_name ?? user?.email ?? id,
          ...counts,
        };
      }).sort((a, b) => b.completed - a.completed);

      return {
        objective: obj,
        totalLinked: linkedRequests.length,
        completedCount,
        inProgressCount,
        percentage,
        developers,
      };
    });
  });
}

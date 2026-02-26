import { Component, HostListener, inject, input, output, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import type { Request, Comment, ActivityEntry, StatusConfig } from '../../models/request.model';
import { getImpactLevel } from '../../models/request.model';
import { StatusBadgeComponent } from '../status-badge/status-badge.component';
import { PriorityScoreComponent } from '../priority-score/priority-score.component';
import { TranslatePipe } from '../../pipes/translate.pipe';
import { ActivityStoreService } from '../../../core/services/activity-store.service';
import { AuthService } from '../../../core/auth/auth.service';
import { RequestStoreService } from '../../../core/services/request-store.service';
import { StatusConfigStore } from '../../../core/services/status-config.service';
import { FocusTrackerService } from '../../../core/services/focus-tracker.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { ActivityLoggerService } from '../../../core/services/activity-logger.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { CountryStore } from '../../../core/services/country-store.service';
import { AffectedModuleStore } from '../../../core/services/affected-module-store.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { I18nService } from '../../../core/services/i18n.service';
import { formatDurationLabel } from './request-detail-dialog.utils';

@Component({
  selector: 'app-request-detail-dialog',
  standalone: true,
  imports: [DatePipe, FormsModule, StatusBadgeComponent, PriorityScoreComponent, TranslatePipe],
  template: `
    <!-- Overlay -->
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
      (click)="onOverlayClick($event)"
    >
      <!-- Panel -->
      <div
        class="relative mx-4 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border shadow-2xl animate-slide-up"
        style="background: color-mix(in srgb, var(--surface-card) 95%, transparent); border-color: color-mix(in srgb, var(--border) 60%, transparent)"
        (click)="$event.stopPropagation()"
      >
        <!-- Header with type-colored top border -->
        <div class="relative border-b px-6 py-5" style="border-color: var(--border)">
          <div class="absolute inset-x-0 top-0 h-1" [style.background]="typeColor()"></div>
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0 flex-1">
              <div class="mb-2 flex items-center gap-2">
                <span class="inline-block h-2.5 w-2.5 rounded-full" [style.background]="typeColor()"></span>
                <span class="text-[11px] font-semibold uppercase tracking-wider" [style.color]="typeColor()">
                  {{ ('types.' + request().type) | translate }}
                </span>
                <app-status-badge [status]="request().status" />
              </div>
              <h2 class="text-lg font-bold leading-snug" style="color: var(--on-surface)">
                <span class="font-mono text-xs mr-2" style="color: var(--primary-light)">{{ request().internal_id }}</span>{{ request().title }}
              </h2>

              <!-- Focus button for assigned developer -->
              @if (canSetFocus()) {
                @if (isMyCurrentFocus()) {
                  <button (click)="toggleFocus()"
                    class="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all"
                    style="background: color-mix(in srgb, var(--lime) 15%, transparent); color: var(--lime)">
                    <span class="relative flex h-2 w-2">
                      <span class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style="background: var(--lime)"></span>
                      <span class="relative inline-flex h-2 w-2 rounded-full" style="background: var(--lime)"></span>
                    </span>
                    {{ 'detail.currentFocus' | translate }}
                    <svg class="h-3 w-3 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                  </button>
                } @else {
                  <button (click)="toggleFocus()"
                    class="mt-2 inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all hover:shadow-sm"
                    style="border-color: var(--border); color: var(--muted); background: var(--surface-alt)">
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5M16.5 20.25H18A2.25 2.25 0 0020.25 18v-1.5M7.5 20.25H6A2.25 2.25 0 013.75 18v-1.5M12 12h.008v.008H12V12zm0 0a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z"/>
                    </svg>
                    {{ 'detail.setAsFocus' | translate }}
                  </button>
                }
              }
            </div>
            <button
              (click)="closeDialog.emit()"
              class="shrink-0 rounded-xl p-2 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
              style="color: var(--muted)"
              [attr.aria-label]="'detail.close' | translate">
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Body -->
        <div class="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          <!-- Requester info -->
          @if (request().requester_name) {
            <div class="flex items-center gap-3 rounded-xl border px-4 py-2.5"
                 style="background: color-mix(in srgb, var(--primary-light) 4%, var(--surface-alt)); border-color: var(--border)">
              <svg class="h-4 w-4 shrink-0" style="color: var(--primary-light)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
              </svg>
              <div>
                <span class="text-xs font-semibold" style="color: var(--on-surface)">{{ request().requester_name }}</span>
                @if (request().requester_department) {
                  <span class="mx-1.5 text-[10px]" style="color: var(--border)">·</span>
                  <span class="text-xs" style="color: var(--muted)">{{ request().requester_department }}</span>
                }
              </div>
              <span class="ml-auto text-[9px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'detail.requester' | translate }}</span>
            </div>
          }

          <!-- Countries -->
          @if ((request().countries ?? []).length > 0) {
            <div class="flex items-center gap-2 flex-wrap">
              <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'detail.countries' | translate }}</span>
              @for (code of request().countries!; track code) {
                <span class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium"
                  style="background: color-mix(in srgb, var(--accent) 8%, var(--surface-alt)); color: var(--on-surface)">
                  {{ getCountryFlag(code) }} {{ getCountryName(code) }}
                </span>
              }
            </div>
          }

          <!-- Description -->
          <p class="text-sm leading-relaxed whitespace-pre-line" style="color: var(--on-surface)">{{ request().description }}</p>

          <!-- ═══ Extended Fields (type-specific) ═══ -->
          @if (request().affected_module || request().steps_to_reproduce || request().business_justification) {
            <div class="space-y-3 rounded-2xl border p-4" style="background: var(--surface-alt); border-color: var(--border)">
              @if (request().affected_module) {
                <div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'detail.affectedModule' | translate }}</span>
                  <p class="mt-0.5 text-sm font-medium" style="color: var(--on-surface)">{{ moduleStore.getLabel(request().affected_module) }}</p>
                </div>
              }

              <!-- Incidencia fields -->
              @if (request().steps_to_reproduce) {
                <div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--magenta)">{{ 'detail.stepsToReproduce' | translate }}</span>
                  <p class="mt-0.5 text-sm whitespace-pre-line" style="color: var(--on-surface)">{{ request().steps_to_reproduce }}</p>
                </div>
              }
              @if (request().expected_behavior || request().actual_behavior) {
                <div class="grid gap-3 sm:grid-cols-2">
                  @if (request().expected_behavior) {
                    <div class="rounded-xl border p-3" style="border-color: color-mix(in srgb, var(--accent) 30%, var(--border))">
                      <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--accent)">{{ 'detail.expectedBehavior' | translate }}</span>
                      <p class="mt-0.5 text-sm" style="color: var(--on-surface)">{{ request().expected_behavior }}</p>
                    </div>
                  }
                  @if (request().actual_behavior) {
                    <div class="rounded-xl border p-3" style="border-color: color-mix(in srgb, var(--magenta) 30%, var(--border))">
                      <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--magenta)">{{ 'detail.actualBehavior' | translate }}</span>
                      <p class="mt-0.5 text-sm" style="color: var(--on-surface)">{{ request().actual_behavior }}</p>
                    </div>
                  }
                </div>
              }
              @if (request().affected_url) {
                <div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'detail.affectedUrl' | translate }}</span>
                  <p class="mt-0.5 text-sm" style="color: var(--on-surface)">{{ request().affected_url }}</p>
                </div>
              }

              <!-- Mejora/Proyecto fields -->
              @if (request().business_justification) {
                <div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'detail.businessJustification' | translate }}</span>
                  <p class="mt-0.5 text-sm" style="color: var(--on-surface)">{{ request().business_justification }}</p>
                </div>
              }
              @if (request().expected_benefit) {
                <div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'detail.expectedBenefit' | translate }}</span>
                  <p class="mt-0.5 text-sm" style="color: var(--on-surface)">{{ request().expected_benefit }}</p>
                </div>
              }
              @if (request().impacted_users) {
                <div>
                  <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'detail.impactedUsers' | translate }}</span>
                  <p class="mt-0.5 text-sm" style="color: var(--on-surface)">{{ request().impacted_users }}</p>
                </div>
              }
            </div>
          }

          <!-- ═══ Attachments ═══ -->
          @if (request().attachments && request().attachments!.length > 0) {
            <div class="space-y-2">
              <h3 class="text-sm font-semibold" style="color: var(--on-surface)">
                {{ 'detail.attachments' | translate }}
                <span class="ml-1 text-xs font-normal" style="color: var(--muted)">({{ request().attachments!.length }})</span>
              </h3>
              <div class="flex flex-wrap gap-2">
                @for (file of request().attachments!; track file.id) {
                  @if (file.type.startsWith('image/')) {
                    <a [href]="file.url || file.data" target="_blank" class="block">
                      <img [src]="file.url || file.data"
                        [alt]="file.name"
                        loading="lazy"
                        class="h-20 w-20 rounded-xl object-cover border transition-transform hover:scale-105"
                        style="border-color: var(--border)" />
                    </a>
                  } @else {
                    <a [href]="file.url || file.data || null" target="_blank" class="flex items-center gap-2 rounded-xl border px-3 py-2"
                      style="background: var(--surface-alt); border-color: var(--border)">
                      <div class="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold"
                        style="background: color-mix(in srgb, var(--primary-light) 10%, transparent); color: var(--primary-light)">
                        {{ file.name.split('.').pop()?.toUpperCase() }}
                      </div>
                      <span class="text-xs font-medium" style="color: var(--on-surface)">{{ file.name }}</span>
                    </a>
                  }
                }
              </div>
            </div>
          }

          <!-- ═══ Status & Assignment controls (admin/developer only) ═══ -->
          @if (canManage()) {
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- Status change -->
              <div class="rounded-2xl border p-3" style="background: var(--surface-alt); border-color: var(--border)">
                <div class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color: var(--muted)">
                  {{ 'detail.changeStatus' | translate }}
                </div>
                <div class="flex flex-wrap gap-1.5">
                  @for (t of allowedTransitions(); track t.key) {
                    <button
                      (click)="onChangeStatus(t.key)"
                      class="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-all hover:shadow-sm"
                      [style.background]="t.bgColor"
                      [style.color]="t.color"
                    >
                      <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"/>
                      </svg>
                      {{ statusLabel(t) }}
                    </button>
                  }
                  @if (allowedTransitions().length === 0) {
                    <span class="text-[11px] italic" style="color: var(--muted)">{{ 'detail.noTransitions' | translate }}</span>
                  }
                </div>
              </div>

              <!-- Developer assignment -->
              <div class="rounded-2xl border p-3" style="background: var(--surface-alt); border-color: var(--border)">
                <div class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color: var(--muted)">
                  {{ 'detail.assignDeveloper' | translate }}
                </div>
                <select
                  [ngModel]="request().developer_id"
                  (ngModelChange)="onAssignDeveloper($event)"
                  class="w-full gp-select">
                  <option [ngValue]="null">{{ 'detail.unassigned' | translate }}</option>
                  @for (dev of developers(); track dev.id) {
                    <option [ngValue]="dev.id">{{ dev.display_name ?? dev.email }}</option>
                  }
                </select>
                @if (assignedDeveloperName()) {
                  <div class="mt-1.5 flex items-center gap-1.5">
                    <div class="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold"
                      style="background: var(--accent); color: white">
                      {{ assignedDeveloperName()!.charAt(0) }}
                    </div>
                    <span class="text-[11px] font-medium" style="color: var(--on-surface)">{{ assignedDeveloperName() }}</span>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Metrics grid -->
          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div class="rounded-2xl p-3 text-center" style="background: var(--surface-alt)">
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">
                {{ 'detail.impactLevel' | translate }}
              </div>
              <span class="mt-1.5 inline-flex items-center rounded-lg px-2.5 py-0.5 text-xs font-bold uppercase"
                [style.background]="impactBg()" [style.color]="impactColor()">
                {{ ('impact.' + impactLevel()) | translate }}
              </span>
            </div>
            <div class="rounded-2xl p-3 text-center" style="background: var(--surface-alt)">
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">
                {{ 'detail.urgency' | translate }}
              </div>
              <div class="mt-1.5 text-xl font-bold tabular-nums" style="color: var(--on-surface)">{{ request().urgency }}</div>
            </div>
            <!-- Complexity: hidden for now, enable when needed
            <div class="rounded-2xl p-3 text-center" style="background: var(--surface-alt)">
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">
                {{ 'detail.complexity' | translate }}
              </div>
              <div class="mt-1.5 text-xl font-bold tabular-nums" style="color: var(--on-surface)">{{ request().complexity }}</div>
            </div>
            -->
            <div class="rounded-2xl p-3 text-center" style="background: var(--surface-alt)">
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">
                {{ 'detail.priorityScore' | translate }}
              </div>
              <div class="mt-1.5 flex justify-center">
                <app-priority-score [score]="request().priorityScore" />
              </div>
            </div>
          </div>

          <!-- Dates -->
          <div class="flex gap-4 text-[11px]" style="color: var(--muted)">
            <span>{{ 'detail.created' | translate }}: {{ request().created_at | date:'medium' }}</span>
            <span>{{ 'detail.updated' | translate }}: {{ request().updated_at | date:'medium' }}</span>
          </div>

          <!-- Comments -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold" style="color: var(--on-surface)">
              {{ 'detail.comments' | translate }}
              <span class="ml-1 text-xs font-normal" style="color: var(--muted)">({{ request().comments.length }})</span>
            </h3>

            @if (!isReadOnly()) {
              <div class="flex gap-2">
                <textarea
                  [(ngModel)]="newCommentText"
                  [placeholder]="'detail.commentPlaceholder' | translate"
                  rows="2"
                  class="flex-1 rounded-xl border px-3 py-2 text-sm shadow-sm focus:ring-2 resize-none"
                  style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                ></textarea>
                <button
                  (click)="onAddComment()"
                  [disabled]="!newCommentText.trim()"
                  class="self-end rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 hover:shadow-md disabled:opacity-40"
                  style="background: var(--accent)"
                >
                  {{ 'detail.addComment' | translate }}
                </button>
              </div>
            }

            @if (request().comments && request().comments.length > 0) {
              <div class="space-y-2">
                @for (comment of sortedComments(); track comment.id) {
                  <div class="rounded-xl border-l-2 p-3" style="background: var(--surface-alt); border-left-color: var(--accent)">
                    <p class="text-sm" style="color: var(--on-surface)">{{ comment.text }}</p>
                    <div class="mt-1 text-[10px]" style="color: var(--muted)">
                      {{ comment.created_at | date:'medium' }}
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-sm italic" style="color: var(--muted)">{{ 'detail.noComments' | translate }}</p>
            }
          </div>

          <!-- Activity Timeline -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="text-sm font-semibold" style="color: var(--on-surface)">
                {{ 'detail.activity' | translate }}
                <span class="ml-1 text-xs font-normal" style="color: var(--muted)">({{ activities().length }})</span>
              </h3>
            </div>

            <!-- Quick action buttons (hidden in read-only mode) -->
            @if (!isReadOnly()) {
              <div class="flex flex-wrap gap-2">
                @if (!showProgressForm() && !showBlockerForm()) {
                  <button
                    (click)="showProgressForm.set(true)"
                    class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                    style="background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent)"
                  >
                    <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/>
                    </svg>
                    {{ 'detail.reportProgress' | translate }}
                  </button>
                  @if (!hasActiveBlocker()) {
                    <button
                      (click)="showBlockerForm.set(true)"
                      class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                      style="background: color-mix(in srgb, var(--magenta) 12%, transparent); color: var(--magenta)"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                      </svg>
                      {{ 'detail.reportBlocker' | translate }}
                    </button>
                  } @else {
                    <button
                      (click)="resolveBlocker()"
                      class="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-colors"
                      style="background: color-mix(in srgb, var(--lime) 15%, transparent); color: var(--lime)"
                    >
                      <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      {{ 'detail.resolveBlocker' | translate }}
                    </button>
                  }
                }
              </div>

              <!-- Progress form -->
              @if (showProgressForm()) {
                <div class="rounded-xl border p-3 space-y-2" style="border-color: var(--accent); background: color-mix(in srgb, var(--accent) 4%, var(--surface-card))">
                  <div class="text-xs font-semibold" style="color: var(--accent)">{{ 'detail.reportProgress' | translate }}</div>
                  <textarea
                    [(ngModel)]="progressText"
                    [placeholder]="'detail.progressPlaceholder' | translate"
                    rows="2"
                    class="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:ring-2"
                    style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--accent)"
                  ></textarea>
                  <div class="flex gap-2 justify-end">
                    <button (click)="showProgressForm.set(false); progressText = ''"
                      class="rounded-lg px-3 py-1.5 text-xs font-medium" style="color: var(--muted)">
                      {{ 'common.cancel' | translate }}
                    </button>
                    <button (click)="submitProgress()" [disabled]="!progressText.trim()"
                      class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      style="background: var(--accent)">
                      {{ 'common.save' | translate }}
                    </button>
                  </div>
                </div>
              }

              <!-- Blocker form -->
              @if (showBlockerForm()) {
                <div class="rounded-xl border p-3 space-y-2" style="border-color: var(--magenta); background: color-mix(in srgb, var(--magenta) 4%, var(--surface-card))">
                  <div class="text-xs font-semibold" style="color: var(--magenta)">{{ 'detail.reportBlocker' | translate }}</div>
                  <textarea
                    [(ngModel)]="blockerText"
                    [placeholder]="'detail.blockerPlaceholder' | translate"
                    rows="2"
                    class="w-full rounded-lg border px-3 py-2 text-sm resize-none focus:ring-2"
                    style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--magenta)"
                  ></textarea>
                  <div class="flex gap-2 justify-end">
                    <button (click)="showBlockerForm.set(false); blockerText = ''"
                      class="rounded-lg px-3 py-1.5 text-xs font-medium" style="color: var(--muted)">
                      {{ 'common.cancel' | translate }}
                    </button>
                    <button (click)="submitBlocker()" [disabled]="!blockerText.trim()"
                      class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
                      style="background: var(--magenta)">
                      {{ 'common.save' | translate }}
                    </button>
                  </div>
                </div>
              }
            }

            <!-- Activity timeline list -->
            @if (activities().length > 0) {
              <div class="relative ml-3 border-l-2 space-y-0" style="border-color: var(--border)">
                @for (act of activities(); track act.id) {
                  <div class="relative pl-5 pb-4">
                    <!-- Dot -->
                    <div class="absolute -left-[7px] top-1 h-3 w-3 rounded-full border-2"
                      [style.border-color]="activityColor(act.type)"
                      [style.background]="activityDotBg(act.type)">
                    </div>
                    <div class="flex items-start gap-2">
                      <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-2 flex-wrap">
                          <span class="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                            [style.background]="activityBadgeBg(act.type)"
                            [style.color]="activityColor(act.type)">
                            {{ activityIcon(act.type) }} {{ ('activity.' + act.type) | translate }}
                          </span>
                          <span class="text-[10px]" style="color: var(--muted)">
                            {{ act.actor_name }} · {{ act.created_at | date:'short' }}
                          </span>
                        </div>
                        <p class="mt-0.5 text-xs leading-relaxed" style="color: var(--on-surface)">{{ act.description }}</p>
                      </div>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <p class="text-sm italic" style="color: var(--muted)">{{ 'detail.noActivity' | translate }}</p>
            }
          </div>
        </div>
      </div>
    </div>
  `,
})
export class RequestDetailDialogComponent {
  private activityStore = inject(ActivityStoreService);
  private auth = inject(AuthService);
  private store = inject(RequestStoreService);
  private statusConfigStore = inject(StatusConfigStore);
  private focusTracker = inject(FocusTrackerService);
  private appContext = inject(AppContextService);
  private activityLogger = inject(ActivityLoggerService);
  private userStore = inject(UserStoreService);
  private countryStore = inject(CountryStore);
  moduleStore = inject(AffectedModuleStore);
  private confirmDialog = inject(ConfirmDialogService);
  private i18n = inject(I18nService);

  request = input.required<Request>();
  closeDialog = output<void>();
  addComment = output<{ requestId: string; text: string }>();

  /** Live version of the request, always in sync with the store */
  readonly liveRequest = computed(() => {
    const inputReq = this.request();
    return this.store.requests().find((r) => r.id === inputReq.id) ?? inputReq;
  });

  newCommentText = '';
  progressText = '';
  blockerText = '';
  showProgressForm = signal(false);
  showBlockerForm = signal(false);

  /** Developers available for assignment */
  developers = computed(() => {
    const teamId = this.appContext.activeTeamId();
    return this.userStore.all().filter(
      (u) => (u.role === 'developer' || u.role === 'admin') && u.team_id === teamId
    );
  });

  /** Whether the current user can manage this request (status change, assignment) */
  canManage(): boolean {
    if (this.appContext.isReadOnly()) return false;
    return this.auth.hasRole(['developer', 'admin']);
  }

  /** Can the current user set this request as focus? (only if assigned to them and not done) */
  canSetFocus(): boolean {
    if (this.appContext.isReadOnly()) return false;
    const user = this.auth.user();
    if (!user) return false;
    const req = this.liveRequest();
    return req.developer_id === user.id && req.status !== 'done';
  }

  /** Whether the context is read-only (viewing another team or past FY) */
  isReadOnly(): boolean {
    return this.appContext.isReadOnly();
  }

  /** Is this request the current user's focus? */
  isMyCurrentFocus(): boolean {
    return this.focusTracker.isMyFocus(this.liveRequest().id);
  }

  /** Toggle focus on/off for this request */
  toggleFocus(): void {
    if (this.isMyCurrentFocus()) {
      this.focusTracker.clearMyFocus();
    } else {
      this.focusTracker.setMyFocus(this.liveRequest().id);
    }
  }

  /** Allowed status transitions from the current status */
  allowedTransitions = computed<StatusConfig[]>(() =>
    this.statusConfigStore.getAllowedTransitions(this.liveRequest().status)
  );

  /** Localized label for a status config */
  statusLabel(cfg: StatusConfig): string {
    return cfg.label_es;
  }

  getCountryFlag(code: string): string {
    return this.countryStore.getByCode(code)?.flag ?? code;
  }

  getCountryName(code: string): string {
    return this.countryStore.getByCode(code)?.name ?? code;
  }

  /** Name of the currently assigned developer */
  assignedDeveloperName(): string | null {
    const devId = this.liveRequest().developer_id;
    if (!devId) return null;
    const dev = this.userStore.getById(devId);
    return dev?.display_name ?? dev?.email ?? null;
  }

  /** Change the status of the request */
  async onChangeStatus(newStatus: string): Promise<void> {
    if (newStatus === 'done' || newStatus === 'cancelled') {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Confirmar cambio de estado',
        message: `¿Cambiar estado a "${newStatus}"?`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: newStatus === 'cancelled' ? 'danger' : 'default',
      });
      if (!confirmed) return;
    }
    this.store.updateRequest(this.liveRequest().id, {
      status: newStatus,
      updated_at: new Date().toISOString(),
    });
  }

  /** Assign a developer */
  onAssignDeveloper(developerId: string | null): void {
    this.store.updateRequest(this.liveRequest().id, {
      developer_id: developerId,
      updated_at: new Date().toISOString(),
    });
  }

  activities = computed<ActivityEntry[]>(() => {
    const all = this.activityStore.sorted();
    return all.filter((e) => e.request_id === this.request().id);
  });

  hasActiveBlocker = computed(() =>
    this.activityStore.hasActiveBlocker(this.request().id)
  );

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closeDialog.emit();
    }
  }

  onAddComment(): void {
    const text = this.newCommentText.trim();
    if (!text) return;
    this.addComment.emit({ requestId: this.request().id, text });
    this.newCommentText = '';
  }

  submitProgress(): void {
    const text = this.progressText.trim();
    if (!text) return;
    const req = this.liveRequest();
    this.activityLogger.log({
      request_id: req.id,
      request_internal_id: req.internal_id,
      request_title: req.title,
      team_id: req.team_id,
      fiscal_year: req.fiscal_year,
      type: 'progress_update',
      description: text,
    });
    this.progressText = '';
    this.showProgressForm.set(false);
  }

  submitBlocker(): void {
    const text = this.blockerText.trim();
    if (!text) return;
    const req = this.liveRequest();
    this.activityLogger.log({
      request_id: req.id,
      request_internal_id: req.internal_id,
      request_title: req.title,
      team_id: req.team_id,
      fiscal_year: req.fiscal_year,
      type: 'blocker_reported',
      description: text,
    });
    this.blockerText = '';
    this.showBlockerForm.set(false);
  }

  resolveBlocker(): void {
    const req = this.liveRequest();
    const entries = this.activityStore.getByRequest(req.id);
    const blockerEntry = entries.find((e) => e.type === 'blocker_reported');
    let duration = '';
    if (blockerEntry) {
      const diff = Date.now() - new Date(blockerEntry.created_at).getTime();
      duration = formatDurationLabel(diff, (key) => this.i18n.t(key));
    }
    const desc = duration
      ? this.i18n.t('tracking.blockerResolvedDesc').replace('{duration}', duration)
      : this.i18n.t('activity.blocker_resolved');
    this.activityLogger.log({
      request_id: req.id,
      request_internal_id: req.internal_id,
      request_title: req.title,
      team_id: req.team_id,
      fiscal_year: req.fiscal_year,
      type: 'blocker_resolved',
      description: desc,
    });
  }

  impactLevel(): string {
    return getImpactLevel(this.request().importance);
  }

  impactBg(): string {
    const l = this.impactLevel();
    if (l === 'alto') return 'color-mix(in srgb, var(--magenta) 12%, transparent)';
    if (l === 'medio') return 'color-mix(in srgb, var(--orange) 12%, transparent)';
    return 'color-mix(in srgb, var(--cool-gray) 12%, transparent)';
  }

  impactColor(): string {
    const l = this.impactLevel();
    if (l === 'alto') return 'var(--magenta)';
    if (l === 'medio') return 'var(--orange)';
    return 'var(--cool-gray)';
  }

  typeColor(): string {
    const t = this.request().type;
    if (t === 'incidencia') return 'var(--magenta)';
    if (t === 'mejora') return 'var(--primary-light)';
    return 'var(--lime)';
  }

  sortedComments(): Comment[] {
    const comments = this.request().comments ?? [];
    return [...comments].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  activityColor(type: string): string {
    switch (type) {
      case 'request_created': return 'var(--primary-light)';
      case 'status_change': return 'var(--purple)';
      case 'assignment_change': return 'var(--primary)';
      case 'priority_change': return 'var(--orange)';
      case 'comment_added': return 'var(--accent)';
      case 'progress_update': return 'var(--accent)';
      case 'blocker_reported': return 'var(--magenta)';
      case 'blocker_resolved': return 'var(--lime)';
      default: return 'var(--muted)';
    }
  }

  activityBadgeBg(type: string): string {
    return `color-mix(in srgb, ${this.activityColor(type)} 10%, transparent)`;
  }

  activityDotBg(type: string): string {
    if (type === 'blocker_reported') return 'var(--magenta)';
    if (type === 'blocker_resolved') return 'var(--lime)';
    return 'var(--surface-card)';
  }

  activityIcon(type: string): string {
    switch (type) {
      case 'request_created': return '✦';
      case 'status_change': return '↔';
      case 'assignment_change': return '👤';
      case 'priority_change': return '⬆';
      case 'comment_added': return '💬';
      case 'progress_update': return '▶';
      case 'blocker_reported': return '⚠';
      case 'blocker_resolved': return '✓';
      default: return '•';
    }
  }
}

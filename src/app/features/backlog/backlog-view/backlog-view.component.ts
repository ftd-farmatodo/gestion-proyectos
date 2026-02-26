import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { RequestDetailDialogComponent } from '../../../shared/components/request-detail-dialog/request-detail-dialog.component';
import { RequestStoreService } from '../../../core/services/request-store.service';
import { StatusConfigStore } from '../../../core/services/status-config.service';
import { BacklogReadTrackerService } from '../../../core/services/backlog-read-tracker.service';
import { PrioritizationService } from '../../prioritization/prioritization.service';
import { FiscalYearCloseService } from '../../../core/services/fiscal-year-close.service';
import { AuthService } from '../../../core/auth/auth.service';
import { AppContextService } from '../../../core/services/app-context.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { CountryStore } from '../../../core/services/country-store.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import type { Request, RequestType, StatusConfig } from '../../../shared/models/request.model';
import { getQuadrantForRequest } from '../../prioritization/prioritization.service';
import {
  getImpactLabel as getImpactLabelUtil,
  typeColor as typeColorUtil,
  impactBg as impactBgUtil,
  impactTextColor as impactTextColorUtil,
  scoreColor as scoreColorUtil,
  scoreBg as scoreBgUtil,
} from './backlog-view.utils';

@Component({
  selector: 'app-backlog-view',
  standalone: true,
  imports: [
    DatePipe,
    FormsModule,
    RouterLink,
    TranslatePipe,
    StatusBadgeComponent,
    RequestDetailDialogComponent,
  ],
  template: `
    <div class="bl-shell animate-fade-in">

      <!-- ═══ HEADER ═══ -->
      <header class="bl-header">
        <div class="bl-header-left">
          <h1 class="bl-title">{{ 'backlog.title' | translate }}</h1>
          <p class="bl-subtitle">{{ 'backlog.subtitle' | translate }}</p>
        </div>
        <div class="bl-header-right">
          <a routerLink="/prioritization" class="bl-chip bl-chip--outline">
            <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
            </svg>
            {{ 'header.prioritization' | translate }}
          </a>
          @if (readTracker.unreadCount() > 0) {
            <button (click)="readTracker.markAllAsRead()" class="bl-chip bl-chip--outline">
              {{ 'backlog.markAllRead' | translate }}
            </button>
          }
          @if (canCloseFY()) {
            <button (click)="showCloseFYDialog.set(true)" class="bl-chip bl-chip--warn">
              <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              {{ 'backlog.closeFY' | translate }}
            </button>
          }

          <!-- Counters -->
          <div class="bl-counter">
            <span class="bl-counter-value">{{ backlogRequests().length }}</span>
            <span class="bl-counter-label">{{ 'backlog.pendingCount' | translate }}</span>
          </div>
          @if (readTracker.unreadCount() > 0) {
            <div class="bl-counter bl-counter--unread">
              <span class="bl-counter-value">{{ readTracker.unreadCount() }}</span>
              <span class="bl-counter-label">{{ 'backlog.unread' | translate }}</span>
            </div>
          }
        </div>
      </header>

      <!-- ═══ TOOLBAR ═══ -->
      <div class="bl-toolbar">
        <select [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)" class="gp-select gp-select-sm">
          <option value="all">{{ 'backlog.allTypes' | translate }}</option>
          <option value="incidencia">{{ 'types.incidencia' | translate }}</option>
          <option value="mejora">{{ 'types.mejora' | translate }}</option>
          <option value="proyecto">{{ 'types.proyecto' | translate }}</option>
        </select>
        <select [ngModel]="sortBy()" (ngModelChange)="sortBy.set($event)" class="gp-select gp-select-sm">
          <option value="score">{{ 'backlog.sortByScore' | translate }}</option>
          <option value="date">{{ 'backlog.sortByDate' | translate }}</option>
          <option value="urgency">{{ 'backlog.sortByUrgency' | translate }}</option>
          <option value="impact">{{ 'backlog.sortByImpact' | translate }}</option>
        </select>
        <div class="bl-search">
          <svg class="bl-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"/>
          </svg>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            [placeholder]="'backlog.searchPlaceholder' | translate"
            class="bl-search-input"
          />
        </div>
        <div class="bl-toolbar-meta">
          <span class="bl-toolbar-count">{{ filteredRequests().length }}/{{ backlogRequests().length }}</span>
          @if (hasActiveFilters()) {
            <button (click)="clearFilters()" class="bl-clear-btn">
              <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              {{ 'backlog.clearFilter' | translate }}
            </button>
          }
        </div>
      </div>

      <!-- ═══ REQUEST LIST ═══ -->
      @if (filteredRequests().length > 0) {
        <div class="bl-list">
          @for (req of filteredRequests(); track req.id; let i = $index) {
            <article
              class="bl-card"
              [class.bl-card--unread]="!readTracker.isRead(req.id)"
              [style.animation-delay.ms]="i * 30"
              (click)="openRequest(req)">

              <!-- Unread accent bar -->
              @if (!readTracker.isRead(req.id)) {
                <div class="bl-card-unread-bar"></div>
              }

              <!-- Row 1: primary info -->
              <div class="bl-card-main">
                <div class="bl-card-leading">
                  <span class="bl-type-dot" [style.background]="typeColor(req.type)"></span>
                  <span class="bl-card-id">{{ req.internal_id }}</span>
                </div>
                <h3 class="bl-card-title">{{ req.title }}</h3>
                <div class="bl-card-trailing">
                  <span class="bl-score"
                    [style.--score-color]="scoreColor(req.priorityScore)"
                    [style.--score-bg]="scoreBg(req.priorityScore)">
                    {{ formatScore(req.priorityScore) }}
                  </span>
                </div>
              </div>

              <!-- Row 2: metadata chips -->
              <div class="bl-card-meta">
                <app-status-badge [status]="req.status" />
                <span class="bl-type-label" [style.color]="typeColor(req.type)">
                  {{ ('types.' + req.type) | translate }}
                </span>
                @if (req.requester_name) {
                  <span class="bl-requester-chip">
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/>
                    </svg>
                    {{ req.requester_name }}
                    @if (req.requester_department) {
                      <span class="bl-requester-dept">· {{ req.requester_department }}</span>
                    }
                  </span>
                }
                @if ((req.countries ?? []).length > 0) {
                  <span class="bl-country-chips">
                    @for (code of req.countries!; track code) {
                      <span class="bl-country-pill">{{ getCountryFlag(code) }} {{ code }}</span>
                    }
                  </span>
                }
                @if (req.developer_id) {
                  <span class="bl-dev-chip">
                    <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5"/>
                    </svg>
                    {{ getDeveloperName(req.developer_id) }}
                  </span>
                }
                <span class="bl-impact-chip"
                  [style.--chip-color]="impactTextColor(req.importance)"
                  [style.--chip-bg]="impactBg(req.importance)">
                  {{ ('impact.' + getImpactLabel(req.importance)) | translate }}
                </span>
                <span class="bl-meta-separator"></span>
                <span class="bl-meta-text">{{ req.created_at | date:'d MMM y' }}</span>
              </div>

              <!-- Row 3: quick actions (hover reveal) -->
              @if (canQuickManage()) {
                <div class="bl-card-actions" (click)="$event.stopPropagation()">
                  <div class="bl-action-group">
                    <label class="bl-action-label">{{ 'detail.changeStatus' | translate }}</label>
                    <select
                      class="gp-select gp-select-sm bl-action-select"
                      [ngModel]="req.status"
                      (ngModelChange)="quickChangeStatus(req, $event)">
                      @for (s of statusOptions(); track s.key) {
                        <option [value]="s.key">{{ statusLabel(s) }}</option>
                      }
                    </select>
                  </div>
                  <div class="bl-action-group">
                    <label class="bl-action-label">{{ 'detail.assignDeveloper' | translate }}</label>
                    <select
                      class="gp-select gp-select-sm bl-action-select"
                      [ngModel]="req.developer_id"
                      (ngModelChange)="quickAssignDeveloper(req, $event)">
                      <option [ngValue]="null">{{ 'detail.unassigned' | translate }}</option>
                      @for (dev of teamDevelopers(); track dev.id) {
                        <option [ngValue]="dev.id">{{ dev.display_name ?? dev.email }}</option>
                      }
                    </select>
                  </div>
                </div>
              }
            </article>
          }
        </div>
      } @else {
        <div class="bl-empty">
          <div class="bl-empty-icon">
            <svg class="h-6 w-6" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <p class="bl-empty-title">{{ 'backlog.empty' | translate }}</p>
          <p class="bl-empty-hint">{{ 'backlog.emptyHint' | translate }}</p>
        </div>
      }
    </div>

    <!-- ═══ CLOSE PERIOD DIALOG ═══ -->
    @if (showCloseFYDialog()) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-fade-in"
           (click)="showCloseFYDialog.set(false)">
        <div class="relative mx-4 w-full max-w-md rounded-2xl border shadow-2xl p-6 space-y-5 animate-slide-up"
             style="background: var(--surface-card); border-color: var(--border)"
             (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-xl"
                 style="background: color-mix(in srgb, var(--orange) 15%, transparent)">
              <svg class="h-5 w-5" style="color: var(--orange)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-base font-bold" style="color: var(--on-surface)">{{ 'backlog.closeFY' | translate }}</h3>
              <p class="text-xs" style="color: var(--muted)">{{ fyCloseService.pendingCarryOver() + fyCloseService.completedInCurrentFY() }} {{ 'backlog.totalActivities' | translate }}</p>
            </div>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--lime) 8%, transparent)">
              <div class="text-xl font-bold tabular-nums" style="color: var(--lime)">{{ fyCloseService.completedInCurrentFY() }}</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--lime)">{{ 'backlog.completedLabel' | translate }}</div>
            </div>
            <div class="rounded-xl p-3 text-center" style="background: color-mix(in srgb, var(--orange) 8%, transparent)">
              <div class="text-xl font-bold tabular-nums" style="color: var(--orange)">{{ fyCloseService.pendingCarryOver() }}</div>
              <div class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--orange)">{{ 'backlog.carriedOver' | translate }}</div>
            </div>
          </div>
          <div class="rounded-xl border p-3 text-xs" style="background: color-mix(in srgb, var(--magenta) 5%, transparent); border-color: color-mix(in srgb, var(--magenta) 20%, transparent); color: var(--magenta)">
            <svg class="inline-block h-3.5 w-3.5 mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
            </svg>
            {{ 'backlog.closeFYWarning' | translate }}
          </div>
          <div class="flex gap-3 justify-end">
            <button (click)="showCloseFYDialog.set(false)"
                    class="rounded-xl px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style="color: var(--muted)">
              {{ 'common.cancel' | translate }}
            </button>
            <button (click)="confirmCloseFY()"
                    class="rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all hover:shadow-md"
                    style="background: var(--orange)">
              {{ 'backlog.closeFYConfirm' | translate }}
            </button>
          </div>
        </div>
      </div>
    }

    <!-- Detail dialog -->
    @if (selectedRequest(); as req) {
      <app-request-detail-dialog
        [request]="req"
        (closeDialog)="selectedRequest.set(null)"
        (addComment)="onAddComment($event)"
      />
    }
  `,
  styles: [`
    /* ─── Shell ─── */
    .bl-shell {
      padding: 1rem 1rem 2rem;
      max-width: 960px;
      margin: 0 auto;
    }
    @media (min-width: 1024px) {
      .bl-shell { padding: 1.5rem 2rem 2rem; }
    }

    /* ─── Header ─── */
    .bl-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .bl-title {
      font-size: 1.375rem;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: var(--on-surface);
    }
    .bl-subtitle {
      font-size: 0.8125rem;
      color: var(--muted);
      margin-top: 2px;
    }
    .bl-header-right {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }

    /* ─── Chips (header actions) ─── */
    .bl-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.3rem 0.75rem;
      border-radius: 0.625rem;
      font-size: 0.6875rem;
      font-weight: 600;
      white-space: nowrap;
      transition: all 0.2s ease;
    }
    .bl-chip--outline {
      border: 1px solid var(--border);
      color: var(--primary-light);
      background: transparent;
    }
    .bl-chip--outline:hover {
      border-color: color-mix(in srgb, var(--primary-light) 40%, var(--border));
      background: color-mix(in srgb, var(--primary-light) 5%, transparent);
    }
    .bl-chip--warn {
      border: 1px solid color-mix(in srgb, var(--orange) 30%, transparent);
      color: var(--orange);
      background: color-mix(in srgb, var(--orange) 8%, transparent);
    }
    .bl-chip--warn:hover {
      background: color-mix(in srgb, var(--orange) 14%, transparent);
    }

    /* ─── Counters ─── */
    .bl-counter {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding: 0.25rem 0.625rem;
      border-radius: 0.625rem;
      background: var(--surface-card);
      border: 1px solid var(--border);
    }
    .bl-counter--unread {
      background: color-mix(in srgb, var(--magenta) 6%, var(--surface-card));
      border-color: color-mix(in srgb, var(--magenta) 20%, var(--border));
    }
    .bl-counter--unread .bl-counter-value,
    .bl-counter--unread .bl-counter-label {
      color: var(--magenta);
    }
    .bl-counter-value {
      font-size: 0.875rem;
      font-weight: 800;
      color: var(--on-surface);
      font-variant-numeric: tabular-nums;
    }
    .bl-counter-label {
      font-size: 0.625rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
    }

    /* ─── Toolbar ─── */
    .bl-toolbar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }
    .bl-search {
      position: relative;
      flex: 1;
      min-width: 180px;
    }
    .bl-search-icon {
      position: absolute;
      left: 0.625rem;
      top: 50%;
      transform: translateY(-50%);
      width: 0.875rem;
      height: 0.875rem;
      color: var(--muted);
      pointer-events: none;
    }
    .bl-search-input {
      width: 100%;
      padding: 0.375rem 0.75rem 0.375rem 2rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--surface-card);
      color: var(--on-surface);
      font-size: 0.75rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .bl-search-input::placeholder { color: var(--muted); }
    .bl-search-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--ring);
    }
    .bl-toolbar-meta {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-left: auto;
    }
    .bl-toolbar-count {
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .bl-clear-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--muted);
      padding: 0.2rem 0.5rem;
      border-radius: 0.5rem;
      transition: all 0.15s ease;
    }
    .bl-clear-btn:hover {
      color: var(--on-surface);
      background: color-mix(in srgb, var(--on-surface) 5%, transparent);
    }

    /* ─── List ─── */
    .bl-list {
      display: flex;
      flex-direction: column;
      gap: 1px;
      border-radius: 0.875rem;
      overflow: hidden;
      border: 1px solid var(--border);
      background: var(--border);
    }

    /* ─── Card ─── */
    .bl-card {
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.375rem;
      padding: 0.625rem 0.75rem;
      background: var(--surface-card);
      cursor: pointer;
      transition: background-color 0.15s ease;
      animation: slide-up-sm 0.3s cubic-bezier(0.22,1,0.36,1) both;
    }
    .bl-card:hover {
      background: color-mix(in srgb, var(--accent) 3%, var(--surface-card));
    }
    .bl-card--unread {
      background: color-mix(in srgb, var(--magenta) 2%, var(--surface-card));
    }
    .bl-card--unread:hover {
      background: color-mix(in srgb, var(--magenta) 4%, var(--surface-card));
    }

    /* Unread accent bar */
    .bl-card-unread-bar {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: var(--magenta);
      border-radius: 0 2px 2px 0;
    }

    /* ─── Card row 1: main ─── */
    .bl-card-main {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      min-width: 0;
    }
    .bl-card-leading {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      flex-shrink: 0;
    }
    .bl-type-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }
    .bl-card-id {
      font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, monospace;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--primary-light);
      white-space: nowrap;
    }
    .bl-card-title {
      flex: 1;
      min-width: 0;
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--on-surface);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .bl-card-trailing {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* ─── Score badge ─── */
    .bl-score {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 28px;
      height: 22px;
      padding: 0 0.375rem;
      border-radius: 0.375rem;
      font-size: 0.6875rem;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: var(--score-color);
      background: var(--score-bg);
    }

    /* ─── Card row 2: meta ─── */
    .bl-card-meta {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      padding-left: 1.375rem; /* align under title (dot + id gap) */
      flex-wrap: wrap;
    }
    .bl-type-label {
      font-size: 0.625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .bl-requester-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--on-surface);
    }
    .bl-requester-dept {
      color: var(--muted);
      font-weight: 400;
    }
    .bl-dev-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.6875rem;
      font-weight: 500;
      color: var(--accent);
    }
    .bl-impact-chip {
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.1rem 0.375rem;
      border-radius: 0.25rem;
      color: var(--chip-color);
      background: var(--chip-bg);
    }
    .bl-meta-separator {
      width: 1px;
      height: 10px;
      background: var(--border);
      flex-shrink: 0;
    }
    .bl-meta-text {
      font-size: 0.6875rem;
      color: var(--muted);
    }
    .bl-country-chips {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
    }
    .bl-country-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.125rem;
      font-size: 0.625rem;
      font-weight: 600;
      padding: 0.05rem 0.35rem;
      border-radius: 0.3rem;
      background: color-mix(in srgb, var(--accent) 8%, transparent);
      color: var(--on-surface);
      white-space: nowrap;
    }

    /* ─── Card row 3: quick actions (hover reveal) ─── */
    .bl-card-actions {
      display: flex;
      gap: 0.5rem;
      padding-left: 1.375rem;
      max-height: 0;
      opacity: 0;
      overflow: hidden;
      transition: max-height 0.25s cubic-bezier(0.22,1,0.36,1),
                  opacity 0.2s ease,
                  padding 0.25s ease;
      padding-top: 0;
      padding-bottom: 0;
    }
    .bl-card:hover .bl-card-actions {
      max-height: 60px;
      opacity: 1;
      padding-top: 0.375rem;
    }
    .bl-action-group {
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }
    .bl-action-label {
      font-size: 0.5625rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--muted);
      white-space: nowrap;
    }
    .bl-action-select {
      max-width: 160px;
    }

    /* ─── Empty state ─── */
    .bl-empty {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 4rem 2rem;
      border-radius: 0.875rem;
      border: 1px solid var(--border);
      background: var(--surface-card);
    }
    .bl-empty-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      border-radius: 1rem;
      background: color-mix(in srgb, var(--accent) 10%, transparent);
      margin-bottom: 0.75rem;
    }
    .bl-empty-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--on-surface);
    }
    .bl-empty-hint {
      font-size: 0.75rem;
      color: var(--muted);
      margin-top: 0.25rem;
    }
  `],
})
export class BacklogViewComponent {
  private store = inject(RequestStoreService);
  private statusConfig = inject(StatusConfigStore);
  private prioritizationService = inject(PrioritizationService);
  private auth = inject(AuthService);
  private appContext = inject(AppContextService);
  private userStore = inject(UserStoreService);
  private countryStore = inject(CountryStore);
  private confirmDialog = inject(ConfirmDialogService);
  fyCloseService = inject(FiscalYearCloseService);
  readTracker = inject(BacklogReadTrackerService);

  selectedRequest = signal<Request | null>(null);
  showCloseFYDialog = signal(false);
  typeFilter = signal<string>('all');
  sortBy = signal<string>('score');
  searchQuery = signal<string>('');
  statusOptions = computed(() => this.statusConfig.active());
  teamDevelopers = computed(() => {
    const teamId = this.appContext.activeTeamId();
    return this.userStore.all().filter(
      (u) => (u.role === 'developer' || u.role === 'admin') && u.team_id === teamId
    );
  });

  /** All requests in backlog status (not yet prioritized), scoped to context */
  backlogRequests = computed(() =>
    this.store.contextRequests().filter((r) => r.status === 'backlog')
  );

  /** Filtered and sorted requests */
  filteredRequests = computed(() => {
    let list = this.backlogRequests();

    // Type filter
    const type = this.typeFilter();
    if (type !== 'all') {
      list = list.filter((r) => r.type === type);
    }

    // Search
    const q = this.searchQuery().toLowerCase().trim();
    if (q) {
      list = list.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.internal_id.toLowerCase().includes(q)
      );
    }

    // Sort
    const sort = this.sortBy();
    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'score':
          return b.priorityScore - a.priorityScore;
        case 'date':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'urgency':
          return b.urgency - a.urgency;
        case 'impact':
          return b.importance - a.importance;
        default:
          return 0;
      }
    });

    return list;
  });

  /** Open a request and mark it as read */
  openRequest(req: Request): void {
    this.readTracker.markAsRead(req.id);
    this.selectedRequest.set(req);
  }

  quickPrioritize(req: Request): void {
    const quadrant = getQuadrantForRequest(req);
    this.prioritizationService.moveToQuadrant(req.id, quadrant);
    this.store.updateRequest(req.id, {
      status: 'prioritized',
      updated_at: new Date().toISOString(),
    });
  }

  onAddComment(event: { requestId: string; text: string }): void {
    this.prioritizationService.addComment(event.requestId, event.text);
    // Refresh selected request
    const updated = this.store.requests().find((r) => r.id === event.requestId);
    if (updated) this.selectedRequest.set({ ...updated });
  }

  getDeveloperName(devId: string): string {
    const dev = this.userStore.getById(devId);
    return dev?.display_name ?? dev?.email ?? devId;
  }

  getCountryFlag(code: string): string {
    return this.countryStore.getByCode(code)?.flag ?? code;
  }

  statusLabel(cfg: StatusConfig): string {
    return cfg.label_es;
  }

  getImpactLabel(importance: number): string {
    return getImpactLabelUtil(importance);
  }

  typeColor(type: RequestType): string {
    return typeColorUtil(type);
  }

  impactBg(importance: number): string {
    return impactBgUtil(importance);
  }

  impactTextColor(importance: number): string {
    return impactTextColorUtil(importance);
  }

  formatScore(score: number): string {
    return score >= 10 ? Math.round(score).toString() : score.toFixed(1);
  }

  scoreColor(score: number): string {
    return scoreColorUtil(score);
  }

  scoreBg(score: number): string {
    return scoreBgUtil(score);
  }

  /** Only admin can close the FY and only when viewing own team and not already closed */
  canCloseFY(): boolean {
    return (
      this.auth.hasRole(['admin']) &&
      !this.appContext.isReadOnly() &&
      !this.fyCloseService.isCurrentYearClosed()
    );
  }

  canQuickManage(): boolean {
    return this.auth.hasRole(['developer', 'admin']) && !this.appContext.isReadOnly();
  }

  hasActiveFilters(): boolean {
    return this.typeFilter() !== 'all' || this.searchQuery().trim().length > 0 || this.sortBy() !== 'score';
  }

  clearFilters(): void {
    this.typeFilter.set('all');
    this.sortBy.set('score');
    this.searchQuery.set('');
  }

  async quickChangeStatus(req: Request, nextStatus: string): Promise<void> {
    if (nextStatus === req.status) return;
    if (nextStatus === 'prioritized') {
      this.quickPrioritize(req);
      return;
    }
    if (nextStatus === 'done' || nextStatus === 'cancelled') {
      const confirmed = await this.confirmDialog.confirm({
        title: 'Confirmar cambio de estado',
        message: `¿Cambiar estado a "${nextStatus}"?`,
        confirmText: 'Confirmar',
        cancelText: 'Cancelar',
        variant: nextStatus === 'cancelled' ? 'danger' : 'default',
      });
      if (!confirmed) return;
    }
    this.store.updateRequest(req.id, {
      status: nextStatus,
      updated_at: new Date().toISOString(),
    });
  }

  quickAssignDeveloper(req: Request, developerId: string | null): void {
    const value = developerId || null;
    if (value === req.developer_id) return;
    this.store.updateRequest(req.id, {
      developer_id: value,
      updated_at: new Date().toISOString(),
    });
  }

  async confirmCloseFY(): Promise<void> {
    const teamId = this.appContext.activeTeamId();
    await this.fyCloseService.closeFiscalYear(teamId);
    this.showCloseFYDialog.set(false);
  }
}

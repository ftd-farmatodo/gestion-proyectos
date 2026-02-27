import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TeamStore } from '../../../core/services/team-store.service';
import { FiscalYearService } from '../../../core/services/fiscal-year.service';
import { UserStoreService } from '../../../core/services/user-store.service';
import { StatusConfigStore } from '../../../core/services/status-config.service';
import { DepartmentStore } from '../../../core/services/department-store.service';
import { CountryStore } from '../../../core/services/country-store.service';
import { AffectedModuleStore } from '../../../core/services/affected-module-store.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { I18nService } from '../../../core/services/i18n.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import type { Team } from '../../../shared/models/team.model';
import type { StatusConfig } from '../../../shared/models/request.model';
import type { UserRole } from '../../../core/auth/auth.model';
import { ObjectiveStoreService } from '../../../core/services/objective-store.service';
import { TEAM_EMOJI_OPTIONS, ROLE_OPTIONS, STATUS_COLOR_OPTIONS } from './settings-layout.config';

type SettingsTab = 'teams' | 'statuses' | 'fiscal' | 'departments' | 'countries' | 'modules' | 'objectives';

@Component({
  selector: 'app-settings-layout',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="p-4 lg:p-6 animate-fade-in">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold tracking-tight" style="color: var(--on-surface)">
          {{ 'settings.title' | translate }}
        </h1>
        <p class="mt-1 text-sm" style="color: var(--muted)">
          {{ 'settings.subtitle' | translate }}
        </p>
      </div>

      <!-- Tabs -->
      <div class="mb-6 flex gap-1 rounded-xl p-1" style="background: color-mix(in srgb, var(--on-surface) 5%, transparent)">
        <button (click)="activeTab.set('teams')"
                class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                [style.background]="activeTab() === 'teams' ? 'var(--surface-card)' : 'transparent'"
                [style.color]="activeTab() === 'teams' ? 'var(--on-surface)' : 'var(--muted)'"
                [style.box-shadow]="activeTab() === 'teams' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
          {{ 'settings.tabTeams' | translate }}
        </button>
        <button (click)="activeTab.set('fiscal')"
                class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                [style.background]="activeTab() === 'fiscal' ? 'var(--surface-card)' : 'transparent'"
                [style.color]="activeTab() === 'fiscal' ? 'var(--on-surface)' : 'var(--muted)'"
                [style.box-shadow]="activeTab() === 'fiscal' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
          {{ 'settings.tabFiscal' | translate }}
        </button>
        <button (click)="activeTab.set('statuses')"
                class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                [style.background]="activeTab() === 'statuses' ? 'var(--surface-card)' : 'transparent'"
                [style.color]="activeTab() === 'statuses' ? 'var(--on-surface)' : 'var(--muted)'"
                [style.box-shadow]="activeTab() === 'statuses' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
          Estados
        </button>
        <button (click)="activeTab.set('departments')"
                class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                [style.background]="activeTab() === 'departments' ? 'var(--surface-card)' : 'transparent'"
                [style.color]="activeTab() === 'departments' ? 'var(--on-surface)' : 'var(--muted)'"
                [style.box-shadow]="activeTab() === 'departments' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
          {{ 'settings.tabDepartments' | translate }}
        </button>
        <button (click)="activeTab.set('countries')"
                class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                [style.background]="activeTab() === 'countries' ? 'var(--surface-card)' : 'transparent'"
                [style.color]="activeTab() === 'countries' ? 'var(--on-surface)' : 'var(--muted)'"
                [style.box-shadow]="activeTab() === 'countries' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
          {{ 'settings.tabCountries' | translate }}
        </button>
        <button (click)="activeTab.set('modules')"
                class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                [style.background]="activeTab() === 'modules' ? 'var(--surface-card)' : 'transparent'"
                [style.color]="activeTab() === 'modules' ? 'var(--on-surface)' : 'var(--muted)'"
                [style.box-shadow]="activeTab() === 'modules' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
          {{ 'settings.tabModules' | translate }}
        </button>
        <button (click)="activeTab.set('objectives')"
                class="flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition-all"
                [style.background]="activeTab() === 'objectives' ? 'var(--surface-card)' : 'transparent'"
                [style.color]="activeTab() === 'objectives' ? 'var(--on-surface)' : 'var(--muted)'"
                [style.box-shadow]="activeTab() === 'objectives' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'">
          {{ 'settings.tabObjectives' | translate }}
        </button>
      </div>

      <!-- Team Management Tab -->
      @if (activeTab() === 'teams') {
        <div class="dash-card p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold" style="color: var(--on-surface)">
              {{ 'settings.teamManagement' | translate }}
            </h2>
            <button (click)="showAddForm.set(!showAddForm())"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
                    style="background: var(--accent)">
              {{ showAddForm() ? ('common.cancel' | translate) : ('settings.addTeam' | translate) }}
            </button>
          </div>

          <!-- Add team form -->
          @if (showAddForm()) {
            <div class="mb-5 rounded-xl border p-4 animate-scale-in" style="border-color: var(--border); background: color-mix(in srgb, var(--accent) 3%, var(--surface-card))">
              <div class="grid gap-3 sm:grid-cols-4">
                <div>
                  <label for="teamName" class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.teamName' | translate }}</label>
                  <input id="teamName"
                         [(ngModel)]="newTeamName"
                         class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                         style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                         [placeholder]="'settings.teamNamePlaceholder' | translate" />
                </div>
                <div>
                  <label for="teamCode" class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.teamCode' | translate }}</label>
                  <input id="teamCode"
                         [(ngModel)]="newTeamCode"
                         class="mt-1 w-full rounded-lg border px-3 py-2 text-sm uppercase"
                         style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                         placeholder="Ej: RRHH" maxlength="6" />
                </div>
                <div>
                  <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.teamDescription' | translate }}</label>
                  <input [(ngModel)]="newTeamDesc"
                         class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                         style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                         [placeholder]="'settings.teamDescPlaceholder' | translate" />
                </div>
                <div>
                  <label class="text-xs font-semibold" style="color: var(--muted)">Icono</label>
                  <select
                    [(ngModel)]="newTeamIcon"
                    class="mt-1 w-full gp-select">
                    @for (opt of teamEmojiOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.value }} {{ opt.label }}</option>
                    }
                  </select>
                </div>
              </div>
              <button (click)="addTeam()"
                      [disabled]="!newTeamName.trim() || !newTeamCode.trim()"
                      class="mt-3 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-40"
                      style="background: var(--accent)">
                {{ 'common.save' | translate }}
              </button>
              @if (teamFormError()) {
                <p class="mt-2 text-xs font-medium" style="color: var(--magenta)">{{ teamFormError() }}</p>
              }
            </div>
          }

          <!-- Teams list -->
          <div class="space-y-2">
            @for (team of visibleTeams(); track team.id) {
              <div class="flex items-center gap-4 rounded-xl border px-5 py-3 transition-colors"
                   style="border-color: var(--border)"
                   [style.opacity]="team.is_active ? '1' : '0.5'">
                @if (team.icon) {
                  <span class="text-xl">{{ team.icon }}</span>
                }
                <div class="flex-1 min-w-0">
                  @if (editingId === team.id) {
                    <input [(ngModel)]="editName"
                           class="w-full rounded-lg border px-2 py-1 text-sm"
                           style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                           (keyup.enter)="saveEdit(team.id)" />
                    @if (editError()) {
                      <p class="mt-1 text-[10px] font-medium" style="color: var(--magenta)">{{ editError() }}</p>
                    }
                  } @else {
                    <p class="text-sm font-semibold" style="color: var(--on-surface)">
                      <span class="font-mono text-[10px] mr-1.5 px-1 py-0.5 rounded" style="background: color-mix(in srgb, var(--primary-light) 12%, transparent); color: var(--primary-light)">{{ team.code }}</span>
                      {{ team.name }}
                    </p>
                    @if (team.description) {
                      <p class="text-xs" style="color: var(--muted)">{{ team.description }}</p>
                    }
                  }
                </div>
                <div class="flex items-center gap-2 shrink-0">
                  @if (editingId === team.id) {
                    <button (click)="saveEdit(team.id)"
                            class="rounded-lg px-2.5 py-1 text-[10px] font-semibold text-white"
                            style="background: var(--accent)">
                      {{ 'common.save' | translate }}
                    </button>
                    <button (click)="editingId = null"
                            class="rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                            style="color: var(--muted)">
                      {{ 'common.cancel' | translate }}
                    </button>
                  } @else {
                    <button (click)="startEdit(team)"
                            class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                            style="color: var(--primary-light)">
                      {{ 'settings.edit' | translate }}
                    </button>
                    <button (click)="toggleTeamActive(team.id)"
                            class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                            [style.color]="team.is_active ? 'var(--magenta)' : 'var(--lime)'">
                      {{ team.is_active ? ('settings.deactivate' | translate) : ('settings.activate' | translate) }}
                    </button>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Team members management -->
          <div class="mt-6 rounded-xl border p-4" style="border-color: var(--border); background: color-mix(in srgb, var(--surface-alt) 70%, var(--surface-card))">
            <div class="flex flex-wrap items-center gap-3 mb-3">
              <h3 class="text-sm font-semibold" style="color: var(--on-surface)">{{ 'settings.membersByTeam' | translate }}</h3>
              <label for="memberSearch" class="sr-only">{{ 'settings.memberSearchPlaceholder' | translate }}</label>
              <select
                class="gp-select gp-select-sm text-xs"
                [ngModel]="selectedTeamId()"
                (ngModelChange)="selectedTeamId.set($event)">
                <option value="">{{ 'settings.noTeam' | translate }}</option>
                @for (team of visibleTeams(); track team.id) {
                  <option [value]="team.id">{{ team.name }}</option>
                }
              </select>
              <input id="memberSearch"
                class="rounded-lg border px-3 py-1.5 text-xs flex-1 min-w-[320px] max-w-[560px]"
                style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                [ngModel]="memberSearch()"
                (ngModelChange)="memberSearch.set($event)"
                [placeholder]="'settings.memberSearchPlaceholder' | translate" />
            </div>

            <div class="space-y-2">
              @for (member of filteredMembers(); track member.id) {
                <div class="flex items-center gap-3 rounded-lg border px-3 py-2"
                     style="border-color: var(--border); background: var(--surface-card)">
                  <div class="min-w-0 flex-1">
                    <p class="text-xs font-semibold truncate" style="color: var(--on-surface)">
                      {{ member.display_name ?? member.email }}
                      @if (member.team_id === selectedTeamId() && !!selectedTeamId()) {
                        <span class="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold"
                              style="background: color-mix(in srgb, var(--lime) 14%, transparent); color: var(--lime)">
                          {{ 'settings.inTeam' | translate }}
                        </span>
                      }
                      @if (!member.team_id) {
                        <span class="ml-1 rounded px-1.5 py-0.5 text-[9px] font-bold"
                              style="background: color-mix(in srgb, var(--cool-gray) 12%, transparent); color: var(--cool-gray)">
                          {{ 'settings.noTeam' | translate }}
                        </span>
                      }
                    </p>
                    <p class="text-[10px] truncate" style="color: var(--muted)">
                      {{ member.email }}
                    </p>
                  </div>

                  <!-- Role selector -->
                  <select
                    class="gp-select gp-select-sm text-xs w-[140px]"
                    [ngModel]="member.role"
                    (ngModelChange)="assignMemberRole(member.id, $event)">
                    @for (r of roleOptions; track r.value) {
                      <option [value]="r.value">{{ r.labelKey | translate }}</option>
                    }
                  </select>

                  <button
                    class="rounded-lg border px-2 py-1 text-[10px] font-semibold"
                    style="border-color: var(--border); color: var(--primary-light)"
                    [disabled]="!selectedTeamId() || member.team_id === selectedTeamId()"
                    (click)="assignMemberTeam(member.id, selectedTeamId())">
                    {{ 'settings.addToTeam' | translate }}
                  </button>
                  <select
                    class="gp-select gp-select-sm text-xs w-[180px]"
                    [ngModel]="member.team_id"
                    (ngModelChange)="assignMemberTeam(member.id, $event)">
                    <option [ngValue]="null">{{ 'settings.noTeam' | translate }}</option>
                    @for (team of visibleTeams(); track team.id) {
                      <option [ngValue]="team.id">{{ team.name }}</option>
                    }
                  </select>
                </div>
              }
              @if (!filteredMembers().length) {
                <p class="rounded-lg border px-3 py-2 text-xs"
                   style="border-color: var(--border); color: var(--muted); background: var(--surface-card)">
                  {{ 'settings.noMembersForFilter' | translate }}
                </p>
              }
            </div>
          </div>
        </div>
      }

      <!-- Status Pipeline Tab -->
      @if (activeTab() === 'statuses') {
        <div class="dash-card p-6 space-y-4">
          <div class="flex items-center justify-between">
            <h2 class="text-base font-semibold" style="color: var(--on-surface)">Pipeline de estados</h2>
            <button
              (click)="startNewStatus()"
              class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white transition-colors"
              style="background: var(--accent)">
              Nuevo estado
            </button>
          </div>

          <div class="grid gap-4 lg:grid-cols-[280px_1fr]">
            <div class="space-y-2">
              @for (status of orderedStatuses(); track status.key) {
                <button
                  (click)="editStatus(status)"
                  class="w-full rounded-xl border px-3 py-2 text-left transition-colors"
                  [style.border-color]="selectedStatusKey() === status.key ? 'var(--accent)' : 'var(--border)'"
                  [style.background]="selectedStatusKey() === status.key ? 'color-mix(in srgb, var(--accent) 6%, var(--surface-card))' : 'var(--surface-card)'">
                  <div class="flex items-center gap-2">
                    <span class="inline-block h-2 w-2 rounded-full" [style.background]="status.color"></span>
                    <span class="text-xs font-semibold" style="color: var(--on-surface)">{{ status.label_es }}</span>
                    <span class="ml-auto text-[10px]" style="color: var(--muted)">#{{ status.order }}</span>
                  </div>
                  <p class="mt-1 text-[10px] font-mono" style="color: var(--muted)">{{ status.key }}</p>
                  @if (!status.is_active) {
                    <span class="mt-1 inline-block rounded px-1.5 py-0.5 text-[9px] font-bold"
                          style="background: color-mix(in srgb, var(--magenta) 10%, transparent); color: var(--magenta)">
                      Inactivo
                    </span>
                  }
                </button>
              }
            </div>

            <div class="rounded-xl border p-4 space-y-3" style="border-color: var(--border); background: var(--surface-card)">
              @if (selectedStatusKey()) {
                <div class="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label class="text-xs font-semibold" style="color: var(--muted)">Clave</label>
                    <input
                      [ngModel]="statusForm.key"
                      (ngModelChange)="statusForm.key = $event"
                      [disabled]="!isNewStatus()"
                      class="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono"
                      style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                      placeholder="ej: qa_review" />
                  </div>
                  <div>
                    <label class="text-xs font-semibold" style="color: var(--muted)">Nombre</label>
                    <input
                      [ngModel]="statusForm.label_es"
                      (ngModelChange)="statusForm.label_es = $event"
                      class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                      placeholder="Ej: En validación" />
                  </div>
                  <div>
                    <label class="text-xs font-semibold" style="color: var(--muted)">Orden</label>
                    <input
                      type="number"
                      min="0"
                      [ngModel]="statusForm.order"
                      (ngModelChange)="statusForm.order = toNumber($event)"
                      class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                      style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)" />
                  </div>
                  <div>
                    <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.statusColor' | translate }}</label>
                    <select
                      [ngModel]="statusForm.color"
                      (ngModelChange)="statusForm.color = $event"
                      class="mt-1 w-full gp-select">
                      @for (opt of colorOptions; track opt.value) {
                        <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
                      }
                    </select>
                  </div>
                </div>

                <label class="inline-flex items-center gap-2 text-xs font-semibold mt-1" style="color: var(--on-surface)">
                  <input type="checkbox" [ngModel]="statusForm.is_active" (ngModelChange)="statusForm.is_active = !!$event" />
                  {{ 'settings.statusActive' | translate }}
                </label>

                <div>
                  <p class="text-xs font-semibold mb-1.5" style="color: var(--muted)">Transiciones permitidas</p>
                  <div class="grid gap-2 sm:grid-cols-2">
                    @for (candidate of orderedStatuses(); track candidate.key) {
                      @if (candidate.key !== statusForm.key) {
                        <label class="inline-flex items-center gap-2 rounded-lg border px-2 py-1.5 text-xs"
                               style="border-color: var(--border); color: var(--on-surface)">
                          <input
                            type="checkbox"
                            [checked]="statusForm.allowed_transitions.includes(candidate.key)"
                            (change)="toggleTransition(candidate.key, $event)" />
                          {{ candidate.label_es }}
                        </label>
                      }
                    }
                  </div>
                </div>

                @if (statusFormError()) {
                  <p class="text-xs font-medium" style="color: var(--magenta)">{{ statusFormError() }}</p>
                }

                <div class="flex items-center gap-2 justify-end">
                  <button
                    (click)="resetStatusEditor()"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold"
                    style="color: var(--muted)">
                    Cancelar
                  </button>
                  <button
                    (click)="saveStatus()"
                    class="rounded-lg px-3 py-1.5 text-xs font-semibold text-white"
                    style="background: var(--accent)">
                    Guardar estado
                  </button>
                </div>
              } @else {
                <p class="text-sm" style="color: var(--muted)">Selecciona un estado para editarlo o crea uno nuevo.</p>
              }
            </div>
          </div>
        </div>
      }

      <!-- Departments Tab -->
      @if (activeTab() === 'departments') {
        <div class="dash-card p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold" style="color: var(--on-surface)">
              {{ 'settings.departmentManagement' | translate }}
            </h2>
          </div>

          <!-- Add department -->
          <div class="flex items-center gap-2 mb-5">
            <input
              [(ngModel)]="newDeptName"
              class="flex-1 rounded-lg border px-3 py-2 text-sm"
              style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
              [placeholder]="'settings.departmentPlaceholder' | translate"
              (keyup.enter)="addDepartment()" />
            <button
              (click)="addDepartment()"
              [disabled]="!newDeptName.trim()"
              class="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              style="background: var(--accent)">
              {{ 'settings.addDepartment' | translate }}
            </button>
          </div>

          @if (deptFormError()) {
            <p class="mb-3 text-xs font-medium" style="color: var(--magenta)">{{ deptFormError() }}</p>
          }

          <!-- Department list -->
          <div class="space-y-2">
            @for (dept of deptStore.all(); track dept) {
              <div class="flex items-center gap-4 rounded-xl border px-5 py-3"
                   style="border-color: var(--border)">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                     style="background: color-mix(in srgb, var(--primary-light) 10%, transparent)">
                  <svg class="h-4 w-4" style="color: var(--primary-light)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
                  </svg>
                </div>
                <span class="flex-1 text-sm font-semibold" style="color: var(--on-surface)">{{ dept }}</span>
                <button
                  (click)="removeDepartment(dept)"
                  class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                  style="color: var(--magenta)">
                  {{ 'settings.removeDepartment' | translate }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Countries Tab -->
      @if (activeTab() === 'countries') {
        <div class="dash-card p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold" style="color: var(--on-surface)">
              {{ 'settings.countryManagement' | translate }}
            </h2>
          </div>

          <!-- Add country form -->
          <div class="grid gap-2 sm:grid-cols-4 items-end mb-5">
            <div>
              <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.countryCode' | translate }}</label>
              <input
                [(ngModel)]="newCountryCode"
                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm uppercase"
                style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                placeholder="VE" maxlength="3" />
            </div>
            <div>
              <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.countryName' | translate }}</label>
              <input
                [(ngModel)]="newCountryName"
                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                placeholder="Venezuela" />
            </div>
            <div>
              <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.countryFlag' | translate }}</label>
              <input
                [(ngModel)]="newCountryFlag"
                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                placeholder="🇻🇪" />
            </div>
            <button
              (click)="addCountry()"
              [disabled]="!newCountryCode.trim() || !newCountryName.trim()"
              class="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              style="background: var(--accent)">
              {{ 'settings.addCountry' | translate }}
            </button>
          </div>

          @if (countryFormError()) {
            <p class="mb-3 text-xs font-medium" style="color: var(--magenta)">{{ countryFormError() }}</p>
          }

          <!-- Country list -->
          <div class="space-y-2">
            @for (country of countryStore.all(); track country.code) {
              <div class="flex items-center gap-4 rounded-xl border px-5 py-3"
                   style="border-color: var(--border)">
                <span class="text-2xl">{{ country.flag }}</span>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold" style="color: var(--on-surface)">
                    <span class="font-mono text-[10px] mr-1.5 px-1 py-0.5 rounded" style="background: color-mix(in srgb, var(--primary-light) 12%, transparent); color: var(--primary-light)">{{ country.code }}</span>
                    {{ country.name }}
                  </p>
                </div>
                <button
                  (click)="removeCountry(country.code)"
                  class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                  style="color: var(--magenta)">
                  {{ 'settings.removeCountry' | translate }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Modules Tab -->
      @if (activeTab() === 'modules') {
        <div class="dash-card p-6">
          <div class="flex items-center justify-between mb-5">
            <h2 class="text-base font-semibold" style="color: var(--on-surface)">
              {{ 'settings.moduleManagement' | translate }}
            </h2>
          </div>

          <div class="grid gap-2 sm:grid-cols-4 items-end mb-5">
            <div>
              <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.moduleKey' | translate }}</label>
              <input
                [(ngModel)]="newModuleKey"
                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm font-mono lowercase"
                style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                placeholder="ej: erp" />
            </div>
            <div>
              <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.moduleLabelEs' | translate }}</label>
              <input
                [(ngModel)]="newModuleLabelEs"
                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                placeholder="ERP / Gestión" />
            </div>
            <div>
              <label class="text-xs font-semibold" style="color: var(--muted)">{{ 'settings.moduleLabelEn' | translate }}</label>
              <input
                [(ngModel)]="newModuleLabelEn"
                class="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                style="background: var(--surface-card); border-color: var(--border); color: var(--on-surface)"
                placeholder="ERP / Management" />
            </div>
            <button
              (click)="addModule()"
              [disabled]="!newModuleKey.trim() || !newModuleLabelEs.trim() || !newModuleLabelEn.trim()"
              class="rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors disabled:opacity-40"
              style="background: var(--accent)">
              {{ 'settings.addModule' | translate }}
            </button>
          </div>

          @if (moduleFormError()) {
            <p class="mb-3 text-xs font-medium" style="color: var(--magenta)">{{ moduleFormError() }}</p>
          }

          <div class="space-y-2">
            @for (mod of moduleStore.all(); track mod.key) {
              <div class="flex items-center gap-4 rounded-xl border px-5 py-3"
                   style="border-color: var(--border)">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
                     style="background: color-mix(in srgb, var(--accent) 10%, transparent)">
                  <svg class="h-4 w-4" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L2.25 7.5 12 2.25l9.75 5.25-4.179 2.25m0 0L12 12.75l-5.571-3m11.142 0l4.179 2.25L12 17.25l-9.75-5.25 4.179-2.25"/>
                  </svg>
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-semibold" style="color: var(--on-surface)">
                    <span class="font-mono text-[10px] mr-1.5 px-1 py-0.5 rounded" style="background: color-mix(in srgb, var(--primary-light) 12%, transparent); color: var(--primary-light)">{{ mod.key }}</span>
                    {{ mod.label_es }}
                  </p>
                  <p class="text-[10px]" style="color: var(--muted)">EN: {{ mod.label_en }}</p>
                </div>
                <button
                  (click)="removeModule(mod.key)"
                  class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                  style="color: var(--magenta)">
                  {{ 'settings.removeModule' | translate }}
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- Objectives Tab -->
      @if (activeTab() === 'objectives') {
        <div class="dash-card p-6">
          <div class="flex items-center justify-between mb-5">
            <div>
              <h2 class="text-base font-semibold" style="color: var(--on-surface)">{{ 'objectives.title' | translate }}</h2>
              <p class="text-xs mt-0.5" style="color: var(--muted)">{{ 'objectives.subtitle' | translate }}</p>
            </div>
            <button (click)="showObjForm.set(!showObjForm())"
                    class="rounded-xl px-4 py-2 text-xs font-semibold text-white transition-all hover:shadow-md"
                    style="background: var(--accent)">
              {{ 'objectives.addObjective' | translate }}
            </button>
          </div>

          @if (objFormError(); as err) {
            <div class="mb-4 rounded-lg px-3 py-2 text-xs font-semibold" style="background: color-mix(in srgb, var(--magenta) 10%, transparent); color: var(--magenta)">{{ err }}</div>
          }

          <!-- Add/Edit form -->
          @if (showObjForm()) {
            <div class="mb-5 rounded-2xl border p-4 space-y-3" style="border-color: var(--border); background: var(--surface-alt)">
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'objectives.code' | translate }}</label>
                  <input [(ngModel)]="newObjCode" [placeholder]="'objectives.codePlaceholder' | translate"
                         class="gp-input w-full" />
                </div>
                <div>
                  <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'objectives.year' | translate }}</label>
                  <div class="gp-input w-full" style="opacity: 0.7; cursor: default">{{ currentObjYear }}</div>
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'objectives.objectiveTitle' | translate }}</label>
                <input [(ngModel)]="newObjTitle" [placeholder]="'objectives.titlePlaceholder' | translate"
                       class="gp-input w-full" />
              </div>
              <div>
                <label class="block text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'objectives.description' | translate }}</label>
                <textarea [(ngModel)]="newObjDescription" [placeholder]="'objectives.descriptionPlaceholder' | translate"
                          class="gp-input w-full" rows="2"></textarea>
              </div>
              <div class="flex justify-end">
                <button (click)="saveObjective()"
                        class="rounded-xl px-6 py-2 text-xs font-semibold text-white transition-all hover:shadow-md"
                        style="background: var(--accent)">
                  {{ 'common.save' | translate }}
                </button>
              </div>
            </div>
          }

          <!-- Objectives list (current period) -->
          <div class="space-y-2">
            @for (obj of filteredObjectives(); track obj.id) {
              <div class="flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:shadow-sm"
                   style="border-color: var(--border); background: var(--surface-card)">
                <div class="flex-1 min-w-0">
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-[10px] px-1.5 py-0.5 rounded"
                          style="background: color-mix(in srgb, var(--accent) 12%, transparent); color: var(--accent)">{{ obj.code }}</span>
                    <span class="text-sm font-semibold" style="color: var(--on-surface)">{{ obj.title }}</span>
                    @if (!obj.is_active) {
                      <span class="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded"
                            style="background: color-mix(in srgb, var(--muted) 12%, transparent); color: var(--muted)">
                        {{ 'objectives.inactive' | translate }}
                      </span>
                    }
                  </div>
                  @if (obj.description) {
                    <p class="text-[11px] mt-0.5" style="color: var(--muted)">{{ obj.description }}</p>
                  }
                </div>
                <div class="flex gap-1.5 shrink-0">
                  <button (click)="editObjective(obj)"
                          class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                          style="color: var(--primary-light)">
                    {{ 'objectives.edit' | translate }}
                  </button>
                  <button (click)="toggleObjectiveActive(obj)"
                          class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                          [style.color]="obj.is_active ? 'var(--orange)' : 'var(--lime)'">
                    {{ obj.is_active ? ('objectives.deactivate' | translate) : ('objectives.activate' | translate) }}
                  </button>
                  <button (click)="removeObjective(obj)"
                          class="rounded-lg px-2.5 py-1 text-[10px] font-semibold transition-colors"
                          style="color: var(--magenta)">
                    {{ 'common.delete' | translate }}
                  </button>
                </div>
              </div>
            } @empty {
              <div class="text-center py-8">
                <p class="text-sm italic" style="color: var(--muted)">{{ 'objectives.noObjectivesYet' | translate }}</p>
              </div>
            }
          </div>
        </div>
      }

      <!-- Period Configuration Tab -->
      @if (activeTab() === 'fiscal') {
        <div class="dash-card p-6">
          <h2 class="mb-5 text-base font-semibold" style="color: var(--on-surface)">
            {{ 'settings.fiscalConfig' | translate }}
          </h2>

          <!-- Current period preview -->
          <div class="mt-5 rounded-xl border p-4" style="border-color: var(--border); background: color-mix(in srgb, var(--accent) 3%, var(--surface-card))">
            <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--muted)">
              {{ 'settings.currentFY' | translate }}
            </p>
            <p class="mt-1 text-lg font-bold" style="color: var(--on-surface)">
              {{ fyService.currentFiscalYear().label }}
            </p>
            <p class="mt-0.5 text-xs" style="color: var(--muted)">
              {{ formatDate(fyService.currentFiscalYear().startDate) }} — {{ formatDate(fyService.currentFiscalYear().endDate) }}
            </p>
          </div>

          <!-- Warning -->
          <div class="mt-4 flex items-start gap-2 rounded-xl border px-4 py-3"
               style="border-color: color-mix(in srgb, var(--orange) 30%, var(--border)); background: color-mix(in srgb, var(--orange) 5%, transparent)">
            <svg class="h-4 w-4 mt-0.5 shrink-0" style="color: var(--orange)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
            </svg>
            <p class="text-xs" style="color: var(--orange)">
              {{ 'settings.fiscalWarning' | translate }}
            </p>
          </div>
        </div>
      }
    </div>
  `,
})
export class SettingsLayoutComponent {
  teamStore = inject(TeamStore);
  fyService = inject(FiscalYearService);
  users = inject(UserStoreService);
  statusStore = inject(StatusConfigStore);
  deptStore = inject(DepartmentStore);
  countryStore = inject(CountryStore);
  moduleStore = inject(AffectedModuleStore);
  objectiveStore = inject(ObjectiveStoreService);
  private confirmDialog = inject(ConfirmDialogService);
  private i18n = inject(I18nService);

  activeTab = signal<SettingsTab>('teams');
  showAddForm = signal(false);

  // New team form
  newTeamName = '';
  newTeamCode = '';
  newTeamDesc = '';
  newTeamIcon = '💼';
  teamFormError = signal<string | null>(null);
  readonly visibleTeams = computed(() => this.teamStore.activeTeams());
  readonly teamEmojiOptions = TEAM_EMOJI_OPTIONS;

  readonly roleOptions: { value: UserRole; labelKey: string }[] = ROLE_OPTIONS;

  // Edit team
  editingId: string | null = null;
  editName = '';
  editError = signal<string | null>(null);
  selectedTeamId = signal<string>('');
  memberSearch = signal<string>('');
  readonly filteredMembers = computed(() => {
    const selectedTeam = this.selectedTeamId();
    const query = this.memberSearch().trim().toLowerCase();
    return this.users.all().filter((member) => {
      const inSelectedTeam = selectedTeam ? member.team_id === selectedTeam : !member.team_id;
      if (!inSelectedTeam) return false;
      if (!query) return true;
      const searchable = `${member.display_name ?? ''} ${member.email} ${member.role} ${member.department ?? ''}`.toLowerCase();
      return searchable.includes(query);
    });
  });
  selectedStatusKey = signal<string | null>(null);
  isNewStatus = signal(false);
  statusFormError = signal<string | null>(null);
  orderedStatuses = computed(() =>
    [...this.statusStore.all()].sort((a, b) => a.order - b.order)
  );

  colorOptions = STATUS_COLOR_OPTIONS;

  statusForm: StatusConfig = {
    key: '',
    label_es: '',
    label_en: '',
    color: 'var(--cool-gray)',
    bgColor: 'color-mix(in srgb, var(--cool-gray) 12%, transparent)',
    order: 0,
    allowed_transitions: [],
    is_active: true,
  };

  constructor() {
    this.selectedTeamId.set(this.visibleTeams()[0]?.id ?? '');
  }

  async addTeam(): Promise<void> {
    if (!this.newTeamName.trim() || !this.newTeamCode.trim()) return;
    this.teamFormError.set(null);
    try {
      await this.teamStore.addTeam({
        name: this.newTeamName.trim(),
        code: this.newTeamCode.trim().toUpperCase(),
        description: this.newTeamDesc.trim() || undefined,
        icon: this.newTeamIcon,
        is_active: true,
      });
      this.newTeamName = '';
      this.newTeamCode = '';
      this.newTeamDesc = '';
      this.newTeamIcon = '💼';
      if (!this.selectedTeamId()) this.selectedTeamId.set(this.visibleTeams()[0]?.id ?? '');
      this.showAddForm.set(false);
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      this.teamFormError.set(
        code === 'team_name_duplicate'
          ? 'Ya existe un equipo con ese nombre.'
          : code === 'team_code_duplicate'
            ? 'Ya existe un equipo con ese codigo.'
            : code === 'persist_failed'
              ? 'No se pudo guardar el equipo en la base de datos.'
            : 'No se pudo crear el equipo.'
      );
    }
  }

  startEdit(team: Team): void {
    this.editingId = team.id;
    this.editName = team.name;
    this.editError.set(null);
  }

  async saveEdit(id: string): Promise<void> {
    this.editError.set(null);
    if (!this.editName.trim()) {
      this.editError.set('El nombre del equipo es obligatorio.');
      return;
    }
    try {
      await this.teamStore.updateTeam(id, { name: this.editName.trim() });
      this.editingId = null;
    } catch (error) {
      const code = error instanceof Error ? error.message : '';
      this.editError.set(
        code === 'team_name_duplicate'
          ? 'Ya existe un equipo con ese nombre.'
          : code === 'persist_failed'
            ? 'No se pudo guardar el cambio en base de datos.'
          : 'No se pudo actualizar el equipo.'
      );
    }
  }

  async assignMemberTeam(userId: string, teamId: string | null): Promise<void> {
    this.teamFormError.set(null);
    try {
      await this.users.updateUserTeam(userId, teamId || null);
    } catch {
      this.teamFormError.set(this.i18n.t('settings.roleUpdateError'));
    }
  }

  async assignMemberRole(userId: string, role: UserRole): Promise<void> {
    this.teamFormError.set(null);
    try {
      await this.users.updateUserRole(userId, role);
    } catch {
      this.teamFormError.set(this.i18n.t('settings.roleUpdateError'));
    }
  }

  async toggleTeamActive(teamId: string): Promise<void> {
    this.teamFormError.set(null);
    try {
      await this.teamStore.toggleActive(teamId);
      if (!this.visibleTeams().some((t) => t.id === this.selectedTeamId())) {
        this.selectedTeamId.set(this.visibleTeams()[0]?.id ?? '');
      }
    } catch {
      this.teamFormError.set(this.i18n.t('settings.teamToggleError'));
    }
  }

  // Department management
  newDeptName = '';
  deptFormError = signal<string | null>(null);

  async addDepartment(): Promise<void> {
    this.deptFormError.set(null);
    const name = this.newDeptName.trim();
    if (!name) return;
    const ok = await this.deptStore.add(name);
    if (!ok) {
      this.deptFormError.set(this.i18n.t('settings.addAreaError'));
      return;
    }
    this.newDeptName = '';
  }

  async removeDepartment(name: string): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.t('settings.deleteAreaTitle'),
      message: this.i18n.t('settings.deleteAreaConfirm').replace('{name}', name),
      confirmText: this.i18n.t('common.delete'),
      cancelText: this.i18n.t('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    const ok = await this.deptStore.remove(name);
    if (!ok) {
      this.deptFormError.set(this.i18n.t('settings.deleteAreaError'));
    }
  }

  // Country management
  newCountryCode = '';
  newCountryName = '';
  newCountryFlag = '';
  countryFormError = signal<string | null>(null);

  async addCountry(): Promise<void> {
    this.countryFormError.set(null);
    const code = this.newCountryCode.trim().toUpperCase();
    const name = this.newCountryName.trim();
    const flag = this.newCountryFlag.trim();
    if (!code || !name) return;
    const ok = await this.countryStore.add({ code, name, flag });
    if (!ok) {
      this.countryFormError.set(this.i18n.t('settings.addCountryError'));
      return;
    }
    this.newCountryCode = '';
    this.newCountryName = '';
    this.newCountryFlag = '';
  }

  async removeCountry(code: string): Promise<void> {
    const country = this.countryStore.getByCode(code);
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.t('settings.deleteCountryTitle'),
      message: this.i18n.t('settings.deleteCountryConfirm').replace('{name}', country?.name ?? code),
      confirmText: this.i18n.t('common.delete'),
      cancelText: this.i18n.t('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    const ok = await this.countryStore.remove(code);
    if (!ok) {
      this.countryFormError.set(this.i18n.t('settings.deleteCountryError'));
    }
  }

  // Module management
  newModuleKey = '';
  newModuleLabelEs = '';
  newModuleLabelEn = '';
  moduleFormError = signal<string | null>(null);

  async addModule(): Promise<void> {
    this.moduleFormError.set(null);
    const key = this.newModuleKey.trim().toLowerCase().replace(/\s+/g, '_');
    const labelEs = this.newModuleLabelEs.trim();
    const labelEn = this.newModuleLabelEn.trim();
    if (!key || !labelEs || !labelEn) return;
    const nextOrder = (this.moduleStore.all().length ?? 0) + 1;
    const ok = await this.moduleStore.add({ key, label_es: labelEs, label_en: labelEn, order: nextOrder });
    if (!ok) {
      this.moduleFormError.set(this.i18n.t('settings.moduleError'));
      return;
    }
    this.newModuleKey = '';
    this.newModuleLabelEs = '';
    this.newModuleLabelEn = '';
  }

  async removeModule(key: string): Promise<void> {
    const mod = this.moduleStore.all().find((m) => m.key === key);
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.t('settings.removeModuleTitle'),
      message: `${this.i18n.t('settings.removeModuleConfirm')} "${mod?.label_es ?? key}"?`,
      confirmText: this.i18n.t('common.delete'),
      cancelText: this.i18n.t('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    const ok = await this.moduleStore.remove(key);
    if (!ok) {
      this.moduleFormError.set(this.i18n.t('settings.moduleDeleteError'));
    }
  }

  editStatus(status: StatusConfig): void {
    this.isNewStatus.set(false);
    this.selectedStatusKey.set(status.key);
    this.statusFormError.set(null);
    this.statusForm = { ...status, allowed_transitions: [...status.allowed_transitions] };
  }

  startNewStatus(): void {
    this.isNewStatus.set(true);
    this.selectedStatusKey.set('__new__');
    this.statusFormError.set(null);
    this.statusForm = {
      key: '',
      label_es: '',
      label_en: '',
      color: 'var(--cool-gray)',
      bgColor: 'color-mix(in srgb, var(--cool-gray) 12%, transparent)',
      order: this.orderedStatuses().length,
      allowed_transitions: [],
      is_active: true,
    };
  }

  resetStatusEditor(): void {
    this.selectedStatusKey.set(null);
    this.isNewStatus.set(false);
    this.statusFormError.set(null);
  }

  toggleTransition(key: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    const current = new Set(this.statusForm.allowed_transitions);
    if (checked) current.add(key);
    else current.delete(key);
    this.statusForm.allowed_transitions = [...current];
  }

  async saveStatus(): Promise<void> {
    this.statusFormError.set(null);
    const key = this.statusForm.key.trim().toLowerCase();
    const label = this.statusForm.label_es.trim();
    if (!key) {
      this.statusFormError.set(this.i18n.t('settings.statusKeyRequired'));
      return;
    }
    if (!/^[a-z0-9_]+$/.test(key)) {
      this.statusFormError.set(this.i18n.t('settings.statusKeyFormat'));
      return;
    }
    if (!label) {
      this.statusFormError.set(this.i18n.t('settings.statusNameRequired'));
      return;
    }
    const exists = this.statusStore.getByKey(key);
    if (this.isNewStatus() && exists) {
      this.statusFormError.set(this.i18n.t('settings.statusKeyDuplicate'));
      return;
    }

    const color = this.statusForm.color;
    const payload: StatusConfig = {
      ...this.statusForm,
      key,
      label_es: label,
      label_en: label,
      color,
      bgColor: `color-mix(in srgb, ${color} 12%, transparent)`,
      allowed_transitions: this.statusForm.allowed_transitions.filter((t) => t !== key),
    };
    try {
      await this.statusStore.upsertStatus(payload);
      this.selectedStatusKey.set(payload.key);
      this.isNewStatus.set(false);
    } catch {
      this.statusFormError.set(this.i18n.t('settings.statusSaveError'));
    }
  }

  toNumber(value: string | number): number {
    const n = typeof value === 'string' ? parseInt(value, 10) : value;
    return Number.isFinite(n) ? n : 0;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // ─── Objectives management ───
  showObjForm = signal(false);
  objFormError = signal<string | null>(null);
  editingObjId: string | null = null;
  newObjCode = '';
  newObjTitle = '';
  newObjDescription = '';

  get currentObjYear(): number {
    return this.objectiveStore.getCurrentYear();
  }

  readonly filteredObjectives = computed(() => {
    const year = this.currentObjYear;
    return this.objectiveStore.allTeamObjectives().filter((o) => o.year === year);
  });

  editObjective(obj: import('../../../shared/models/request.model').Objective): void {
    this.editingObjId = obj.id;
    this.newObjCode = obj.code;
    this.newObjTitle = obj.title;
    this.newObjDescription = obj.description ?? '';
    this.showObjForm.set(true);
  }

  async saveObjective(): Promise<void> {
    this.objFormError.set(null);
    const code = this.newObjCode.trim().toUpperCase();
    const title = this.newObjTitle.trim();
    if (!code || !title) return;

    const teamId = this.visibleTeams()[0]?.id;
    if (!teamId) return;

    if (this.editingObjId) {
      const ok = await this.objectiveStore.updateObjective(this.editingObjId, {
        code,
        title,
        description: this.newObjDescription.trim() || undefined,
      });
      if (!ok) {
        this.objFormError.set(this.i18n.t('objectives.saveError'));
        return;
      }
    } else {
      const result = await this.objectiveStore.createObjective({
        team_id: teamId,
        year: this.currentObjYear,
        code,
        title,
        description: this.newObjDescription.trim() || undefined,
        is_active: true,
      });
      if (!result) {
        this.objFormError.set(this.i18n.t('objectives.saveError'));
        return;
      }
    }

    this.resetObjForm();
  }

  async toggleObjectiveActive(obj: import('../../../shared/models/request.model').Objective): Promise<void> {
    this.objFormError.set(null);
    const ok = await this.objectiveStore.updateObjective(obj.id, { is_active: !obj.is_active });
    if (!ok) {
      this.objFormError.set(this.i18n.t('objectives.saveError'));
    }
  }

  async removeObjective(obj: import('../../../shared/models/request.model').Objective): Promise<void> {
    const confirmed = await this.confirmDialog.confirm({
      title: this.i18n.t('objectives.deleteTitle'),
      message: this.i18n.t('objectives.deleteConfirm').replace('{name}', obj.title),
      confirmText: this.i18n.t('common.delete'),
      cancelText: this.i18n.t('common.cancel'),
      variant: 'danger',
    });
    if (!confirmed) return;
    const ok = await this.objectiveStore.deleteObjective(obj.id);
    if (!ok) {
      this.objFormError.set(this.i18n.t('objectives.deleteError'));
    }
  }

  private resetObjForm(): void {
    this.editingObjId = null;
    this.newObjCode = '';
    this.newObjTitle = '';
    this.newObjDescription = '';
    this.showObjForm.set(false);
  }
}

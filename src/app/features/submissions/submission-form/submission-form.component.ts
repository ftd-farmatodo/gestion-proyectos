import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { RequestType, CreateRequestPayload, Attachment } from '../../../shared/models/request.model';
import { SubmissionsService } from '../submissions.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { I18nService } from '../../../core/services/i18n.service';
import { CountryStore } from '../../../core/services/country-store.service';
import { AffectedModuleStore } from '../../../core/services/affected-module-store.service';
import {
  PriorityInferenceService,
  type PriorityInferenceAnswers,
  type TimeCriticalityKey,
  type OperationalDisruptionKey,
  type UserReachKey,
  type BusinessImpactKey,
} from '../../../core/services/priority-inference.service';
import { Subscription } from 'rxjs';
import {
  SUBMISSION_STEPS,
  URGENCY_OPTIONS,
  IMPACT_OPTIONS,
  TIME_CRITICALITY_OPTIONS,
  OPERATIONAL_DISRUPTION_OPTIONS,
  USER_REACH_OPTIONS,
  BUSINESS_IMPACT_OPTIONS,
  type WizardStep,
} from './submission-form.config';

const DRAFT_KEY = 'gp_submission_draft';

@Component({
  selector: 'app-submission-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, TranslatePipe],
  styleUrl: './submission-form.component.scss',
  template: `
    <div class="mx-auto max-w-4xl space-y-6 p-4 lg:p-6 animate-fade-in">
      <div class="flex items-center justify-between gap-4">
        <div>
          <a routerLink="/submissions/list" class="text-sm transition-colors hover:opacity-80" style="color: var(--accent)">
            ← {{ 'submissions.backToList' | translate }}
          </a>
          <h1 class="mt-2 text-2xl font-bold tracking-tight" style="color: var(--on-surface)">
            {{ 'submissions.formTitle' | translate }}
          </h1>
          <p class="mt-1 text-sm" style="color: var(--muted)">
            {{ 'submissions.formSubtitle' | translate }}
          </p>
        </div>
        @if (!submitted() && hasDraft()) {
          <span class="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold"
                style="background: color-mix(in srgb, var(--lime) 12%, transparent); color: var(--lime)">
            <svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {{ 'submissions.draftSaved' | translate }}
          </span>
        }
      </div>

      <!-- Success State -->
      @if (submitted()) {
        <div class="flex flex-col items-center justify-center rounded-3xl border p-12 text-center animate-fade-in"
          style="background: var(--surface-card); border-color: var(--border)">
          <div class="mb-6 flex h-20 w-20 items-center justify-center rounded-full"
            style="background: color-mix(in srgb, var(--accent) 12%, transparent)">
            <svg class="h-10 w-10 animate-check" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
            </svg>
          </div>
          <h2 class="text-xl font-bold" style="color: var(--on-surface)">{{ 'submissions.successTitle' | translate }}</h2>
          <p class="mt-2 text-sm max-w-sm" style="color: var(--muted)">{{ 'submissions.successMessage' | translate }}</p>
          @if (createdInternalId()) {
            <p class="mt-3 rounded-lg px-3 py-1.5 font-mono text-xs font-semibold"
               style="background: color-mix(in srgb, var(--primary-light) 10%, transparent); color: var(--primary-light)">
              {{ createdInternalId() }}
            </p>
          }
          <p class="mt-4 text-xs max-w-xs" style="color: var(--muted)">{{ 'submissions.successNextSteps' | translate }}</p>
          <a routerLink="/submissions/list"
            class="mt-6 inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            style="background: var(--accent)">
            {{ 'submissions.successGoToList' | translate }}
          </a>
        </div>
      } @else {

      <!-- Stepper -->
      <div class="mb-8">
        <div class="flex items-center justify-between">
          @for (s of steps; track s.num; let i = $index) {
            <div class="flex flex-col items-center gap-1.5 flex-1"
              [class.cursor-pointer]="canGoToStep(s.num)"
              (click)="canGoToStep(s.num) && goToStep(s.num)">
              <div class="relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-all duration-300"
                [style.background]="step() > s.num ? 'var(--accent)' : step() === s.num ? 'var(--primary)' : 'var(--surface-alt)'"
                [style.color]="step() >= s.num ? 'white' : 'var(--muted)'"
                [style.box-shadow]="step() === s.num ? '0 0 0 4px color-mix(in srgb, var(--primary) 20%, transparent)' : 'none'">
                @if (step() > s.num) {
                  <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                } @else {
                  {{ s.num }}
                }
              </div>
              <span class="text-[11px] font-semibold text-center hidden sm:block"
                [style.color]="step() >= s.num ? 'var(--on-surface)' : 'var(--muted)'">
                {{ s.labelKey | translate }}
              </span>
            </div>
            @if (i < steps.length - 1) {
              <div class="flex-1 mx-1 mt-[-20px] sm:mt-[-32px]">
                <div class="h-0.5 rounded-full transition-colors duration-300"
                  [style.background]="step() > s.num ? 'var(--accent)' : 'var(--border)'">
                </div>
              </div>
            }
          }
        </div>
      </div>

      <!-- Form card -->
      <form [formGroup]="form" (ngSubmit)="onSubmit()"
        class="rounded-3xl border shadow-sm overflow-hidden"
        style="background: var(--surface-card); border-color: var(--border)">

        <!-- STEP 1: Type Selection -->
        @if (step() === 1) {
          <div class="p-6 lg:p-8 space-y-6 animate-slide-in">
            <div>
              <h2 class="text-lg font-bold" style="color: var(--on-surface)">{{ 'submissions.selectType' | translate }}</h2>
              <p class="mt-1 text-sm" style="color: var(--muted)">{{ 'submissions.step' | translate }} 1/4</p>
            </div>
            <div class="grid gap-4 sm:grid-cols-3">
              <button type="button" (click)="selectType('incidencia')"
                class="group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                [style.border-color]="form.get('type')?.value === 'incidencia' ? 'var(--magenta)' : 'var(--border)'"
                [style.background]="form.get('type')?.value === 'incidencia' ? 'color-mix(in srgb, var(--magenta) 5%, var(--surface-card))' : 'var(--surface-card)'">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors"
                  [style.background]="form.get('type')?.value === 'incidencia' ? 'var(--magenta)' : 'color-mix(in srgb, var(--magenta) 10%, transparent)'"
                  [style.color]="form.get('type')?.value === 'incidencia' ? 'white' : 'var(--magenta)'">
                  <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-bold" style="color: var(--on-surface)">{{ 'submissions.typeIncidencia' | translate }}</div>
                  <p class="mt-1 text-[11px] leading-relaxed" style="color: var(--muted)">{{ 'submissions.typeIncidenciaDesc' | translate }}</p>
                </div>
                @if (form.get('type')?.value === 'incidencia') {
                  <div class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full" style="background: var(--magenta)">
                    <svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </div>
                }
              </button>

              <button type="button" (click)="selectType('mejora')"
                class="group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                [style.border-color]="form.get('type')?.value === 'mejora' ? 'var(--primary-light)' : 'var(--border)'"
                [style.background]="form.get('type')?.value === 'mejora' ? 'color-mix(in srgb, var(--primary-light) 5%, var(--surface-card))' : 'var(--surface-card)'">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors"
                  [style.background]="form.get('type')?.value === 'mejora' ? 'var(--primary-light)' : 'color-mix(in srgb, var(--primary-light) 10%, transparent)'"
                  [style.color]="form.get('type')?.value === 'mejora' ? 'white' : 'var(--primary-light)'">
                  <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-bold" style="color: var(--on-surface)">{{ 'submissions.typeMejora' | translate }}</div>
                  <p class="mt-1 text-[11px] leading-relaxed" style="color: var(--muted)">{{ 'submissions.typeMejoraDesc' | translate }}</p>
                </div>
                @if (form.get('type')?.value === 'mejora') {
                  <div class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full" style="background: var(--primary-light)">
                    <svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </div>
                }
              </button>

              <button type="button" (click)="selectType('proyecto')"
                class="group relative flex flex-col items-center gap-3 rounded-2xl border-2 p-6 text-center transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                [style.border-color]="form.get('type')?.value === 'proyecto' ? 'var(--lime)' : 'var(--border)'"
                [style.background]="form.get('type')?.value === 'proyecto' ? 'color-mix(in srgb, var(--lime) 5%, var(--surface-card))' : 'var(--surface-card)'">
                <div class="flex h-14 w-14 items-center justify-center rounded-2xl transition-colors"
                  [style.background]="form.get('type')?.value === 'proyecto' ? 'var(--lime)' : 'color-mix(in srgb, var(--lime) 10%, transparent)'"
                  [style.color]="form.get('type')?.value === 'proyecto' ? 'white' : 'var(--lime)'">
                  <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
                  </svg>
                </div>
                <div>
                  <div class="text-sm font-bold" style="color: var(--on-surface)">{{ 'submissions.typeProyecto' | translate }}</div>
                  <p class="mt-1 text-[11px] leading-relaxed" style="color: var(--muted)">{{ 'submissions.typeProyectoDesc' | translate }}</p>
                </div>
                @if (form.get('type')?.value === 'proyecto') {
                  <div class="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full" style="background: var(--lime)">
                    <svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                    </svg>
                  </div>
                }
              </button>
            </div>
          </div>
        }

        <!-- STEP 2: Information -->
        @if (step() === 2) {
          <div class="p-6 lg:p-8 space-y-5 animate-slide-in">
            <div>
              <h2 class="text-lg font-bold" style="color: var(--on-surface)">{{ 'submissions.stepInfo' | translate }}</h2>
              <p class="mt-1 text-sm" style="color: var(--muted)">{{ 'submissions.step' | translate }} 2/4</p>
            </div>

            <!-- Title -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">
                {{ 'submissions.requestTitle' | translate }} <span style="color: var(--magenta)">*</span>
              </label>
              <input type="text" formControlName="title"
                class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2 transition-colors"
                style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                [placeholder]="'submissions.requestTitlePlaceholder' | translate" />
              @if (form.get('title')?.invalid && form.get('title')?.touched) {
                <p class="mt-1.5 text-xs font-medium" style="color: var(--magenta)">{{ 'submissions.titleRequired' | translate }}</p>
              }
            </div>

            <!-- Description with character counter -->
            <div>
              <div class="flex items-end justify-between mb-1.5">
                <label class="block text-sm font-medium" style="color: var(--on-surface)">
                  {{ 'submissions.description' | translate }} <span style="color: var(--magenta)">*</span>
                </label>
                <span class="text-[10px] tabular-nums"
                      [style.color]="descriptionLength() < 20 ? 'var(--magenta)' : 'var(--muted)'">
                  {{ descriptionLength() }}/20 min
                </span>
              </div>
              <textarea formControlName="description" rows="4"
                class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2 resize-none transition-colors"
                style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                [placeholder]="'submissions.descriptionPlaceholder' | translate">
              </textarea>
              @if (form.get('description')?.invalid && form.get('description')?.touched) {
                <p class="mt-1.5 text-xs font-medium" style="color: var(--magenta)">{{ 'submissions.descriptionRequired' | translate }}</p>
              }
            </div>

            <!-- Affected module -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">
                {{ 'submissions.affectedModule' | translate }}
              </label>
              <select formControlName="affected_module" class="w-full gp-select">
                <option value="">{{ 'submissions.modulePlaceholder' | translate }}</option>
                @for (mod of moduleStore.all(); track mod.key) {
                  <option [value]="mod.key">{{ moduleStore.getLabel(mod.key) }}</option>
                }
              </select>
            </div>

            <!-- Country of origin -->
            <div>
              <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">
                {{ 'submissions.countries' | translate }}
              </label>
              <p class="text-[11px] mb-2.5" style="color: var(--muted)">{{ 'submissions.countriesHint' | translate }}</p>
              <div class="flex flex-wrap gap-2">
                @for (country of countryStore.all(); track country.code) {
                  <button type="button" (click)="toggleCountry(country.code)"
                    class="inline-flex items-center gap-1.5 rounded-xl border-2 px-3.5 py-2 text-sm font-medium transition-all duration-200"
                    [style.border-color]="isCountrySelected(country.code) ? 'var(--accent)' : 'var(--border)'"
                    [style.background]="isCountrySelected(country.code) ? 'color-mix(in srgb, var(--accent) 8%, var(--surface-card))' : 'var(--surface-card)'"
                    [style.color]="isCountrySelected(country.code) ? 'var(--accent)' : 'var(--on-surface)'">
                    <span class="text-base leading-none">{{ country.flag }}</span>
                    <span>{{ country.name }}</span>
                    @if (isCountrySelected(country.code)) {
                      <svg class="h-3.5 w-3.5 ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                      </svg>
                    }
                  </button>
                }
              </div>
              @if (selectedCountries().length === 0 && step() === 2) {
                <p class="mt-1.5 text-[11px] font-medium" style="color: var(--orange)">{{ 'submissions.countriesRequired' | translate }}</p>
              }
            </div>

            <!-- Incidencia-specific fields -->
            @if (currentType() === 'incidencia') {
              <div class="space-y-5 rounded-2xl border p-5" style="border-color: color-mix(in srgb, var(--magenta) 25%, var(--border)); background: color-mix(in srgb, var(--magenta) 2%, var(--surface-card))">
                <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider" style="color: var(--magenta)">
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                  </svg>
                  {{ 'submissions.typeIncidencia' | translate }}
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">{{ 'submissions.stepsToReproduce' | translate }}</label>
                  <textarea formControlName="steps_to_reproduce" rows="4"
                    class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2 resize-none"
                    style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                    [placeholder]="'submissions.stepsToReproducePlaceholder' | translate">
                  </textarea>
                </div>
                <div class="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">{{ 'submissions.expectedBehavior' | translate }}</label>
                    <textarea formControlName="expected_behavior" rows="3"
                      class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2 resize-none"
                      style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                      [placeholder]="'submissions.expectedBehaviorPlaceholder' | translate">
                    </textarea>
                  </div>
                  <div>
                    <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">{{ 'submissions.actualBehavior' | translate }}</label>
                    <textarea formControlName="actual_behavior" rows="3"
                      class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2 resize-none"
                      style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                      [placeholder]="'submissions.actualBehaviorPlaceholder' | translate">
                    </textarea>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">{{ 'submissions.affectedUrl' | translate }}</label>
                  <input type="text" formControlName="affected_url"
                    class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2"
                    style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                    [placeholder]="'submissions.affectedUrlPlaceholder' | translate" />
                </div>
              </div>
            }

            <!-- Mejora/Proyecto-specific fields -->
            @if (currentType() === 'mejora' || currentType() === 'proyecto') {
              <div class="space-y-5 rounded-2xl border p-5"
                [style.border-color]="currentType() === 'mejora' ? 'color-mix(in srgb, var(--primary-light) 25%, var(--border))' : 'color-mix(in srgb, var(--lime) 25%, var(--border))'"
                [style.background]="currentType() === 'mejora' ? 'color-mix(in srgb, var(--primary-light) 2%, var(--surface-card))' : 'color-mix(in srgb, var(--lime) 2%, var(--surface-card))'">
                <div class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider"
                  [style.color]="currentType() === 'mejora' ? 'var(--primary-light)' : 'var(--lime)'">
                  @if (currentType() === 'mejora') {
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z"/>
                    </svg>
                  } @else {
                    <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z"/>
                    </svg>
                  }
                  {{ currentType() === 'mejora' ? ('submissions.typeMejora' | translate) : ('submissions.typeProyecto' | translate) }}
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">{{ 'submissions.businessJustification' | translate }}</label>
                  <textarea formControlName="business_justification" rows="3"
                    class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2 resize-none"
                    style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                    [placeholder]="'submissions.businessJustificationPlaceholder' | translate">
                  </textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">{{ 'submissions.expectedBenefit' | translate }}</label>
                  <textarea formControlName="expected_benefit" rows="2"
                    class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2 resize-none"
                    style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                    [placeholder]="'submissions.expectedBenefitPlaceholder' | translate">
                  </textarea>
                </div>
                <div>
                  <label class="block text-sm font-medium mb-1.5" style="color: var(--on-surface)">{{ 'submissions.impactedUsers' | translate }}</label>
                  <input type="text" formControlName="impacted_users"
                    class="w-full rounded-xl border px-4 py-3 text-sm shadow-sm focus:ring-2"
                    style="background: var(--surface); border-color: var(--border); color: var(--on-surface); --tw-ring-color: var(--ring)"
                    [placeholder]="'submissions.impactedUsersPlaceholder' | translate" />
                </div>
              </div>
            }
          </div>
        }

        <!-- STEP 3: Context & Priority -->
        @if (step() === 3) {
          <div class="p-6 lg:p-8 space-y-6 animate-slide-in">
            <div>
              <h2 class="text-lg font-bold" style="color: var(--on-surface)">{{ 'submissions.stepContext' | translate }}</h2>
              <p class="mt-1 text-sm" style="color: var(--muted)">{{ 'submissions.step' | translate }} 3/4</p>
            </div>

            <div class="rounded-2xl border p-4 space-y-4" style="border-color: var(--border); background: var(--surface-alt)">
              <h3 class="text-sm font-semibold" style="color: var(--on-surface)">{{ 'submissions.infSectionTitle' | translate }}</h3>
              <p class="text-xs" style="color: var(--muted)">{{ 'submissions.infSectionHint' | translate }}</p>

              <div class="grid gap-4 sm:grid-cols-2">
                <div>
                  <label class="block text-xs font-semibold mb-1.5" style="color: var(--muted)">{{ 'submissions.infTimeQuestion' | translate }}</label>
                  <select formControlName="inference_time_criticality" class="w-full gp-select">
                    @for (opt of timeCriticalityOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold mb-1.5" style="color: var(--muted)">{{ 'submissions.infDisruptionQuestion' | translate }}</label>
                  <select formControlName="inference_operational_disruption" class="w-full gp-select">
                    @for (opt of operationalDisruptionOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold mb-1.5" style="color: var(--muted)">{{ 'submissions.infReachQuestion' | translate }}</label>
                  <select formControlName="inference_user_reach" class="w-full gp-select">
                    @for (opt of userReachOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
                    }
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-semibold mb-1.5" style="color: var(--muted)">{{ 'submissions.infBusinessImpactQuestion' | translate }}</label>
                  <select formControlName="inference_business_impact" class="w-full gp-select">
                    @for (opt of businessImpactOptions; track opt.value) {
                      <option [value]="opt.value">{{ opt.labelKey | translate }}</option>
                    }
                  </select>
                </div>
              </div>
            </div>

            <!-- Inferred result (no model ID) -->
            <div class="rounded-2xl border p-4" style="border-color: var(--border); background: color-mix(in srgb, var(--accent) 4%, var(--surface-card))">
              <p class="text-xs font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'submissions.infResultTitle' | translate }}</p>
              <p class="text-[11px] mt-0.5" style="color: var(--muted)">{{ 'submissions.infResultHint' | translate }}</p>
              <div class="mt-3 grid gap-3 sm:grid-cols-2">
                <div class="rounded-xl border px-3 py-2" style="border-color: var(--border); background: var(--surface-card)">
                  <p class="text-[10px] uppercase tracking-wider font-semibold" style="color: var(--muted)">{{ 'submissions.urgency' | translate }}</p>
                  <p class="text-lg font-bold" style="color: var(--on-surface)">{{ inferredPriority().urgency }}/5</p>
                </div>
                <div class="rounded-xl border px-3 py-2" style="border-color: var(--border); background: var(--surface-card)">
                  <p class="text-[10px] uppercase tracking-wider font-semibold" style="color: var(--muted)">{{ 'submissions.importance' | translate }}</p>
                  <p class="text-lg font-bold" style="color: var(--on-surface)">{{ inferredPriority().importance }}/5</p>
                </div>
              </div>
            </div>

            <!-- Attachments -->
            <div>
              <label class="block text-sm font-medium mb-3" style="color: var(--on-surface)">{{ 'submissions.attachments' | translate }}</label>
              <div
                class="relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors cursor-pointer hover:border-solid"
                style="border-color: var(--border); background: var(--surface)"
                (click)="fileInput.click()"
                (dragover)="onDragOver($event)"
                (drop)="onDrop($event)"
                (dragleave)="onDragLeave($event)"
                [class.drag-over]="isDragging()">
                <input #fileInput type="file" class="hidden" multiple
                  accept="image/png,image/jpeg,image/gif,application/pdf,.doc,.docx"
                  (change)="onFilesSelected($event)" />
                <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                  style="background: color-mix(in srgb, var(--accent) 10%, transparent)">
                  <svg class="h-6 w-6" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"/>
                  </svg>
                </div>
                <p class="text-sm font-medium" style="color: var(--on-surface)">{{ 'submissions.attachmentsHint' | translate }}</p>
                <p class="mt-1 text-[11px]" style="color: var(--muted)">{{ 'submissions.attachmentsFormats' | translate }}</p>
              </div>

              @if (attachments().length > 0) {
                <div class="mt-3 flex flex-wrap gap-2">
                  @for (file of attachments(); track file.id) {
                    <div class="inline-flex items-center gap-2 rounded-xl border px-3 py-1.5"
                      style="background: var(--surface-alt); border-color: var(--border)">
                      @if (file.type.startsWith('image/')) {
                        <img [src]="file.data" [alt]="file.name" loading="lazy" class="h-8 w-8 rounded-lg object-cover" />
                      } @else {
                        <div class="flex h-8 w-8 items-center justify-center rounded-lg text-[10px] font-bold"
                          style="background: color-mix(in srgb, var(--primary-light) 10%, transparent); color: var(--primary-light)">
                          {{ file.name.split('.').pop()?.toUpperCase() }}
                        </div>
                      }
                      <div class="min-w-0">
                        <div class="text-xs font-medium truncate max-w-[120px]" style="color: var(--on-surface)">{{ file.name }}</div>
                        <div class="text-[10px]" style="color: var(--muted)">{{ formatSize(file.size) }}</div>
                      </div>
                      <button type="button" (click)="removeAttachment(file.id)"
                        class="shrink-0 rounded-lg p-1 transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        style="color: var(--muted)"
                        [attr.aria-label]="'common.delete' | translate">
                        <svg class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                          <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  }
                </div>
              }
              @if (attachments().length === 0) {
                <p class="mt-2 text-[11px]" style="color: var(--muted)">{{ 'submissions.attachmentsOptionalHint' | translate }}</p>
              }
            </div>
          </div>
        }

        <!-- STEP 4: Review & Submit -->
        @if (step() === 4) {
          <div class="p-6 lg:p-8 space-y-5 animate-slide-in">
            <div>
              <h2 class="text-lg font-bold" style="color: var(--on-surface)">{{ 'submissions.reviewTitle' | translate }}</h2>
              <p class="mt-1 text-sm" style="color: var(--muted)">{{ 'submissions.reviewHint' | translate }}</p>
            </div>

            <div class="rounded-2xl border overflow-hidden" style="border-color: var(--border)">
              <div class="h-1.5" [style.background]="typeColor()"></div>

              <div class="p-5 space-y-4">
                <div class="flex items-center gap-4 flex-wrap">
                  <div>
                    <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.reviewType' | translate }}</div>
                    <span class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-bold"
                      [style.background]="'color-mix(in srgb, ' + typeColor() + ' 10%, transparent)'"
                      [style.color]="typeColor()">
                      {{ ('types.' + currentType()) | translate }}
                    </span>
                  </div>
                  @if (form.get('affected_module')?.value) {
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.reviewModule' | translate }}</div>
                      <span class="text-xs font-medium" style="color: var(--on-surface)">{{ moduleStore.getLabel(form.get('affected_module')?.value) }}</span>
                    </div>
                  }
                  <div>
                    <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.reviewUrgency' | translate }}</div>
                    <span class="text-xs font-bold" [style.color]="urgencyColor()">{{ urgencyLabel() }}</span>
                  </div>
                  <div>
                    <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.reviewImpact' | translate }}</div>
                    <span class="text-xs font-bold" [style.color]="impactColor()">{{ impactLabel() }}</span>
                  </div>
                  <button type="button" (click)="goToStep(1)"
                    class="ml-auto text-[11px] font-semibold transition-colors hover:opacity-80" style="color: var(--accent)">
                    {{ 'submissions.editStep' | translate }}
                  </button>
                </div>

                @if (selectedCountries().length > 0) {
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-[10px] font-semibold uppercase tracking-wider" style="color: var(--muted)">{{ 'submissions.reviewCountries' | translate }}</span>
                    @for (code of selectedCountries(); track code) {
                      <span class="inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs font-medium"
                        style="background: color-mix(in srgb, var(--accent) 8%, var(--surface-alt)); color: var(--on-surface)">
                        {{ getCountryFlag(code) }} {{ getCountryName(code) }}
                      </span>
                    }
                  </div>
                }

                <div class="border-t" style="border-color: var(--border)"></div>

                <div>
                  <div class="flex items-start justify-between gap-3">
                    <h3 class="text-base font-bold" style="color: var(--on-surface)">{{ form.get('title')?.value }}</h3>
                    <button type="button" (click)="goToStep(2)"
                      class="shrink-0 text-[11px] font-semibold transition-colors hover:opacity-80" style="color: var(--accent)">
                      {{ 'submissions.editStep' | translate }}
                    </button>
                  </div>
                  <p class="mt-2 text-sm leading-relaxed whitespace-pre-line" style="color: var(--muted)">{{ form.get('description')?.value }}</p>
                </div>

                @if (currentType() === 'incidencia') {
                  @if (form.get('steps_to_reproduce')?.value) {
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--magenta)">{{ 'submissions.stepsToReproduce' | translate }}</div>
                      <p class="text-sm whitespace-pre-line" style="color: var(--on-surface)">{{ form.get('steps_to_reproduce')?.value }}</p>
                    </div>
                  }
                  <div class="grid gap-3 sm:grid-cols-2">
                    @if (form.get('expected_behavior')?.value) {
                      <div>
                        <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.expectedBehavior' | translate }}</div>
                        <p class="text-sm" style="color: var(--on-surface)">{{ form.get('expected_behavior')?.value }}</p>
                      </div>
                    }
                    @if (form.get('actual_behavior')?.value) {
                      <div>
                        <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.actualBehavior' | translate }}</div>
                        <p class="text-sm" style="color: var(--on-surface)">{{ form.get('actual_behavior')?.value }}</p>
                      </div>
                    }
                  </div>
                }

                @if (currentType() === 'mejora' || currentType() === 'proyecto') {
                  @if (form.get('business_justification')?.value) {
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.businessJustification' | translate }}</div>
                      <p class="text-sm" style="color: var(--on-surface)">{{ form.get('business_justification')?.value }}</p>
                    </div>
                  }
                  @if (form.get('expected_benefit')?.value) {
                    <div>
                      <div class="text-[10px] font-semibold uppercase tracking-wider mb-1" style="color: var(--muted)">{{ 'submissions.expectedBenefit' | translate }}</div>
                      <p class="text-sm" style="color: var(--on-surface)">{{ form.get('expected_benefit')?.value }}</p>
                    </div>
                  }
                }

                @if (attachments().length > 0) {
                  <div>
                    <div class="text-[10px] font-semibold uppercase tracking-wider mb-2" style="color: var(--muted)">
                      {{ 'submissions.reviewAttachments' | translate }} ({{ attachments().length }} {{ 'submissions.reviewFiles' | translate }})
                    </div>
                    <div class="flex flex-wrap gap-2">
                      @for (file of attachments(); track file.id) {
                        @if (file.type.startsWith('image/')) {
                          <img [src]="file.data" [alt]="file.name" loading="lazy" class="h-16 w-16 rounded-xl object-cover border" style="border-color: var(--border)" />
                        } @else {
                          <div class="flex h-16 w-16 items-center justify-center rounded-xl border text-[10px] font-bold"
                            style="background: var(--surface-alt); border-color: var(--border); color: var(--primary-light)">
                            {{ file.name.split('.').pop()?.toUpperCase() }}
                          </div>
                        }
                      }
                    </div>
                  </div>
                }

                <!-- Warning: no attachments -->
                @if (attachments().length === 0 && currentType() === 'incidencia') {
                  <div class="flex items-start gap-2 rounded-xl border px-3 py-2"
                       style="border-color: color-mix(in srgb, var(--orange) 30%, var(--border)); background: color-mix(in srgb, var(--orange) 5%, transparent)">
                    <svg class="h-3.5 w-3.5 mt-0.5 shrink-0" style="color: var(--orange)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                      <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z"/>
                    </svg>
                    <p class="text-[11px]" style="color: var(--orange)">{{ 'submissions.reviewNoAttachmentsWarning' | translate }}</p>
                  </div>
                }
              </div>
            </div>
          </div>
        }

        <!-- Navigation footer -->
        <div class="flex items-center justify-between border-t px-6 py-4 lg:px-8"
          style="border-color: var(--border); background: var(--surface-alt)">
          <div>
            @if (step() > 1) {
              <button type="button" (click)="prevStep()"
                class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                style="color: var(--on-surface)">
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
                </svg>
                {{ 'submissions.previous' | translate }}
              </button>
            } @else {
              <a routerLink="/submissions/list"
                class="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
                style="color: var(--muted)">
                {{ 'common.cancel' | translate }}
              </a>
            }
          </div>

          <div>
            @if (step() < 4) {
              <button type="button" (click)="nextStep()"
                [disabled]="!isCurrentStepValid()"
                class="inline-flex items-center gap-1.5 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                style="background: var(--primary)">
                {{ 'submissions.next' | translate }}
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
                </svg>
              </button>
            } @else {
              <button type="submit"
                [disabled]="form.invalid || submissions.loading()"
                class="inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                style="background: var(--accent)">
                @if (submissions.loading()) {
                  <app-loading-spinner [size]="18" mode="inline" />
                  {{ 'submissions.submitting' | translate }}
                } @else {
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
                  </svg>
                  {{ 'submissions.submit' | translate }}
                }
              </button>
            }
          </div>
        </div>
      </form>
      }
    </div>
  `,
})
export class SubmissionFormComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private i18n = inject(I18nService);
  private priorityInference = inject(PriorityInferenceService);
  submissions = inject(SubmissionsService);
  countryStore = inject(CountryStore);
  moduleStore = inject(AffectedModuleStore);

  step = signal<WizardStep>(1);
  submitted = signal(false);
  createdInternalId = signal<string | null>(null);
  attachments = signal<Attachment[]>([]);
  selectedCountries = signal<string[]>([]);
  isDragging = signal(false);
  hasDraft = signal(false);
  private draftSub?: Subscription;

  form: FormGroup;

  steps = SUBMISSION_STEPS;
  urgencyOptions = URGENCY_OPTIONS;
  impactOptions = IMPACT_OPTIONS;
  readonly timeCriticalityOptions = TIME_CRITICALITY_OPTIONS;
  readonly operationalDisruptionOptions = OPERATIONAL_DISRUPTION_OPTIONS;
  readonly userReachOptions = USER_REACH_OPTIONS;
  readonly businessImpactOptions = BUSINESS_IMPACT_OPTIONS;

  readonly descriptionLength = computed(() => (this.form?.get('description')?.value?.length ?? 0) as number);

  readonly inferredPriority = computed(() => {
    const answers = this.currentInferenceAnswers();
    return this.priorityInference.infer(answers);
  });

  constructor() {
    this.form = this.fb.nonNullable.group({
      type: ['incidencia' as RequestType, Validators.required],
      title: ['', [Validators.required, Validators.minLength(5)]],
      description: ['', [Validators.required, Validators.minLength(20)]],
      affected_module: [''],
      steps_to_reproduce: [''],
      expected_behavior: [''],
      actual_behavior: [''],
      affected_url: [''],
      business_justification: [''],
      expected_benefit: [''],
      impacted_users: [''],
      inference_time_criticality: ['this_week' as TimeCriticalityKey, Validators.required],
      inference_operational_disruption: ['degraded' as OperationalDisruptionKey, Validators.required],
      inference_user_reach: ['single_team' as UserReachKey, Validators.required],
      inference_business_impact: ['important_moderate_risk' as BusinessImpactKey, Validators.required],
      urgency: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      importance: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      complexity: [1],
    });

    this.syncInferredPriority();
    this.restoreDraft();
    this.syncInferredPriority();
    this.updateTypeSpecificValidators(this.currentType());
    this.setupDraftAutosave();
    const typeChanges = this.form.get('type')?.valueChanges.subscribe((type) => {
      this.updateTypeSpecificValidators(type as RequestType);
      this.saveDraft();
    });
    if (typeChanges) this.draftSub?.add(typeChanges);
    this.draftSub?.add(this.form.valueChanges.subscribe(() => this.syncInferredPriority()));
  }

  currentType(): RequestType {
    return this.form.get('type')?.value as RequestType;
  }

  selectType(type: RequestType): void {
    this.form.get('type')?.setValue(type);
    this.saveDraft();
  }

  nextStep(): void {
    if (!this.isCurrentStepValid()) return;
    this.markCurrentStepTouched();
    const next = Math.min(this.step() + 1, 4) as WizardStep;
    this.step.set(next);
    this.saveDraft();
  }

  prevStep(): void {
    const prev = Math.max(this.step() - 1, 1) as WizardStep;
    this.step.set(prev);
    this.saveDraft();
  }

  goToStep(s: WizardStep): void {
    this.step.set(s);
    this.saveDraft();
  }

  canGoToStep(target: WizardStep): boolean {
    return target <= this.step();
  }

  isCurrentStepValid(): boolean {
    const s = this.step();
    if (s === 1) return !!this.form.get('type')?.valid;
    if (s === 2) {
      const title = this.form.get('title');
      const desc = this.form.get('description');
      const type = this.currentType();
      const steps = this.form.get('steps_to_reproduce');
      const business = this.form.get('business_justification');
      const typeValid =
        type === 'incidencia'
          ? !!steps?.valid
          : type === 'mejora' || type === 'proyecto'
            ? !!business?.valid
            : true;
      const countriesValid = this.selectedCountries().length > 0;
      return !!title?.valid && !!desc?.valid && typeValid && countriesValid;
    }
    if (s === 3) {
      return (
        !!this.form.get('inference_time_criticality')?.valid &&
        !!this.form.get('inference_operational_disruption')?.valid &&
        !!this.form.get('inference_user_reach')?.valid &&
        !!this.form.get('inference_business_impact')?.valid &&
        !!this.form.get('urgency')?.valid &&
        !!this.form.get('importance')?.valid
      );
    }
    return this.form.valid;
  }

  private markCurrentStepTouched(): void {
    const s = this.step();
    if (s === 2) {
      this.form.get('title')?.markAsTouched();
      this.form.get('description')?.markAsTouched();
      const type = this.currentType();
      if (type === 'incidencia') this.form.get('steps_to_reproduce')?.markAsTouched();
      if (type === 'mejora' || type === 'proyecto') this.form.get('business_justification')?.markAsTouched();
    }
  }

  typeColor(): string {
    const t = this.currentType();
    if (t === 'incidencia') return 'var(--magenta)';
    if (t === 'mejora') return 'var(--primary-light)';
    return 'var(--lime)';
  }

  urgencyColor(): string {
    const v = this.form.get('urgency')?.value;
    if (v === 2) return 'var(--cool-gray)';
    const opt = this.urgencyOptions.find(u => u.value === v);
    return opt?.color ?? 'var(--muted)';
  }

  urgencyLabel(): string {
    const v = this.form.get('urgency')?.value;
    if (v === 2 || v === 1) return this.i18n.t('submissions.urgencyLow');
    const opt = this.urgencyOptions.find(u => u.value === v);
    return opt ? this.i18n.t(opt.labelKey) : '';
  }

  impactColor(): string {
    const v = this.form.get('importance')?.value;
    if (v === 4) return 'var(--magenta)';
    if (v === 2) return 'var(--cool-gray)';
    const opt = this.impactOptions.find(i => i.value === v);
    return opt?.color ?? 'var(--muted)';
  }

  impactLabel(): string {
    const v = this.form.get('importance')?.value;
    if (v === 4 || v === 5) return this.i18n.t('submissions.impactHigh');
    if (v === 2 || v === 1) return this.i18n.t('submissions.impactLow');
    const opt = this.impactOptions.find(i => i.value === v);
    return opt ? this.i18n.t(opt.labelKey) : '';
  }

  toggleCountry(code: string): void {
    this.selectedCountries.update((list) =>
      list.includes(code) ? list.filter((c) => c !== code) : [...list, code]
    );
    this.saveDraft();
  }

  isCountrySelected(code: string): boolean {
    return this.selectedCountries().includes(code);
  }

  getCountryFlag(code: string): string {
    return this.countryStore.getByCode(code)?.flag ?? code;
  }

  getCountryName(code: string): string {
    return this.countryStore.getByCode(code)?.name ?? code;
  }

  onDragOver(event: DragEvent): void { event.preventDefault(); this.isDragging.set(true); }
  onDragLeave(event: DragEvent): void { event.preventDefault(); this.isDragging.set(false); }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    const files = event.dataTransfer?.files;
    if (files) this.processFiles(files);
  }

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) this.processFiles(input.files);
    input.value = '';
  }

  private processFiles(files: FileList): void {
    const maxSize = 5 * 1024 * 1024;
    Array.from(files).forEach((file) => {
      if (file.size > maxSize) return;
      const reader = new FileReader();
      reader.onload = () => {
        const attachment: Attachment = {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          name: file.name, type: file.type, data: reader.result as string, size: file.size,
        };
        this.attachments.update((list) => [...list, attachment]);
        this.saveDraft();
      };
      reader.readAsDataURL(file);
    });
  }

  removeAttachment(id: string): void {
    this.attachments.update((list) => list.filter((a) => a.id !== id));
    this.saveDraft();
  }

  formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async onSubmit(): Promise<void> {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const inference = this.inferredPriority();
    const payload: CreateRequestPayload = {
      type: v.type, title: v.title, description: v.description,
      urgency: Number(v.urgency), importance: Number(v.importance), complexity: Number(v.complexity),
      affected_module: v.affected_module || undefined,
      steps_to_reproduce: v.steps_to_reproduce || undefined,
      expected_behavior: v.expected_behavior || undefined,
      actual_behavior: v.actual_behavior || undefined,
      affected_url: v.affected_url || undefined,
      business_justification: v.business_justification || undefined,
      expected_benefit: v.expected_benefit || undefined,
      impacted_users: v.impacted_users || undefined,
      attachments: this.attachments().length > 0 ? this.attachments() : undefined,
      countries: this.selectedCountries().length > 0 ? this.selectedCountries() : undefined,
      priority_inference: {
        modelVersion: 'itil-wsjf-lite-v2',
        urgencyScore: inference.urgencyScore,
        importanceScore: inference.importanceScore,
        answers: {
          timeCriticality: v.inference_time_criticality,
          operationalDisruption: v.inference_operational_disruption,
          userReach: v.inference_user_reach,
          businessImpact: v.inference_business_impact,
        },
      },
    };
    const created = await this.submissions.addRequest(payload);
    if (!created) return;
    this.createdInternalId.set(created.internal_id);
    this.submitted.set(true);
    this.clearDraft();
  }

  ngOnDestroy(): void { this.draftSub?.unsubscribe(); }

  private updateTypeSpecificValidators(type: RequestType): void {
    const steps = this.form.get('steps_to_reproduce');
    const business = this.form.get('business_justification');
    if (!steps || !business) return;
    steps.clearValidators();
    business.clearValidators();
    if (type === 'incidencia') steps.setValidators([Validators.required, Validators.minLength(8)]);
    if (type === 'mejora' || type === 'proyecto') business.setValidators([Validators.required, Validators.minLength(8)]);
    steps.updateValueAndValidity({ emitEvent: false });
    business.updateValueAndValidity({ emitEvent: false });
  }

  private setupDraftAutosave(): void {
    this.draftSub = new Subscription();
    this.draftSub.add(this.form.valueChanges.subscribe(() => this.saveDraft()));
  }

  private saveDraft(): void {
    if (this.submitted()) return;
    const payload = {
      step: this.step(),
      form: this.form.getRawValue(),
      attachments: this.attachments(),
      selectedCountries: this.selectedCountries(),
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
      this.hasDraft.set(true);
    } catch { /* ignore */ }
  }

  private restoreDraft(): void {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        step?: WizardStep; form?: Record<string, unknown>;
        attachments?: Attachment[]; selectedCountries?: string[];
      };
      if (parsed.form) this.form.patchValue(parsed.form);
      if (parsed.attachments && Array.isArray(parsed.attachments)) this.attachments.set(parsed.attachments);
      if (parsed.selectedCountries && Array.isArray(parsed.selectedCountries)) this.selectedCountries.set(parsed.selectedCountries);
      if (parsed.step && [1, 2, 3, 4].includes(parsed.step)) this.step.set(parsed.step);
      this.hasDraft.set(true);
    } catch { /* ignore */ }
  }

  private clearDraft(): void {
    try { localStorage.removeItem(DRAFT_KEY); this.hasDraft.set(false); } catch { /* ignore */ }
  }

  private currentInferenceAnswers(): PriorityInferenceAnswers {
    const v = this.form.getRawValue();
    return {
      timeCriticality: v.inference_time_criticality as TimeCriticalityKey,
      operationalDisruption: v.inference_operational_disruption as OperationalDisruptionKey,
      userReach: v.inference_user_reach as UserReachKey,
      businessImpact: v.inference_business_impact as BusinessImpactKey,
    };
  }

  private syncInferredPriority(): void {
    const inference = this.priorityInference.infer(this.currentInferenceAnswers());
    this.form.patchValue({ urgency: inference.urgency, importance: inference.importance }, { emitEvent: false });
  }
}

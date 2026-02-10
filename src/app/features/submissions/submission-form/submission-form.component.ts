import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import type { RequestType } from '../../../shared/models/request.model';
import { SubmissionsService } from '../submissions.service';
import type { CreateRequestPayload } from '../../../shared/models/request.model';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-submission-form',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, LoadingSpinnerComponent, TranslatePipe],
  template: `
    <div class="mx-auto max-w-2xl space-y-6 p-4 lg:p-6">
      <div class="flex items-center gap-4">
        <a routerLink="/submissions/list" class="text-sm transition-colors hover:opacity-80" style="color:var(--accent)">
          ← {{ 'submissions.backToList' | translate }}
        </a>
      </div>
      <h1 class="text-2xl font-bold tracking-tight" style="color:var(--on-surface)">{{ 'submissions.formTitle' | translate }}</h1>

      <form [formGroup]="form" (ngSubmit)="onSubmit()"
            class="space-y-6 rounded-xl border p-6"
            style="background:var(--surface);border-color:var(--border)">

        <!-- Type -->
        <div>
          <label for="type" class="block text-sm font-medium" style="color:var(--on-surface)">{{ 'submissions.type' | translate }}</label>
          <select id="type" formControlName="type"
            class="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-accent/50 focus:border-accent"
            style="background:var(--surface);border-color:var(--border);color:var(--on-surface)">
            <option value="incidencia">{{ 'submissions.typeIncidencia' | translate }}</option>
            <option value="mejora">{{ 'submissions.typeMejora' | translate }}</option>
            <option value="proyecto">{{ 'submissions.typeProyecto' | translate }}</option>
          </select>
        </div>

        <!-- Title -->
        <div>
          <label for="title" class="block text-sm font-medium" style="color:var(--on-surface)">{{ 'submissions.requestTitle' | translate }}</label>
          <input id="title" type="text" formControlName="title"
            class="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-accent/50 focus:border-accent"
            style="background:var(--surface);border-color:var(--border);color:var(--on-surface)"
            [placeholder]="'submissions.requestTitlePlaceholder' | translate" />
          @if (form.get('title')?.invalid && form.get('title')?.touched) {
            <p class="mt-1 text-sm text-red-500">{{ 'submissions.titleRequired' | translate }}</p>
          }
        </div>

        <!-- Description -->
        <div>
          <label for="description" class="block text-sm font-medium" style="color:var(--on-surface)">{{ 'submissions.description' | translate }}</label>
          <textarea id="description" formControlName="description" rows="4"
            class="mt-1 block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-accent/50 focus:border-accent"
            style="background:var(--surface);border-color:var(--border);color:var(--on-surface)"
            [placeholder]="'submissions.descriptionPlaceholder' | translate">
          </textarea>
          @if (form.get('description')?.invalid && form.get('description')?.touched) {
            <p class="mt-1 text-sm text-red-500">{{ 'submissions.descriptionRequired' | translate }}</p>
          }
        </div>

        <!-- Sliders: urgency, importance, complexity -->
        <div class="grid gap-6 sm:grid-cols-3">
          <div>
            <label for="urgency" class="flex items-center justify-between text-sm font-medium" style="color:var(--on-surface)">
              <span>{{ 'submissions.urgency' | translate }}</span>
              <span class="rounded-md px-2 py-0.5 text-xs font-bold tabular-nums" style="background:var(--surface-alt);color:var(--accent)">{{ form.get('urgency')?.value }}</span>
            </label>
            <input id="urgency" type="range" formControlName="urgency" min="1" max="5" step="1"
              class="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg accent-accent"
              style="background:var(--border)" />
            <div class="mt-1 flex justify-between text-[10px]" style="color:var(--muted)">
              <span>1</span><span>5</span>
            </div>
          </div>
          <div>
            <label for="importance" class="flex items-center justify-between text-sm font-medium" style="color:var(--on-surface)">
              <span>{{ 'submissions.importance' | translate }}</span>
              <span class="rounded-md px-2 py-0.5 text-xs font-bold tabular-nums" style="background:var(--surface-alt);color:var(--accent)">{{ form.get('importance')?.value }}</span>
            </label>
            <input id="importance" type="range" formControlName="importance" min="1" max="5" step="1"
              class="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg accent-accent"
              style="background:var(--border)" />
            <div class="mt-1 flex justify-between text-[10px]" style="color:var(--muted)">
              <span>1</span><span>5</span>
            </div>
          </div>
          <div>
            <label for="complexity" class="flex items-center justify-between text-sm font-medium" style="color:var(--on-surface)">
              <span>{{ 'submissions.complexity' | translate }}</span>
              <span class="rounded-md px-2 py-0.5 text-xs font-bold tabular-nums" style="background:var(--surface-alt);color:var(--accent)">{{ form.get('complexity')?.value }}</span>
            </label>
            <input id="complexity" type="range" formControlName="complexity" min="1" max="5" step="1"
              class="mt-2 h-2 w-full cursor-pointer appearance-none rounded-lg accent-accent"
              style="background:var(--border)" />
            <div class="mt-1 flex justify-between text-[10px]" style="color:var(--muted)">
              <span>1</span><span>5</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex gap-3">
          <button type="submit" [disabled]="form.invalid || submissions.loading()"
            class="rounded-xl bg-accent px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover disabled:opacity-50">
            @if (submissions.loading()) {
              <app-loading-spinner [size]="20" mode="inline" />
            } @else {
              {{ 'submissions.submit' | translate }}
            }
          </button>
          <a routerLink="/submissions/list"
            class="rounded-xl border px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-80"
            style="border-color:var(--border);color:var(--on-surface)">
            {{ 'common.cancel' | translate }}
          </a>
        </div>
      </form>
    </div>
  `,
})
export class SubmissionFormComponent {
  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    public submissions: SubmissionsService
  ) {
    this.form = this.fb.nonNullable.group({
      type: ['incidencia' as RequestType, Validators.required],
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]],
      urgency: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      importance: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
      complexity: [3, [Validators.required, Validators.min(1), Validators.max(5)]],
    });
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    const payload: CreateRequestPayload = {
      type: v.type,
      title: v.title,
      description: v.description,
      urgency: Number(v.urgency),
      importance: Number(v.importance),
      complexity: Number(v.complexity),
    };
    this.submissions.addRequest(payload);
    this.form.reset({
      type: 'incidencia',
      title: '',
      description: '',
      urgency: 3,
      importance: 3,
      complexity: 3,
    });
  }
}

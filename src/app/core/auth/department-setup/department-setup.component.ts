import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../auth.service';
import { DepartmentStore } from '../../services/department-store.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-department-setup',
  standalone: true,
  imports: [FormsModule, TranslatePipe],
  template: `
    <div class="dept-shell">
      <div class="dept-card animate-scale-in">
        <!-- Icon -->
        <div class="dept-icon-wrap">
          <svg class="h-8 w-8" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21"/>
          </svg>
        </div>

        <h1 class="dept-title">{{ 'departmentSetup.title' | translate }}</h1>
        <p class="dept-subtitle">{{ 'departmentSetup.subtitle' | translate }}</p>
        <p class="dept-note">
          {{ 'departmentSetup.teamAssignmentNote' | translate }}
        </p>

        <!-- Department options -->
        <div class="dept-grid">
          @if (departments().length === 0) {
            <div class="col-span-2 py-8 text-center" style="grid-column: 1 / -1">
              <p class="text-sm" style="color: var(--muted)">{{ 'common.empty' | translate }}</p>
            </div>
          } @else {
          @for (dept of departments(); track dept) {
            <button
              (click)="selected = dept"
              class="dept-option"
              [class.dept-option--selected]="selected === dept">
              <span class="dept-option-text">{{ dept }}</span>
              @if (selected === dept) {
                <div class="dept-check">
                  <svg class="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M4.5 12.75l6 6 9-13.5"/>
                  </svg>
                </div>
              }
            </button>
          }
          }
        </div>

        <!-- Custom input -->
        <div class="dept-custom">
          <input
            type="text"
            [(ngModel)]="customDept"
            [placeholder]="'departmentSetup.customPlaceholder' | translate"
            class="dept-custom-input"
            (keyup.enter)="selectCustom()"
          />
          @if (customDept.trim()) {
            <button (click)="selectCustom()" class="dept-custom-btn">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
              </svg>
            </button>
          }
        </div>

        <!-- Confirm -->
        <button
          (click)="confirm()"
          [disabled]="!selected"
          class="dept-confirm"
          [class.dept-confirm--active]="!!selected">
          {{ 'departmentSetup.confirm' | translate }}
        </button>
      </div>
    </div>
  `,
  styles: [`
    .dept-shell {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      min-height: 100dvh;
      padding: 1.5rem;
      background: var(--surface-alt);
    }
    .dept-card {
      width: 100%;
      max-width: 480px;
      background: var(--surface-card);
      border: 1px solid var(--border);
      border-radius: 1.25rem;
      padding: 2.5rem 2rem;
      text-align: center;
      box-shadow:
        0 4px 16px color-mix(in srgb, var(--on-surface) 4%, transparent),
        0 1px 3px color-mix(in srgb, var(--on-surface) 3%, transparent);
    }
    .dept-icon-wrap {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      margin: 0 auto 1.25rem;
      border-radius: 1rem;
      background: color-mix(in srgb, var(--accent) 12%, transparent);
    }
    .dept-title {
      font-size: 1.25rem;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: var(--on-surface);
      margin-bottom: 0.25rem;
    }
    .dept-subtitle {
      font-size: 0.8125rem;
      color: var(--muted);
      margin-bottom: 0.5rem;
    }
    .dept-note {
      margin: 0 auto 1.5rem;
      max-width: 34ch;
      font-size: 0.75rem;
      color: color-mix(in srgb, var(--muted) 85%, var(--on-surface));
    }
    .dept-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    @media (max-width: 400px) {
      .dept-grid { grid-template-columns: 1fr; }
    }

    .dept-option {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      padding: 0.625rem 0.875rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: transparent;
      text-align: left;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .dept-option:hover {
      border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
      background: color-mix(in srgb, var(--accent) 3%, transparent);
    }
    .dept-option--selected {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 6%, transparent);
      box-shadow: 0 0 0 3px var(--ring);
    }
    .dept-option-text {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--on-surface);
    }
    .dept-check {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
    }

    .dept-custom {
      position: relative;
      margin-bottom: 1.25rem;
    }
    .dept-custom-input {
      width: 100%;
      padding: 0.5rem 2.5rem 0.5rem 0.875rem;
      border-radius: 0.75rem;
      border: 1px solid var(--border);
      background: var(--surface-card);
      color: var(--on-surface);
      font-size: 0.8125rem;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .dept-custom-input::placeholder { color: var(--muted); }
    .dept-custom-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--ring);
    }
    .dept-custom-btn {
      position: absolute;
      right: 0.5rem;
      top: 50%;
      transform: translateY(-50%);
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 0.5rem;
      color: var(--accent);
      transition: background 0.15s ease;
    }
    .dept-custom-btn:hover {
      background: color-mix(in srgb, var(--accent) 10%, transparent);
    }

    .dept-confirm {
      width: 100%;
      padding: 0.75rem;
      border-radius: 0.75rem;
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      background: var(--accent);
      opacity: 0.4;
      cursor: not-allowed;
      transition: all 0.2s ease;
    }
    .dept-confirm--active {
      opacity: 1;
      cursor: pointer;
    }
    .dept-confirm--active:hover {
      box-shadow: 0 4px 12px color-mix(in srgb, var(--accent) 30%, transparent);
    }
  `],
})
export class DepartmentSetupComponent {
  private auth = inject(AuthService);
  private deptStore = inject(DepartmentStore);
  private router = inject(Router);

  readonly departments = this.deptStore.all;
  selected: string | null = null;
  customDept = '';

  async selectCustom(): Promise<void> {
    const trimmed = this.customDept.trim();
    if (!trimmed) return;
    const ok = await this.deptStore.add(trimmed);
    if (!ok) return;
    this.selected = trimmed;
    this.customDept = '';
  }

  async confirm(): Promise<void> {
    if (!this.selected) return;
    try {
      await this.auth.setDepartment(this.selected);
      await this.router.navigate(['/dashboard']);
    } catch {
      // Keep user in setup screen when persistence fails.
    }
  }
}

import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubmissionsService } from '../submissions.service';
import { RequestCardComponent } from '../../../shared/components/request-card/request-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';
import { RequestDetailDialogComponent } from '../../../shared/components/request-detail-dialog/request-detail-dialog.component';
import { PrioritizationService } from '../../prioritization/prioritization.service';
import { AuthService } from '../../../core/auth/auth.service';
import type { Request } from '../../../shared/models/request.model';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [RouterLink, RequestCardComponent, LoadingSpinnerComponent, TranslatePipe, RequestDetailDialogComponent],
  template: `
    <div class="mx-auto max-w-4xl space-y-6 p-4 lg:p-6 animate-fade-in">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight" style="color: var(--on-surface)">
            {{ isTeamView() ? ('submissions.teamViewTitle' | translate) : ('submissions.title' | translate) }}
          </h1>
          @if (isTeamView()) {
            <p class="mt-1 text-sm" style="color: var(--muted)">
              {{ 'submissions.teamViewSubtitle' | translate }}
            </p>
          }
        </div>
        <a
          routerLink="/submissions/new"
          class="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
          style="background: var(--accent)"
        >
          <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4.5v15m7.5-7.5h-15"/>
          </svg>
          {{ 'submissions.new' | translate }}
        </a>
      </div>
      @if (submissions.loading()) {
        <app-loading-spinner />
      } @else {
        <div class="space-y-3">
          @for (req of submissions.myRequests(); track req.id) {
            <app-request-card [request]="req" (openDetail)="openRequest(req.id)" />
          }
          @if (submissions.myRequests().length === 0) {
            <div class="rounded-2xl border-2 border-dashed p-10 text-center" style="border-color: var(--border)">
              <div class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl"
                   style="background: color-mix(in srgb, var(--accent) 10%, transparent)">
                <svg class="h-6 w-6" style="color: var(--accent)" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m3.75 9v6m3-3H9m1.5-12H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                </svg>
              </div>
              <p class="text-sm" style="color: var(--muted)">{{ 'submissions.empty' | translate }}</p>
              <a routerLink="/submissions/new" class="mt-2 inline-block text-sm font-semibold" style="color: var(--accent)">
                {{ 'submissions.createOne' | translate }}
              </a>
            </div>
          }
        </div>
      }
    </div>

    @if (selectedRequest(); as req) {
      <app-request-detail-dialog
        [request]="req"
        (closeDialog)="selectedRequest.set(null)"
        (addComment)="onAddComment($event)"
      />
    }
  `,
})
export class MyRequestsComponent {
  private auth = inject(AuthService);
  selectedRequest = signal<Request | null>(null);
  readonly isTeamView = computed(() => this.auth.user()?.role === 'functional');

  constructor(
    public submissions: SubmissionsService,
    private prioritization: PrioritizationService
  ) {}

  openRequest(requestId: string): void {
    const req = this.submissions.myRequests().find((r) => r.id === requestId) ?? null;
    this.selectedRequest.set(req ? { ...req } : null);
  }

  onAddComment(event: { requestId: string; text: string }): void {
    this.prioritization.addComment(event.requestId, event.text);
    this.openRequest(event.requestId);
  }
}

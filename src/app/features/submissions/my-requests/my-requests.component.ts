import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SubmissionsService } from '../submissions.service';
import { RequestCardComponent } from '../../../shared/components/request-card/request-card.component';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  imports: [RouterLink, RequestCardComponent, LoadingSpinnerComponent, TranslatePipe],
  template: `
    <div class="mx-auto max-w-4xl space-y-6 p-4 lg:p-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold tracking-tight" style="color:var(--on-surface)">{{ 'submissions.title' | translate }}</h1>
        <a
          routerLink="/submissions/new"
          class="inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
        >
          {{ 'submissions.new' | translate }}
        </a>
      </div>
      @if (submissions.loading()) {
        <app-loading-spinner />
      } @else {
        <div class="space-y-3">
          @for (req of submissions.myRequests(); track req.id) {
            <app-request-card [request]="req" />
          }
          @if (submissions.myRequests().length === 0) {
            <div class="rounded-xl border-2 border-dashed p-8 text-center" style="border-color:var(--border)">
              <p style="color:var(--muted)">{{ 'submissions.empty' | translate }}</p>
              <a routerLink="/submissions/new" class="mt-2 inline-block text-sm font-medium" style="color:var(--accent)">
                {{ 'submissions.createOne' | translate }}
              </a>
            </div>
          }
        </div>
      }
    </div>
  `,
})
export class MyRequestsComponent {
  constructor(public submissions: SubmissionsService) {}
}

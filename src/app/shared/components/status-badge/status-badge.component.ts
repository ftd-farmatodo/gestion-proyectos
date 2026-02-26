import { Component, inject, input } from '@angular/core';
import type { RequestStatus } from '../../models/request.model';
import { StatusConfigStore } from '../../../core/services/status-config.service';
import { I18nService } from '../../../core/services/i18n.service';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [],
  template: `
    <span
      class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-0.5 text-[11px] font-medium"
      [style.background]="bgColor()"
      [style.color]="textColor()"
    >
      <span class="h-1.5 w-1.5 rounded-full" [style.background]="textColor()"></span>
      {{ label() }}
    </span>
  `,
})
export class StatusBadgeComponent {
  private statusConfig = inject(StatusConfigStore);
  private i18n = inject(I18nService);

  status = input.required<RequestStatus>();

  label(): string {
    return this.statusConfig.getLabel(this.status(), this.i18n.locale());
  }

  bgColor(): string {
    const cfg = this.statusConfig.getByKey(this.status());
    return cfg?.bgColor ?? 'color-mix(in srgb, var(--cool-gray) 12%, transparent)';
  }

  textColor(): string {
    const cfg = this.statusConfig.getByKey(this.status());
    return cfg?.color ?? 'var(--cool-gray)';
  }
}

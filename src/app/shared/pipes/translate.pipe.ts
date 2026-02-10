import { Pipe, PipeTransform, inject } from '@angular/core';
import { I18nService } from '../../core/services/i18n.service';

/** Impure pipe so it re-evaluates when the dict signal changes. */
@Pipe({ name: 'translate', standalone: true, pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: string): string {
    // Touch signal so Angular re-runs on locale change
    this.i18n.dict();
    return this.i18n.t(key);
  }
}

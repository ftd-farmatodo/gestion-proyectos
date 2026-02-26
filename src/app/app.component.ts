import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ConfirmDialogComponent } from './shared/components/confirm-dialog/confirm-dialog.component';
import { ThemeService } from './core/services/theme.service';
import { ActivityStoreService } from './core/services/activity-store.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ToastComponent, ConfirmDialogComponent],
  template: `
    @if (showSidebar()) {
      <app-header />
    }
    <!-- Main content: top padding for floating desktop nav, bottom padding for mobile pill -->
    <main
      class="min-h-screen transition-[padding] duration-300"
      [class.pt-[72px]]="showSidebar()"
      [class.pb-24]="showSidebar()"
      [class.lg:pb-0]="showSidebar()"
      style="background: var(--surface-alt)"
    >
      <router-outlet />
    </main>
    <app-toast />
    <app-confirm-dialog />
  `,
})
export class AppComponent {
  private router = inject(Router);
  private _theme = inject(ThemeService);
  private _activityStore = inject(ActivityStoreService);
  showSidebar = signal(!this.isFullscreenRoute(this.router.url));

  constructor() {
    void this._activityStore;
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.showSidebar.set(!this.isFullscreenRoute(this.router.url)));
  }

  private isFullscreenRoute(url: string): boolean {
    return url.includes('/login') || url.includes('/team-setup') || url.includes('/department-setup');
  }
}

import { Component, inject, signal } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { HeaderComponent } from './shared/components/header/header.component';
import { ToastComponent } from './shared/components/toast/toast.component';
import { ThemeService } from './core/services/theme.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, ToastComponent],
  template: `
    <div class="flex min-h-screen">
      @if (showSidebar()) {
        <app-header />
      }
      <main class="flex-1 overflow-y-auto" style="background:var(--surface-alt)">
        <router-outlet />
      </main>
    </div>
    <app-toast />
  `,
})
export class AppComponent {
  private router = inject(Router);
  private _theme = inject(ThemeService);
  showSidebar = signal(!this.router.url.includes('/login'));

  constructor() {
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.showSidebar.set(!this.router.url.includes('/login')));
  }
}

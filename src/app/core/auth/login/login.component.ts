import { Component, inject } from '@angular/core';
import { AuthService } from '../auth.service';
import { ThemeService } from '../../services/theme.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [TranslatePipe],
  template: `
    <div class="login-shell">

      <!-- ══════ ANIMATED ORB BACKGROUND ══════ -->
      <div class="orb-canvas">
        <div class="orb orb-1 animate-float-orb-1"></div>
        <div class="orb orb-2 animate-float-orb-2"></div>
        <div class="orb orb-3 animate-float-orb-3"></div>
      </div>

      <!-- ══════ SPLIT: BRAND PANEL (desktop only) ══════ -->
      <div class="brand-panel">
        <div class="brand-content">

          <!-- Logo -->
          <div class="animate-stagger-1">
            <div class="brand-logo">
              <img src="assets/icon_ftd.png" alt="Farmatodo" class="w-full h-full object-contain drop-shadow-2xl" />
            </div>
          </div>

          <!-- Hero text -->
          <div class="animate-stagger-2">
            <h1 class="brand-title">
              {{ 'login.title' | translate }}
            </h1>
          </div>

          <div class="animate-stagger-3">
            <p class="brand-tagline">
              Gestiona.<span class="brand-tagline-accent"> Prioriza.</span> Entrega.
            </p>
          </div>

          <!-- Flow Diagram -->
          <div class="brand-flow-diagram animate-stagger-5">
            <svg viewBox="0 0 400 100" class="flow-svg">
              <!-- Defs for gradients and filters -->
              <defs>
                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stop-color="var(--accent)" />
                  <stop offset="50%" stop-color="var(--primary-light)" />
                  <stop offset="100%" stop-color="var(--lime)" />
                </linearGradient>
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              <!-- Animated Connecting Line -->
              <path d="M 60 40 L 340 40" class="flow-line-bg" />
              <path d="M 60 40 L 340 40" class="flow-line-animated" />

              <!-- Step 1: Gestiona -->
              <g transform="translate(60, 40)" class="flow-node">
                <circle r="28" class="node-bg" style="fill: var(--surface)" />
                <circle r="28" class="node-border" style="stroke: var(--accent)" />
                <svg x="-12" y="-12" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--accent)" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"/>
                </svg>
                <text y="46" class="node-label">Solicitudes</text>
              </g>

              <!-- Step 2: Prioriza -->
              <g transform="translate(200, 40)" class="flow-node">
                <circle r="28" class="node-bg" style="fill: var(--surface)" />
                <circle r="28" class="node-border" style="stroke: var(--primary-light)" />
                <svg x="-12" y="-12" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--primary-light)" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"/>
                </svg>
                <text y="46" class="node-label">Priorización</text>
              </g>

              <!-- Step 3: Entrega -->
              <g transform="translate(340, 40)" class="flow-node">
                <circle r="28" class="node-bg" style="fill: var(--surface)" />
                <circle r="28" class="node-border" style="stroke: var(--lime)" />
                <svg x="-12" y="-12" width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="var(--lime)" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <text y="46" class="node-label">Resolución</text>
              </g>
            </svg>
          </div>

          <!-- Bottom brand accent line -->
          <div class="animate-stagger-6">
            <div class="brand-accent-line"></div>
          </div>
        </div>
      </div>

      <!-- ══════ LOGIN FORM PANEL ══════ -->
      <div class="form-panel">
        <div class="form-card">

          <!-- Theme toggle (top-right) -->
          <button (click)="theme.toggle()"
                  class="form-theme-toggle animate-stagger-1"
                  [title]="'header.theme' | translate"
                  [attr.aria-label]="'header.theme' | translate">
            @if (theme.isDark()) {
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"/>
              </svg>
            } @else {
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/>
              </svg>
            }
          </button>

          <!-- Logo (mobile + form) -->
          <div class="animate-stagger-1">
            <div class="form-logo">
              <img src="assets/icon_ftd.png" alt="Farmatodo" class="w-full h-full object-contain drop-shadow-xl" />
            </div>
          </div>

          <!-- Title -->
          <h2 class="form-title animate-stagger-2">
            {{ 'login.title' | translate }}
          </h2>
          <p class="form-subtitle animate-stagger-2">
            {{ 'login.subtitle' | translate }}
          </p>

          <!-- Google Login -->
          <button
            (click)="auth.loginWithGoogle()"
            class="google-btn animate-stagger-3">
            <div class="google-btn-inner">
              <svg class="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span>{{ 'login.google' | translate }}</span>
            </div>
            <div class="google-btn-shimmer"></div>
          </button>

        </div>
      </div>
    </div>
  `,
  styles: [`
    /* ─── Shell: full viewport split ─── */
    .login-shell {
      display: flex;
      min-height: 100vh;
      min-height: 100dvh;
      overflow: hidden;
      background: var(--surface);
    }

    /* ─── Animated orb canvas ─── */
    .orb-canvas {
      position: fixed;
      inset: 0;
      pointer-events: none;
      z-index: 0;
      overflow: hidden;
    }
    .orb {
      position: absolute;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.35;
    }
    :host-context(.dark) .orb { opacity: 0.2; }

    .orb-1 {
      width: 420px; height: 420px;
      top: -10%; left: 10%;
      background: var(--accent);
    }
    .orb-2 {
      width: 360px; height: 360px;
      bottom: -5%; right: 15%;
      background: var(--primary-light);
    }
    .orb-3 {
      width: 300px; height: 300px;
      top: 40%; left: 45%;
      background: var(--purple);
    }

    /* ─── Brand panel (left, desktop only) ─── */
    .brand-panel {
      display: none;
      position: relative;
      z-index: 1;
    }
    @media (min-width: 1024px) {
      .brand-panel {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1 1 50%;
        padding: 3rem;
        overflow: hidden;
      }
    }

    .brand-content {
      position: relative;
      z-index: 2;
      max-width: 440px;
    }

    .brand-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 140px; height: 140px;
      margin-bottom: 2rem;
    }

    .brand-title {
      font-size: 2.5rem;
      font-weight: 800;
      letter-spacing: -0.025em;
      line-height: 1.1;
      color: var(--on-surface);
      margin-bottom: 1rem;
    }

    .brand-tagline {
      font-size: 1.25rem;
      font-weight: 500;
      color: var(--muted);
      margin-bottom: 2.5rem;
    }
    .brand-tagline-accent {
      color: var(--accent);
      font-weight: 700;
    }

    /* ─── Flow Diagram ─── */
    .brand-flow-diagram {
      width: 100%;
      max-width: 440px;
      margin-bottom: 2.5rem;
    }
    .flow-svg {
      width: 100%;
      height: 100px;
      overflow: visible;
    }
    .flow-line-bg {
      fill: none;
      stroke: color-mix(in srgb, var(--border) 60%, transparent);
      stroke-width: 2;
      stroke-dasharray: 6 6;
    }
    .flow-line-animated {
      fill: none;
      stroke: url(#flowGrad);
      stroke-width: 4;
      stroke-dasharray: 8 8;
      animation: flow-dash 1.5s linear infinite;
    }
    @keyframes flow-dash {
      from { stroke-dashoffset: 32; }
      to { stroke-dashoffset: 0; }
    }
    .flow-node {
      transform-origin: center;
    }
    .node-bg {
    }
    .node-border {
      fill: none;
      stroke-width: 2;
      opacity: 0.4;
    }
    .node-label {
      font-size: 13px;
      font-weight: 600;
      fill: var(--on-surface);
      text-anchor: middle;
      dominant-baseline: hanging;
    }

    .brand-accent-line {
      height: 3px;
      width: 64px;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--accent), var(--primary-light));
      opacity: 0.6;
    }

    /* ─── Form panel (right, or full on mobile) ─── */
    .form-panel {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 1 1 100%;
      padding: 1.5rem;
    }
    @media (min-width: 1024px) {
      .form-panel {
        flex: 1 1 50%;
        max-width: 50%;
        padding: 3rem;
      }
    }

    /* ─── Form card (glass on mobile, solid on desktop) ─── */
    .form-card {
      position: relative;
      width: 100%;
      max-width: 420px;
      padding: 2.5rem 2rem;
      border-radius: 1.5rem;
      background: color-mix(in srgb, var(--surface-card) 80%, transparent);
      backdrop-filter: blur(24px) saturate(160%);
      -webkit-backdrop-filter: blur(24px) saturate(160%);
      border: 1px solid color-mix(in srgb, var(--border) 50%, transparent);
      box-shadow:
        0 24px 80px -12px rgba(0,0,0,0.08),
        0 4px 16px -4px rgba(0,0,0,0.04),
        inset 0 1px 0 color-mix(in srgb, white 8%, transparent);
    }
    :host-context(.dark) .form-card {
      background: color-mix(in srgb, var(--surface-card) 70%, transparent);
      box-shadow:
        0 24px 80px -12px rgba(0,0,0,0.4),
        0 4px 16px -4px rgba(0,0,0,0.25),
        inset 0 1px 0 rgba(255,255,255,0.04);
    }
    @media (min-width: 1024px) {
      .form-card {
        background: var(--surface-card);
        backdrop-filter: none;
        padding: 3rem 2.5rem;
        box-shadow:
          0 24px 80px -12px rgba(0,0,0,0.1),
          0 4px 16px -4px rgba(0,0,0,0.05);
      }
      :host-context(.dark) .form-card {
        background: var(--surface-card);
        box-shadow:
          0 24px 80px -12px rgba(0,0,0,0.5),
          0 4px 16px -4px rgba(0,0,0,0.3);
      }
    }

    /* ─── Theme toggle (absolute top-right) ─── */
    .form-theme-toggle {
      position: absolute;
      top: 1rem; right: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 36px; height: 36px;
      border-radius: 9999px;
      color: var(--muted);
      transition: all 0.2s ease;
    }
    .form-theme-toggle:hover {
      color: var(--on-surface);
      background: color-mix(in srgb, var(--on-surface) 6%, transparent);
    }

    /* ─── Form logo ─── */
    .form-logo {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100px; height: 100px;
      margin: 0 auto 1.5rem;
    }
    @media (min-width: 1024px) {
      .form-logo { display: none; }
    }

    /* ─── Form typography ─── */
    .form-title {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      letter-spacing: -0.015em;
      color: var(--on-surface);
      margin-bottom: 0.375rem;
    }
    @media (min-width: 1024px) {
      .form-title { font-size: 1.625rem; }
    }
    .form-subtitle {
      text-align: center;
      font-size: 0.875rem;
      color: var(--muted);
      margin-bottom: 2rem;
    }

    /* ─── Google button with shimmer ─── */
    .google-btn {
      position: relative;
      display: block;
      width: 100%;
      overflow: hidden;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: var(--surface-card);
      transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
      margin-bottom: 1.75rem;
    }
    .google-btn:hover {
      border-color: color-mix(in srgb, var(--accent) 40%, var(--border));
      box-shadow:
        0 8px 24px -4px color-mix(in srgb, var(--accent) 12%, transparent),
        0 2px 8px rgba(0,0,0,0.04);
      transform: translateY(-2px);
    }
    .google-btn:active {
      transform: translateY(0);
    }
    .google-btn-inner {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--on-surface);
    }
    .google-btn-shimmer {
      position: absolute;
      inset: 0;
      z-index: 0;
      background: linear-gradient(
        90deg,
        transparent 0%,
        color-mix(in srgb, var(--accent) 6%, transparent) 50%,
        transparent 100%
      );
      background-size: 200% 100%;
      animation: shimmer 2.5s ease-in-out infinite;
      opacity: 0;
      transition: opacity 0.3s ease;
    }
    .google-btn:hover .google-btn-shimmer {
      opacity: 1;
    }

    /* ─── Dev mode divider ─── */
    .dev-divider {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.75rem;
    }
    .dev-divider-line {
      flex: 1;
      height: 1px;
      background: var(--border);
    }
    .dev-divider-badge {
      font-size: 0.625rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      padding: 0.125rem 0.5rem;
      border-radius: 0.375rem;
      background: color-mix(in srgb, var(--orange) 12%, transparent);
      color: var(--orange);
    }
    .dev-label {
      text-align: center;
      font-size: 0.6875rem;
      color: var(--muted);
      margin-bottom: 1rem;
    }

    /* ─── Dev role buttons ─── */
    .dev-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.625rem;
    }
    .dev-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.375rem;
      padding: 0.875rem 0.5rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      background: transparent;
      font-size: 0.6875rem;
      font-weight: 600;
      color: var(--muted);
      transition: all 0.25s cubic-bezier(0.22,1,0.36,1);
    }
    .dev-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px -4px rgba(0,0,0,0.08);
    }
    .dev-btn-functional:hover {
      border-color: color-mix(in srgb, var(--primary-light) 50%, var(--border));
      color: var(--primary-light);
      background: color-mix(in srgb, var(--primary-light) 5%, transparent);
    }
    .dev-btn-developer:hover {
      border-color: color-mix(in srgb, var(--accent) 50%, var(--border));
      color: var(--accent);
      background: color-mix(in srgb, var(--accent) 5%, transparent);
    }
    .dev-btn-admin:hover {
      border-color: color-mix(in srgb, var(--orange) 50%, var(--border));
      color: var(--orange);
      background: color-mix(in srgb, var(--orange) 5%, transparent);
    }
  `],
})
export class LoginComponent {
  auth = inject(AuthService);
  theme = inject(ThemeService);
}

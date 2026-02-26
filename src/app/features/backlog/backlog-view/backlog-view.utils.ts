import type { RequestType } from '../../../shared/models/request.model';

export function getImpactLabel(importance: number): 'alto' | 'medio' | 'bajo' {
  if (importance >= 4) return 'alto';
  if (importance <= 2) return 'bajo';
  return 'medio';
}

export function typeColor(type: RequestType): string {
  if (type === 'incidencia') return 'var(--magenta)';
  if (type === 'mejora') return 'var(--primary-light)';
  return 'var(--lime)';
}

export function impactBg(importance: number): string {
  if (importance >= 4) return 'color-mix(in srgb, var(--magenta) 10%, transparent)';
  if (importance <= 2) return 'color-mix(in srgb, var(--cool-gray) 10%, transparent)';
  return 'color-mix(in srgb, var(--orange) 10%, transparent)';
}

export function impactTextColor(importance: number): string {
  if (importance >= 4) return 'var(--magenta)';
  if (importance <= 2) return 'var(--cool-gray)';
  return 'var(--orange)';
}

export function scoreColor(score: number): string {
  if (score >= 4) return 'var(--magenta)';
  if (score >= 3) return 'var(--orange)';
  return 'var(--cool-gray)';
}

export function scoreBg(score: number): string {
  if (score >= 4) return 'color-mix(in srgb, var(--magenta) 12%, transparent)';
  if (score >= 3) return 'color-mix(in srgb, var(--orange) 12%, transparent)';
  return 'color-mix(in srgb, var(--cool-gray) 12%, transparent)';
}

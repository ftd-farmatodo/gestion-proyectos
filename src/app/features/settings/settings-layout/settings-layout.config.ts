import type { UserRole } from '../../../core/auth/auth.model';

export const TEAM_EMOJI_OPTIONS = [
  { value: '💼', label: 'General' },
  { value: '💻', label: 'Tecnología' },
  { value: '📦', label: 'Operaciones' },
  { value: '📊', label: 'Analítica' },
  { value: '🧾', label: 'Finanzas' },
  { value: '🛒', label: 'Comercial' },
  { value: '🧑‍💼', label: 'Talento' },
  { value: '🛠️', label: 'Soporte' },
  { value: '🚚', label: 'Logística' },
  { value: '📣', label: 'Marketing' },
];

export const ROLE_OPTIONS: { value: UserRole; labelKey: string }[] = [
  { value: 'functional', labelKey: 'settings.roleFunctional' },
  { value: 'developer', labelKey: 'settings.roleDeveloper' },
  { value: 'admin', labelKey: 'settings.roleAdmin' },
];

export const STATUS_COLOR_OPTIONS = [
  { value: 'var(--cool-gray)', labelKey: 'settings.colorGray' },
  { value: 'var(--orange)', labelKey: 'settings.colorOrange' },
  { value: 'var(--primary-light)', labelKey: 'settings.colorBlue' },
  { value: 'var(--purple)', labelKey: 'settings.colorPurple' },
  { value: 'var(--lime)', labelKey: 'settings.colorGreen' },
  { value: 'var(--magenta)', labelKey: 'settings.colorMagenta' },
  { value: 'var(--accent)', labelKey: 'settings.colorAccent' },
];

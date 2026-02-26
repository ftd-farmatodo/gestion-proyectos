import { Injectable, inject, signal, computed } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { I18nService } from './i18n.service';

export interface AffectedModule {
  key: string;
  label_es: string;
  label_en: string;
  icon?: string;
  order: number;
  is_active: boolean;
}

const DEFAULT_MODULES: AffectedModule[] = [
  { key: 'portal',   label_es: 'Portal web',     label_en: 'Web portal',    order: 1, is_active: true },
  { key: 'app',      label_es: 'App móvil',      label_en: 'Mobile app',    order: 2, is_active: true },
  { key: 'backend',  label_es: 'Backend / APIs',  label_en: 'Backend / APIs', order: 3, is_active: true },
  { key: 'database', label_es: 'Base de datos',   label_en: 'Database',      order: 4, is_active: true },
  { key: 'reports',  label_es: 'Reportes',        label_en: 'Reports',       order: 5, is_active: true },
  { key: 'other',    label_es: 'Otro',            label_en: 'Other',         order: 6, is_active: true },
];

@Injectable({ providedIn: 'root' })
export class AffectedModuleStore {
  private supabase = inject(SupabaseService);
  private i18n = inject(I18nService);
  private _modules = signal<AffectedModule[]>([]);

  constructor() {
    void this.reload();
  }

  readonly all = computed(() =>
    this._modules()
      .filter((m) => m.is_active)
      .sort((a, b) => a.order - b.order)
  );

  readonly allIncludingInactive = this._modules.asReadonly();

  getLabel(key: string | undefined): string {
    if (!key) return '';
    const mod = this._modules().find((m) => m.key === key);
    if (!mod) return key;
    const lang = this.i18n.locale();
    return lang === 'es' ? mod.label_es : mod.label_en;
  }

  async add(mod: Omit<AffectedModule, 'is_active'>): Promise<boolean> {
    const key = mod.key.trim().toLowerCase().replace(/\s+/g, '_');
    if (!key || !mod.label_es.trim() || !mod.label_en.trim()) return false;
    if (this._modules().some((m) => m.key === key)) return false;

    const newMod: AffectedModule = {
      key,
      label_es: mod.label_es.trim(),
      label_en: mod.label_en.trim(),
      icon: mod.icon?.trim() || undefined,
      order: mod.order,
      is_active: true,
    };

    this._modules.update((list) => [...list, newMod]);

    let client;
    try { client = this.supabase.requireClient(); } catch {
      this._modules.update((list) => list.filter((m) => m.key !== key));
      return false;
    }

    const { error } = await client.from('affected_modules').insert({
      key: newMod.key,
      label_es: newMod.label_es,
      label_en: newMod.label_en,
      icon: newMod.icon ?? null,
      order: newMod.order,
      is_active: true,
    });

    if (error) {
      this._modules.update((list) => list.filter((m) => m.key !== key));
      return false;
    }
    return true;
  }

  async remove(key: string): Promise<boolean> {
    const prev = this._modules();
    this._modules.update((list) => list.filter((m) => m.key !== key));

    let client;
    try { client = this.supabase.requireClient(); } catch {
      this._modules.set(prev);
      return false;
    }

    const { error } = await client.from('affected_modules').delete().eq('key', key);
    if (error) {
      this._modules.set(prev);
      return false;
    }
    return true;
  }

  async reload(): Promise<void> {
    let client;
    try { client = this.supabase.requireClient(); } catch {
      if (this._modules().length === 0) this._modules.set(DEFAULT_MODULES);
      return;
    }

    const { data, error } = await client
      .from('affected_modules')
      .select('*')
      .order('order', { ascending: true });

    if (error || !data) {
      if (this._modules().length === 0) this._modules.set(DEFAULT_MODULES);
      return;
    }

    if (data.length === 0) {
      await client.from('affected_modules').upsert(
        DEFAULT_MODULES.map((m) => ({
          key: m.key,
          label_es: m.label_es,
          label_en: m.label_en,
          icon: m.icon ?? null,
          order: m.order,
          is_active: true,
        })),
        { onConflict: 'key' }
      );
      this._modules.set(DEFAULT_MODULES);
      return;
    }

    this._modules.set(
      data.map((row) => ({
        key: String(row.key),
        label_es: String(row.label_es),
        label_en: String(row.label_en),
        icon: row.icon ? String(row.icon) : undefined,
        order: Number(row.order ?? 0),
        is_active: Boolean(row.is_active),
      }))
    );
  }
}

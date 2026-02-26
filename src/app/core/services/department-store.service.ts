import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';

const DEFAULT_DEPARTMENTS: string[] = [
  'Finanzas',
  'Recursos Humanos',
  'Comercial',
  'Operaciones',
  'Tecnología',
  'Legal',
  'Marketing',
  'Logística',
  'Compras',
  'Gerencia',
];

@Injectable({ providedIn: 'root' })
export class DepartmentStore {
  private supabase = inject(SupabaseService);
  private _departments = signal<string[]>([]);

  constructor() {
    void this.reload();
  }

  readonly all = this._departments.asReadonly();

  async add(name: string): Promise<boolean> {
    const trimmed = name.trim();
    if (!trimmed) return false;
    if (this._departments().some((d) => d.toLowerCase() === trimmed.toLowerCase())) {
      return false;
    }
    this._departments.update((list) => [...list, trimmed]);
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._departments.update((list) => list.filter((d) => d !== trimmed));
      return false;
    }
    const { error } = await client.from('departments').insert({ name: trimmed });
    if (error) {
      this._departments.update((list) => list.filter((d) => d !== trimmed));
      return false;
    }
    return true;
  }

  async remove(name: string): Promise<boolean> {
    const prev = this._departments();
    this._departments.update((list) => list.filter((d) => d !== name));
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      this._departments.set(prev);
      return false;
    }
    const { error } = await client.from('departments').delete().eq('name', name);
    if (error) {
      this._departments.set(prev);
      return false;
    }
    return true;
  }

  async reload(): Promise<void> {
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      if (this._departments().length === 0) {
        this._departments.set(DEFAULT_DEPARTMENTS);
      }
      return;
    }
    const { data, error } = await client
      .from('departments')
      .select('name')
      .eq('is_active', true)
      .order('name', { ascending: true });
    if (error) {
      if (this._departments().length === 0) {
        this._departments.set(DEFAULT_DEPARTMENTS);
      }
      return;
    }
    if (!data || data.length === 0) {
      await client.from('departments').upsert(
        DEFAULT_DEPARTMENTS.map((name) => ({ name, is_active: true })),
        { onConflict: 'name' }
      );
      this._departments.set(DEFAULT_DEPARTMENTS);
      return;
    }
    this._departments.set(data.map((row) => row.name));
  }
}

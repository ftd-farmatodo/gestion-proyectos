import { Injectable } from '@angular/core';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../environments/environment';

/**
 * Singleton Supabase client. Use this service as the only point of contact with Supabase.
 * When URL/Key are placeholders, client is null and the app runs with mock data.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly _client: SupabaseClient | null;
  private readonly _isConfigured: boolean;

  constructor() {
    const url = (environment.supabaseUrl ?? '').trim();
    const key = (environment.supabaseAnonKey ?? '').trim();
    this._isConfigured = this.isValidUrl(url) && !this.isPlaceholder(url, key);
    this._client = this._isConfigured
      ? createClient(url, key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
      : null;
  }

  /** Returns the Supabase client or null if credentials are missing. */
  get client(): SupabaseClient | null {
    return this._client;
  }

  /** Whether Supabase credentials are configured. */
  get isConfigured(): boolean {
    return this._isConfigured;
  }

  /**
   * Returns a non-null client or throws an explicit configuration error.
   * Use this in services that require Supabase to function.
   */
  requireClient(): SupabaseClient {
    if (!this._client) {
      throw new Error(
        'Supabase is not configured. Set src/environments/environment*.ts with supabaseUrl and supabaseAnonKey.'
      );
    }
    return this._client;
  }

  /**
   * Create a real-time channel. No-op if client is not configured.
   * @example supabase.channel('requests').on('postgres_changes', { ... }).subscribe()
   */
  channel(name: string) {
    if (!this._client) return null;
    return this._client.channel(name);
  }

  private isPlaceholder(url: string, key: string): boolean {
    return (
      url.includes('YOUR_PROJECT_REF') ||
      url === 'YOUR_SUPABASE_URL' ||
      key === 'YOUR_SUPABASE_ANON_KEY'
    );
  }

  private isValidUrl(url: string): boolean {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}

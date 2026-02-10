import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Singleton Supabase client. Use this service as the only point of contact with Supabase.
 * When URL/Key are placeholders, client is null and the app runs with mock data.
 */
@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private _client: ReturnType<typeof import('@supabase/supabase-js').createClient> | null = null;

  constructor() {
    const url = environment.supabaseUrl;
    const key = environment.supabaseAnonKey;
    const isConfigured =
      url &&
      key &&
      url !== 'YOUR_SUPABASE_URL' &&
      key !== 'YOUR_SUPABASE_ANON_KEY';
    if (isConfigured) {
      import('@supabase/supabase-js').then(({ createClient }) => {
        this._client = createClient(url, key);
      });
    }
  }

  /** Returns the Supabase client or null if not configured (mock mode). */
  get client(): ReturnType<typeof import('@supabase/supabase-js').createClient> | null {
    return this._client;
  }

  /** Whether Supabase is configured and available. */
  get isConfigured(): boolean {
    return this._client != null;
  }

  /**
   * Create a real-time channel. No-op if client is not configured.
   * @example supabase.channel('requests').on('postgres_changes', { ... }).subscribe()
   */
  channel(name: string): ReturnType<ReturnType<typeof import('@supabase/supabase-js').createClient>['channel'] | null> {
    if (!this._client) {
      return null as unknown as ReturnType<ReturnType<typeof import('@supabase/supabase-js').createClient>['channel']>;
    }
    return this._client.channel(name);
  }
}

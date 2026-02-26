import { Injectable, inject } from '@angular/core';
import type { Attachment } from '../../shared/models/request.model';
import { SupabaseService } from './supabase.service';

const REQUESTS_BUCKET = 'request-attachments';

@Injectable({ providedIn: 'root' })
export class StorageService {
  private supabase = inject(SupabaseService);

  async uploadRequestAttachments(
    attachments: Attachment[] | undefined,
    requestId: string,
    userId: string
  ): Promise<Attachment[] | undefined> {
    if (!attachments || attachments.length === 0) return undefined;
    let client;
    try {
      client = this.supabase.requireClient();
    } catch {
      return attachments;
    }
    const uploaded: Attachment[] = [];

    for (const attachment of attachments) {
      if (!attachment.data) {
        uploaded.push(attachment);
        continue;
      }
      const blob = this.dataUrlToBlob(attachment.data);
      const safeName = attachment.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${userId}/${requestId}/${attachment.id}-${safeName}`;
      const { error } = await client.storage
        .from(REQUESTS_BUCKET)
        .upload(path, blob, { contentType: attachment.type || blob.type, upsert: false });
      if (error) {
        uploaded.push({
          id: attachment.id,
          name: attachment.name,
          type: attachment.type,
          size: attachment.size,
        });
        continue;
      }
      const { data } = client.storage.from(REQUESTS_BUCKET).getPublicUrl(path);
      uploaded.push({
        id: attachment.id,
        name: attachment.name,
        type: attachment.type,
        size: attachment.size,
        path,
        url: data.publicUrl,
      });
    }
    return uploaded;
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const [meta, base64] = dataUrl.split(',');
    const mime = /data:(.*?);base64/.exec(meta)?.[1] ?? 'application/octet-stream';
    const binary = atob(base64 ?? '');
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  }
}

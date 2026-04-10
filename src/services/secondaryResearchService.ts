import { supabase } from '@/lib/supabase';

export type SecondaryResearchFileRef = {
  bucket: string;
  storagePath: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
};

export type SecondaryResearchLinkRef = { url: string };
export type SecondaryResearchTextRef = { text: string; addedAt?: string };

export type SecondaryResearchWebhookPayload = {
  project_id: string;
  user_id: string;
  files?: SecondaryResearchFileRef[];
  links?: SecondaryResearchLinkRef[];
  texts?: SecondaryResearchTextRef[];
};

const DEFAULT_BUCKET = 'secondary-research';
const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['md', 'txt', 'pdf', 'docx']);

function getExtension(name: string): string {
  const idx = name.lastIndexOf('.');
  return idx >= 0 ? name.slice(idx + 1).toLowerCase() : '';
}

export function validateSecondaryResearchFile(file: File): string | null {
  const ext = getExtension(file.name);
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return 'Unsupported file type. Allowed: MD, TXT, PDF, DOCX.';
  }
  if (file.size > MAX_FILE_BYTES) {
    return 'File exceeds 5MB limit.';
  }
  return null;
}

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]+/g, '').replace(/\s+/g, ' ').trim();
}

export function buildSecondaryResearchStoragePath(projectId: string, fileName: string): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  const safe = sanitizeFilename(fileName);
  const id = crypto.randomUUID();
  return `projects/${projectId}/${yyyy}-${mm}-${dd}/${id}-${safe}`;
}

export async function uploadSecondaryResearchFiles(params: {
  projectId: string;
  files: File[];
  bucket?: string;
  concurrency?: number;
}): Promise<{ uploaded: SecondaryResearchFileRef[]; errors: Array<{ file: File; message: string }> }> {
  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const concurrency = Math.max(1, Math.min(5, params.concurrency ?? 3));

  const queue = [...params.files];
  const uploaded: SecondaryResearchFileRef[] = [];
  const errors: Array<{ file: File; message: string }> = [];

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length) {
      const file = queue.shift();
      if (!file) return;
      const validationError = validateSecondaryResearchFile(file);
      if (validationError) {
        errors.push({ file, message: validationError });
        continue;
      }

      const storagePath = buildSecondaryResearchStoragePath(params.projectId, file.name);
      const { error } = await supabase.storage
        .from(bucket)
        .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });

      if (error) {
        errors.push({ file, message: error.message || 'Upload failed.' });
        continue;
      }

      uploaded.push({
        bucket,
        storagePath,
        originalName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size ?? 0,
      });
    }
  });

  await Promise.all(workers);
  return { uploaded, errors };
}

// Returns a permanent public URL — no expiry, no auth required.
// The secondary-research bucket must be public (already configured).
export function getPublicFileUrl(params: {
  bucket?: string;
  storagePath: string;
}): string {
  const bucket = params.bucket ?? DEFAULT_BUCKET;
  const { data } = supabase.storage.from(bucket).getPublicUrl(params.storagePath);
  return data.publicUrl;
}

// Kept for backwards-compatibility — now returns a permanent public URL
// instead of a short-lived signed URL.
export async function createSignedUrl(params: {
  bucket?: string;
  storagePath: string;
  expiresInSeconds?: number; // ignored — public URLs never expire
}): Promise<string> {
  return getPublicFileUrl({ bucket: params.bucket, storagePath: params.storagePath });
}

// ── Direct Supabase save (bypasses n8n, always works) ─────────────────────────
export async function saveSecondaryResearchToSupabase(params: {
  projectId: string;
  newFiles?: SecondaryResearchFileRef[];
  newLinks?: SecondaryResearchLinkRef[];
  newTexts?: SecondaryResearchTextRef[];
}): Promise<void> {
  // 1. Fetch existing secondaryresearch value
  const { data: existing, error: fetchError } = await supabase
    .from('projects')
    .select('secondaryresearch')
    .eq('id', params.projectId)
    .single();

  if (fetchError && fetchError.code !== 'PGRST116') {
    throw new Error(`Failed to fetch existing research: ${fetchError.message}`);
  }

  const prev = existing?.secondaryresearch ?? {};
  const prevInputs = prev?.content?.inputs ?? {};

  const mergedFiles: SecondaryResearchFileRef[] = [
    ...(prevInputs.files ?? []),
    ...(params.newFiles ?? []),
  ];
  const mergedLinks: SecondaryResearchLinkRef[] = [
    ...(prevInputs.links ?? []),
    ...(params.newLinks ?? []),
  ];
  const mergedTexts: SecondaryResearchTextRef[] = [
    ...(prevInputs.texts ?? []),
    ...(params.newTexts ?? []).map(t => ({ ...t, addedAt: new Date().toISOString() })),
  ];

  const updated = {
    content: {
      inputs: {
        files: mergedFiles,
        links: mergedLinks,
        texts: mergedTexts,
      },
      updated_at: new Date().toISOString(),
    },
  };

  const { error: updateError } = await supabase
    .from('projects')
    .update({ secondaryresearch: updated })
    .eq('id', params.projectId);

  if (updateError) {
    throw new Error(`Failed to save secondary research: ${updateError.message}`);
  }
}

// ── Optional: forward to n8n for AI processing ────────────────────────────────
const BACKEND_URL = (import.meta as any).env?.VITE_PPT_API_URL || ((import.meta as any).env?.PROD ? '' : 'http://localhost:8000');

export async function postSecondaryResearchToN8n(params: {
  webhookUrl: string;
  payload: SecondaryResearchWebhookPayload;
}): Promise<void> {
  const res = await fetch(`${BACKEND_URL}/api/v1/webhook/proxy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      target_url: params.webhookUrl,
      payload: params.payload
    }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(text || `n8n request failed (${res.status})`);
  }
}

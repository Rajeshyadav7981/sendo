import { apiClient } from './client';

export interface UploadedFile {
  fieldname: string;
  originalName: string;
  storedName: string;
  key: string;
  relativePath: string;
  path: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface UploadOptions {
  subdir?: string;
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

const uploadUrl = (subdir?: string) =>
  `/upload${subdir ? `?subdir=${encodeURIComponent(subdir)}` : ''}`;

/**
 * Upload a single file. Returns {key,url,...} — store `key` in form state
 * and submit it as a JSON string. URLs are short-lived (signed) once S3
 * is on; recompute via resolveUrl(key) when rendering.
 */
export async function uploadFile(
  file: File | Blob,
  opts: UploadOptions = {},
): Promise<UploadedFile> {
  const form = new FormData();
  const filename = file instanceof File ? file.name : 'file';
  form.append('file', file, filename);

  const res = await apiClient.raw.post<{ files: UploadedFile[] }>(uploadUrl(opts.subdir), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal: opts.signal,
    onUploadProgress: opts.onProgress
      ? (e) => opts.onProgress?.(e.loaded, e.total ?? 0)
      : undefined,
  });
  const out = unwrapFiles(res.data);
  if (!out[0]) throw new Error('Upload returned no files');
  return out[0];
}

export async function uploadFiles(
  files: Array<File | Blob>,
  opts: UploadOptions = {},
): Promise<UploadedFile[]> {
  const form = new FormData();
  for (const f of files) {
    const filename = f instanceof File ? f.name : 'file';
    form.append('file', f, filename);
  }
  const res = await apiClient.raw.post<{ files: UploadedFile[] }>(uploadUrl(opts.subdir), form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    signal: opts.signal,
    onUploadProgress: opts.onProgress
      ? (e) => opts.onProgress?.(e.loaded, e.total ?? 0)
      : undefined,
  });
  return unwrapFiles(res.data);
}

export async function resolveUrl(key: string): Promise<string | null> {
  if (!key) return null;
  const out = await apiClient.get<{ key: string; url: string | null }>(
    `/upload/url?key=${encodeURIComponent(key)}`,
  );
  return out?.url ?? null;
}

export async function resolveUrls(keys: string[]): Promise<Record<string, string | null>> {
  if (keys.length === 0) return {};
  const out = await apiClient.post<{ items: Array<{ key: string; url: string | null }> }>(
    '/upload/url/batch',
    { keys },
  );
  const items = (out as unknown as { items?: Array<{ key: string; url: string | null }> })
    ?.items ?? [];
  return Object.fromEntries(items.map((i) => [i.key, i.url]));
}

// The driver client unwraps {success,data} envelopes; the upload route returns
// the raw {files:[...]} body, so we read either shape.
function unwrapFiles(body: unknown): UploadedFile[] {
  if (body && typeof body === 'object') {
    const direct = (body as { files?: UploadedFile[] }).files;
    if (Array.isArray(direct)) return direct;
    const wrapped = (body as { data?: { files?: UploadedFile[] } }).data?.files;
    if (Array.isArray(wrapped)) return wrapped;
  }
  return [];
}

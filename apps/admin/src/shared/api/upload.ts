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
  /** Logical bucket on the backend; becomes a key prefix. */
  subdir?: string;
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}

const uploadUrl = (subdir?: string) =>
  `/upload${subdir ? `?subdir=${encodeURIComponent(subdir)}` : ''}`;

/**
 * Upload a single file to the backend's storage abstraction. Returns the
 * UploadedFile descriptor — store `key` in your DB-bound form value, not
 * `url`. Call `resolveUrl(key)` later to get a fresh download URL (the URL
 * is signed and short-lived once S3 is enabled).
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
  if (!res.data.files?.[0]) throw new Error('Upload returned no files');
  return res.data.files[0];
}

/** Upload multiple files in a single request. */
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
  return res.data.files ?? [];
}

/** Resolve a stored key back to a (possibly signed) download URL. */
export async function resolveUrl(key: string): Promise<string | null> {
  if (!key) return null;
  const { url } = await apiClient.get<{ key: string; url: string | null }>(
    `/upload/url?key=${encodeURIComponent(key)}`,
  );
  return url;
}

export async function resolveUrls(keys: string[]): Promise<Record<string, string | null>> {
  if (keys.length === 0) return {};
  const { items } = await apiClient.post<{ items: Array<{ key: string; url: string | null }> }>(
    '/upload/url/batch',
    { keys },
  );
  return Object.fromEntries(items.map((i) => [i.key, i.url]));
}

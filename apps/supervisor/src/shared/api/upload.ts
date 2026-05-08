import { backendClient } from './client';

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
 * Upload a single file via the supervisor's backendClient (the one that
 * hits the root API, not the /api tracker namespace). x-emp-password is
 * attached automatically by the client interceptor.
 */
export async function uploadFile(
  file: File | Blob,
  opts: UploadOptions = {},
): Promise<UploadedFile> {
  const form = new FormData();
  const filename = file instanceof File ? file.name : 'file';
  form.append('file', file, filename);

  const res = await backendClient.raw.post<{ files: UploadedFile[] }>(
    uploadUrl(opts.subdir),
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: opts.signal,
      onUploadProgress: opts.onProgress
        ? (e) => opts.onProgress?.(e.loaded, e.total ?? 0)
        : undefined,
    },
  );
  if (!res.data.files?.[0]) throw new Error('Upload returned no files');
  return res.data.files[0];
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
  const res = await backendClient.raw.post<{ files: UploadedFile[] }>(
    uploadUrl(opts.subdir),
    form,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      signal: opts.signal,
      onUploadProgress: opts.onProgress
        ? (e) => opts.onProgress?.(e.loaded, e.total ?? 0)
        : undefined,
    },
  );
  return res.data.files ?? [];
}

export async function resolveUrl(key: string): Promise<string | null> {
  if (!key) return null;
  const { url } = await backendClient.get<{ key: string; url: string | null }>(
    `/upload/url?key=${encodeURIComponent(key)}`,
  );
  return url;
}

export async function resolveUrls(keys: string[]): Promise<Record<string, string | null>> {
  if (keys.length === 0) return {};
  const { items } = await backendClient.post<{
    items: Array<{ key: string; url: string | null }>;
  }>('/upload/url/batch', { keys });
  return Object.fromEntries(items.map((i) => [i.key, i.url]));
}

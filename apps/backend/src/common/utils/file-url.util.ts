import * as path from 'node:path';

/**
 * Build a public URL for a stored file path.
 * Mirrors the legacy `${BASE_URL}/uploads/${path.basename(filePath)}` shape.
 */
export function buildFileUrl(baseUrl: string, filePath?: string | null): string | null {
  if (!filePath) return null;
  return `${baseUrl.replace(/\/$/, '')}/uploads/${path.basename(filePath)}`;
}

import { BadRequestException } from '@nestjs/common';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { MultipartFile } from '@fastify/multipart';

export interface SavedFile {
  fieldname: string;
  originalName: string;
  storedName: string;
  path: string;        // absolute on disk
  relativePath: string; // relative to uploadsRoot, forward slashes
  size: number;
  mimetype: string;
}

/**
 * Persist a Fastify multipart file under `<uploadsRoot>/<subdir>/`.
 * Replaces the legacy multer.diskStorage logic.
 */
export async function saveMultipartFile(
  file: MultipartFile,
  uploadsRoot: string,
  subdir: string,
  maxSize: number,
): Promise<SavedFile> {
  const dir = path.join(uploadsRoot, subdir);
  await fs.mkdir(dir, { recursive: true });

  const safeOriginal = (file.filename || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
  const storedName = `${Date.now()}-${randomUUID().slice(0, 8)}-${safeOriginal}`;
  const absPath = path.join(dir, storedName);

  const buf = await file.toBuffer();
  if (buf.byteLength > maxSize) {
    throw new BadRequestException(`File ${safeOriginal} exceeds max size`);
  }
  await fs.writeFile(absPath, buf);

  return {
    fieldname: file.fieldname,
    originalName: safeOriginal,
    storedName,
    path: absPath,
    relativePath: path.relative(uploadsRoot, absPath).split(path.sep).join('/'),
    size: buf.byteLength,
    mimetype: file.mimetype,
  };
}

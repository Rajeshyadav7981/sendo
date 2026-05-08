import { Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Inject } from '@nestjs/common';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import type { FastifyRequest } from 'fastify';
import appConfig from '../../../config/app.config';
import { saveMultipartFile, type SavedFile } from '../../../common/utils/storage.util';

@Injectable()
export class MultipartHelper {
  constructor(@Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>) {}

  /** Drain a Fastify multipart request, persisting files to <uploadsDir>/<subdir>/. */
  async consume(
    req: FastifyRequest,
    subdir: string,
  ): Promise<{ fields: Record<string, string>; files: SavedFile[] }> {
    if (!req.isMultipart()) {
      return { fields: (req.body ?? {}) as Record<string, string>, files: [] };
    }

    const uploadsRoot = path.resolve(this.app.uploadsDir);
    await fs.mkdir(uploadsRoot, { recursive: true });

    const fields: Record<string, string> = {};
    const files: SavedFile[] = [];

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const saved = await saveMultipartFile(part, uploadsRoot, subdir, this.app.maxFileSizeBytes);
        files.push(saved);
      } else {
        fields[part.fieldname] = part.value as string;
      }
    }
    return { fields, files };
  }
}

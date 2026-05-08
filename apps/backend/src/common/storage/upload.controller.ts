import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { FastifyRequest } from 'fastify';
import { Public } from '../decorators/public.decorator';
import { StorageService } from './storage.service';
import type { UploadedFile } from './storage.types';

/**
 * Single dedicated upload entrypoint for every Vite frontend.
 *
 *   POST /upload         multipart, one or more `file` fields → UploadedFile[]
 *   GET  /upload/url     `?key=...` → resolved download URL (signed for S3)
 *
 * Forms then submit just the `key` (a string) as JSON, decoupling file
 * transfer from form submission. This lets us migrate to S3 without
 * touching every form-handling controller.
 *
 * @Public for now: drivers auth via OTP and have no JWT yet. When the
 * driver JWT-after-OTP flow lands, drop @Public and gate by role.
 */
@ApiTags('Upload')
@Controller('upload')
export class UploadController {
  constructor(private readonly storage: StorageService) {}

  @Public()
  @Post()
  @ApiOperation({
    summary:
      'Upload one or more files. Returns array of {key,url,...} — store key in DB, recompute url via /upload/url.',
  })
  async upload(
    @Req() req: FastifyRequest,
    @Query('subdir') subdirQuery?: string,
  ): Promise<{ files: UploadedFile[] }> {
    if (!req.isMultipart()) {
      throw new BadRequestException('Expected multipart/form-data');
    }

    const files: UploadedFile[] = [];
    let subdir = sanitizeSubdir(subdirQuery);

    for await (const part of req.parts()) {
      if (part.type === 'file') {
        const saved = await this.storage.uploadMultipart(part, {
          subdir,
          contentType: part.mimetype,
        });
        files.push(saved);
      } else if (part.fieldname === 'subdir' && typeof part.value === 'string') {
        // Allow subdir to be supplied in the form body too (handy for plain HTML forms).
        subdir = sanitizeSubdir(part.value);
      }
    }

    if (files.length === 0) {
      throw new BadRequestException('No files received');
    }
    return { files };
  }

  @Public()
  @Get('url')
  @ApiOperation({ summary: 'Resolve a storage key to a (possibly signed) download URL' })
  async resolveUrl(@Query('key') key: string): Promise<{ key: string; url: string | null }> {
    if (!key) throw new BadRequestException('Missing key');
    return { key, url: await this.storage.getUrl(key) };
  }

  @Public()
  @Post('url/batch')
  @ApiOperation({ summary: 'Resolve many keys at once. Body: { keys: string[] }' })
  async resolveUrlsBatch(
    @Body() body: { keys?: string[] },
  ): Promise<{ items: Array<{ key: string; url: string | null }> }> {
    const keys = Array.isArray(body?.keys) ? body.keys.filter((k) => typeof k === 'string') : [];
    const items = await Promise.all(
      keys.map(async (key) => ({ key, url: await this.storage.getUrl(key) })),
    );
    return { items };
  }

}

function sanitizeSubdir(raw: string | undefined | null): string {
  const v = (raw ?? 'misc').replace(/[^a-zA-Z0-9._/-]/g, '');
  return v.replace(/^\/+|\/+$/g, '') || 'misc';
}

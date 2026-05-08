import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import type { MultipartFile } from '@fastify/multipart';
import { randomUUID } from 'node:crypto';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import appConfig from '../../config/app.config';
import storageConfig from '../../config/storage.config';
import type { UploadOptions, UploadedFile } from './storage.types';

/**
 * Single point of truth for every file upload. Two backends:
 *
 *   driver = 's3'    → bytes go to S3, key = "<subdir>/<storedName>", url
 *                      is a signed GET URL (TTL = signedUrlExpirySeconds).
 *   driver = 'local' → bytes go to <uploadsDir>/<subdir>/<storedName>;
 *                      url = `${BASE_URL}/uploads/<key>` (served by
 *                      @fastify/static).
 *
 * Choice is made once at boot from `storage.driver`, which is `'s3'` iff
 * `S3_BUCKET` env is set. Add the access keys later — until then, dev keeps
 * working against the local disk.
 */
@Injectable()
export class StorageService implements OnModuleInit {
  private readonly logger = new Logger(StorageService.name);
  private s3: S3Client | null = null;

  constructor(
    @Inject(appConfig.KEY) private readonly app: ConfigType<typeof appConfig>,
    @Inject(storageConfig.KEY) private readonly cfg: ConfigType<typeof storageConfig>,
  ) {}

  onModuleInit(): void {
    if (this.cfg.driver === 's3') {
      const credentials =
        this.cfg.s3.accessKeyId && this.cfg.s3.secretAccessKey
          ? {
              accessKeyId: this.cfg.s3.accessKeyId,
              secretAccessKey: this.cfg.s3.secretAccessKey,
            }
          : undefined; // fall back to default chain (IAM role, ~/.aws, …)
      this.s3 = new S3Client({
        region: this.cfg.s3.region,
        endpoint: this.cfg.s3.endpoint,
        forcePathStyle: this.cfg.s3.forcePathStyle,
        credentials,
      });
      this.logger.log(`storage: s3 bucket=${this.cfg.s3.bucket} region=${this.cfg.s3.region}`);
    } else {
      this.logger.log(`storage: local dir=${path.resolve(this.app.uploadsDir)}`);
    }
  }

  // ── Uploads ────────────────────────────────────────────────────────────

  async uploadMultipart(file: MultipartFile, opts: UploadOptions): Promise<UploadedFile> {
    const buf = await file.toBuffer();
    return this.uploadBuffer(buf, {
      ...opts,
      contentType: opts.contentType ?? file.mimetype,
      fieldname: file.fieldname,
      originalName: file.filename ?? 'file',
    });
  }

  async uploadBuffer(
    buf: Buffer,
    opts: UploadOptions & { fieldname?: string; originalName?: string },
  ): Promise<UploadedFile> {
    if (buf.byteLength > this.app.maxFileSizeBytes) {
      throw new BadRequestException(
        `File exceeds max size (${this.app.maxFileSizeBytes} bytes)`,
      );
    }

    const safeOriginal = (opts.originalName ?? 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    const storedName =
      opts.keyHint?.split('/').pop() ??
      `${Date.now()}-${randomUUID().slice(0, 8)}-${safeOriginal}`;
    const subdir = (opts.subdir || 'misc').replace(/^\/+|\/+$/g, '');
    const key = opts.keyHint ?? `${subdir}/${storedName}`;
    const contentType = opts.contentType ?? 'application/octet-stream';

    if (this.cfg.driver === 's3') {
      if (!this.s3) throw new Error('S3 client not initialised');
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.cfg.s3.bucket,
          Key: key,
          Body: buf,
          ContentType: contentType,
          // ACL handled by bucket policy when 'private'; only attach when caller wants public
          ...(this.cfg.s3.acl !== 'private' ? { ACL: this.cfg.s3.acl as never } : {}),
        }),
      );
      const url = await this.signedReadUrl(key);
      return {
        fieldname: opts.fieldname ?? 'file',
        originalName: safeOriginal,
        storedName,
        key,
        relativePath: key,
        path: '',
        url,
        size: buf.byteLength,
        mimetype: contentType,
      };
    }

    // local backend
    const uploadsRoot = path.resolve(this.app.uploadsDir);
    const dir = path.join(uploadsRoot, subdir);
    await fs.mkdir(dir, { recursive: true });
    const absPath = path.join(dir, storedName);
    await fs.writeFile(absPath, buf);

    return {
      fieldname: opts.fieldname ?? 'file',
      originalName: safeOriginal,
      storedName,
      key,
      relativePath: key,
      path: absPath,
      url: this.publicLocalUrl(key),
      size: buf.byteLength,
      mimetype: contentType,
    };
  }

  // ── Reads ──────────────────────────────────────────────────────────────

  /**
   * Resolve a stored key back to a download URL. For S3 we issue a signed
   * GET (or use the public base URL when configured). For local, we hit
   * `/uploads/<key>` served by @fastify/static.
   */
  async getUrl(key: string | null | undefined): Promise<string | null> {
    if (!key) return null;
    if (this.cfg.driver === 's3') {
      if (this.cfg.s3.publicBaseUrl) {
        return `${this.cfg.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
      }
      return this.signedReadUrl(key);
    }
    return this.publicLocalUrl(key);
  }

  /** Synchronous variant — only safe for the local driver. */
  getUrlSync(key: string | null | undefined): string | null {
    if (!key) return null;
    if (this.cfg.driver === 's3') {
      if (this.cfg.s3.publicBaseUrl) {
        return `${this.cfg.s3.publicBaseUrl.replace(/\/$/, '')}/${key}`;
      }
      // S3 signed URL needs an async call; without a public base URL we return the key.
      // Callers that need a fresh signed URL should use getUrl() instead.
      return key;
    }
    return this.publicLocalUrl(key);
  }

  async delete(key: string): Promise<void> {
    if (this.cfg.driver === 's3') {
      if (!this.s3) return;
      await this.s3.send(
        new DeleteObjectCommand({ Bucket: this.cfg.s3.bucket, Key: key }),
      );
      return;
    }
    const abs = path.join(path.resolve(this.app.uploadsDir), key);
    await fs.unlink(abs).catch(() => undefined);
  }

  // ── Internals ──────────────────────────────────────────────────────────

  private publicLocalUrl(key: string): string {
    const base = (this.app.baseUrl ?? '').replace(/\/$/, '');
    return `${base}/uploads/${key}`;
  }

  private async signedReadUrl(key: string): Promise<string> {
    if (!this.s3) throw new Error('S3 client not initialised');
    return getSignedUrl(
      this.s3,
      new GetObjectCommand({ Bucket: this.cfg.s3.bucket, Key: key }),
      { expiresIn: this.cfg.s3.signedUrlExpirySeconds },
    );
  }
}

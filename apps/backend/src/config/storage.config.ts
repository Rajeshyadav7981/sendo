import { registerAs } from '@nestjs/config';

/**
 * Storage backend selection. If `S3_BUCKET` is set we use S3; otherwise we
 * fall back to writing to the local `uploadsDir` (legacy behaviour). This
 * lets dev keep working without AWS keys while prod can flip to S3 by
 * dropping in env vars.
 */
export default registerAs('storage', () => {
  const bucket = process.env.S3_BUCKET ?? '';
  return {
    driver: bucket ? ('s3' as const) : ('local' as const),
    s3: {
      bucket,
      region: process.env.S3_REGION ?? process.env.AWS_REGION ?? 'us-east-1',
      endpoint: process.env.S3_ENDPOINT ?? undefined,
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE === 'true',
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? process.env.AWS_ACCESS_KEY_ID ?? '',
      secretAccessKey:
        process.env.S3_SECRET_ACCESS_KEY ?? process.env.AWS_SECRET_ACCESS_KEY ?? '',
      publicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? '',
      signedUrlExpirySeconds: parseInt(process.env.S3_SIGNED_URL_EXPIRY ?? '3600', 10),
      acl: process.env.S3_OBJECT_ACL ?? 'private',
    },
  };
});

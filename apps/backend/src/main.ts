import 'dotenv/config';
import { ValidationPipe, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger as PinoLogger } from 'nestjs-pino';
import * as path from 'node:path';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
      bodyLimit: 10 * 1024 * 1024,
      // Use the inbound x-request-id when present, otherwise mint one;
      // pino-http picks this up so logs and the response header match.
      genReqId: (req: { headers: Record<string, string | string[] | undefined> }) =>
        (req.headers['x-request-id'] as string | undefined) ??
        `req_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`,
    }),
    { bufferLogs: true },
  );
  app.useLogger(app.get(PinoLogger));

  // Drain in-flight requests on SIGTERM/SIGINT so rolling deploys don't
  // truncate uploads or close DB transactions mid-flight.
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  const baseUrl = config.get<string>('app.baseUrl') ?? '';
  const env = config.get<string>('app.env') ?? 'development';
  const port = config.get<number>('app.port') ?? 5001;
  const uploadsDir = path.resolve(config.get<string>('app.uploadsDir') ?? './uploads');
  const cookieSecret = config.get<string>('jwt.cookieSecret') ?? '';

  // Echo the request id so clients/proxies can correlate.
  const fastifyInstance = app.getHttpAdapter().getInstance();
  fastifyInstance.addHook('onSend', (req, reply, payload, done) => {
    if (req.id) reply.header('x-request-id', req.id);
    done(null, payload);
  });

  // Security & infra plugins
  await app.register(import('@fastify/helmet'), {
    contentSecurityPolicy: false,
    hidePoweredBy: true,
  });
  await app.register(import('@fastify/compress'), {
    global: true,
    encodings: ['br', 'gzip', 'deflate'],
    threshold: 1024, // compressing tiny responses costs more than it saves
  });
  await app.register(import('@fastify/cookie'), { secret: cookieSecret });
  app.enableCors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders:
      'Content-Type,Authorization,X-Requested-With,Accept,Origin,x-emp-password,x-request-id,ngrok-skip-browser-warning',
    exposedHeaders: ['x-request-id'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
    maxAge: env === 'production' ? 86400 : 0,
  });
  await app.register(import('@fastify/multipart'), {
    limits: { fileSize: config.get<number>('app.maxFileSizeBytes') ?? 10 * 1024 * 1024 },
  });
  await app.register(import('@fastify/static'), {
    root: uploadsDir,
    prefix: '/uploads/',
    decorateReply: false,
    // Filenames embed a timestamp+uuid so content is effectively immutable;
    // letting the browser/CDN cache for a year is safe.
    maxAge: 31536000_000,
    immutable: true,
  });

  // Global validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      forbidNonWhitelisted: false,
      validationError: { target: false },
    }),
  );

  app.setGlobalPrefix('api', { exclude: ['/health', '/health/live', '/health/ready'] });
  app.enableVersioning({ type: VersioningType.URI, prefix: 'v', defaultVersion: VERSION_NEUTRAL });

  // OpenAPI / Swagger
  const swagger = new DocumentBuilder()
    .setTitle('Sendo Backend API')
    .setDescription('NestJS port of the legacy Express backend')
    .setVersion('1.0.0')
    .addCookieAuth('token')
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swagger));

  await app.listen(port, '0.0.0.0');
  // eslint-disable-next-line no-console
  console.log(`🚀 Sendo backend [${env}] listening on ${baseUrl} (port ${port})`);
}

void bootstrap();

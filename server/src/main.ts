import * as path from 'path';
import * as dotenv from 'dotenv';

// Load base env first, then local overrides.
dotenv.config({ path: path.join(__dirname, '..', '.env'), override: true });
dotenv.config({ path: path.join(__dirname, '..', '.env.local'), override: true });

import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { Request, Response } from 'express';

function getAllowedOrigins(): string[] {
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:8081',
    'http://127.0.0.1:8081',
    'https://brixlore.tv',
    'https://www.brixlore.tv',
    'https://brick-tales-web-eight.vercel.app',
  ];

  const configured = (process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...configured]));
}

function isAllowedVercelPreview(origin: string): boolean {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === 'https:' && parsed.hostname.endsWith('.vercel.app');
  } catch {
    return false;
  }
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // required for Stripe webhook signature verification
  });

  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin) || isAllowedVercelPreview(origin)) {
        return callback(null, true);
      }

      console.warn('Blocked by CORS:', origin);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    maxAge: 86400,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const isVercel = process.env.VERCEL === '1';
  if (isVercel) {
    await app.init();
    return app.getHttpAdapter().getInstance();
  }

  const port = process.env.PORT ?? 5000;
  await app.listen(port);
}

const appPromise = bootstrap();

/** Vercel serverless handler: required so Vercel finds an export. */
async function handler(req: Request, res: Response) {
  const expressApp = await appPromise;
  if (expressApp) {
    return expressApp(req, res);
  }
  res.status(503).send('Server not ready');
}

export default handler;

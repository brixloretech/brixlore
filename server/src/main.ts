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
  const origin = process.env.CORS_ORIGIN ?? process.env.FRONTEND_URL;
  if (!origin?.trim()) {
    return ['http://localhost:3000'];
  }
  return origin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    rawBody: true, // required for Stripe webhook signature verification
  });

  const allowedOrigins = getAllowedOrigins();
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    exposedHeaders: [],
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

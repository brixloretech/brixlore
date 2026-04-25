# Prisma migrations workflow

This project uses [Prisma](https://www.prisma.io/) with PostgreSQL. Migrations are stored in `prisma/migrations/`.

## Prerequisites

- PostgreSQL running locally or a connection string (e.g. from a cloud provider).
- Copy `.env.example` to `.env` and set `DATABASE_URL`:

  ```env
  DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=public"
  ```

## Commands

| Command                  | Description                                                                                                                |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `npm run db:generate`    | Generate Prisma Client (also runs after `npm install`).                                                                    |
| `npm run db:migrate:dev` | **Development:** Create a new migration from schema changes and apply it. Use this when you change `prisma/schema.prisma`. |
| `npm run db:migrate`     | **Production:** Apply existing migrations (e.g. in CI or on deploy). Does not create new migrations.                       |
| `npm run db:push`        | Push schema to the DB without creating a migration (prototyping only).                                                     |
| `npm run db:studio`      | Open Prisma Studio to inspect/edit data.                                                                                   |
| `npm run db:seed`        | Run the seed script (`prisma/seed.ts`).                                                                                    |
| `npm run db:reset`       | Reset the database, re-apply all migrations, and run seed (destructive).                                                   |

## Typical workflow

1. **Change the schema**  
   Edit `prisma/schema.prisma` (add/change models, fields, relations).

2. **Create and apply a migration (dev)**

   ```bash
   npm run db:migrate:dev
   ```

   Prisma will prompt for a migration name and then apply it.

3. **Use Prisma Client in services**  
   Inject `PrismaService` (from `src/prisma/prisma.service.ts`) and use `this.prisma.user.findMany()`, etc.

## Baseline (existing database)

If the database was created with `db push` and has no migration history, `migrate deploy` fails with P3005. A baseline migration (`0_baseline`) was added and marked as applied so Prisma treats the current DB as up to date. For new production DBs, run `prisma migrate deploy` to apply all migrations from scratch.

## Production

- Run **only** `npm run db:migrate` (or `prisma migrate deploy`) in production. Do not run `db:migrate:dev` there.
- Ensure `DATABASE_URL` in production points to your PostgreSQL instance.
- Run migrations as part of your deploy step (e.g. before starting the app).

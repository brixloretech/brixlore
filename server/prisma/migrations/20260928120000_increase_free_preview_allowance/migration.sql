-- Free-tier preview allowance is 20 minutes (1,200 seconds).
-- Update existing rows as well as the Prisma schema default for new users.
UPDATE "PreviewAllowance"
SET "totalSeconds" = 1200
WHERE "totalSeconds" < 1200;

ALTER TABLE "issues" ALTER COLUMN "number" TYPE integer USING (number::integer);

-- DropIndex
DROP INDEX "users_nickname_key";

-- AlterTable: add username (nullable — set later once the user verifies their account)
ALTER TABLE "users" ADD COLUMN "username" TEXT;

-- Backfill: carry over any existing nickname value
UPDATE "users" SET "username" = "nickname" WHERE "nickname" IS NOT NULL;

-- AlterTable: drop the columns being replaced
ALTER TABLE "users" DROP COLUMN "display_name",
DROP COLUMN "nickname";

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

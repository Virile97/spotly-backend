-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('EMAIL', 'GOOGLE');

-- DropIndex
DROP INDEX "user_login_info_email_hash_key";

-- DropIndex
DROP INDEX "user_login_info_user_id_key";

-- AlterTable
ALTER TABLE "user_login_info" ADD COLUMN     "auth_provider" "AuthProvider" NOT NULL,
ALTER COLUMN "password_hash" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "user_login_info_user_id_idx" ON "user_login_info"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_login_info_auth_provider_email_hash_key" ON "user_login_info"("auth_provider", "email_hash");

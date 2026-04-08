-- AlterTable
ALTER TABLE "users"
DROP COLUMN "password",
ADD COLUMN "name" TEXT,
ADD COLUMN "google_id" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

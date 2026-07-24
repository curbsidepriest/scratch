/*
  Warnings:

  - Added the required column `user_id` to the `projects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `scratches` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `snippets` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `throughlines` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "scratches_created_at_idx";

-- DropIndex
DROP INDEX "snippets_created_at_idx";

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "scratches" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "snippets" ADD COLUMN     "user_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "throughlines" ADD COLUMN     "user_id" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "projects_user_id_updated_at_idx" ON "projects"("user_id", "updated_at");

-- CreateIndex
CREATE INDEX "scratches_user_id_created_at_idx" ON "scratches"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "snippets_user_id_archived_idx" ON "snippets"("user_id", "archived");

-- CreateIndex
CREATE INDEX "throughlines_user_id_status_idx" ON "throughlines"("user_id", "status");

/*
  Warnings:

  - You are about to drop the column `snippet_id` on the `blocks` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "block_snippets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "block_id" TEXT NOT NULL,
    "snippet_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "block_snippets_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "block_snippets_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT,
    "sort_order" INTEGER NOT NULL,
    "parent_block_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'placeholder',
    CONSTRAINT "blocks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_parent_block_id_fkey" FOREIGN KEY ("parent_block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_blocks" ("body", "id", "kind", "label", "parent_block_id", "project_id", "sort_order") SELECT "body", "id", "kind", "label", "parent_block_id", "project_id", "sort_order" FROM "blocks";
DROP TABLE "blocks";
ALTER TABLE "new_blocks" RENAME TO "blocks";
CREATE INDEX "blocks_project_id_idx" ON "blocks"("project_id");
CREATE INDEX "blocks_parent_block_id_idx" ON "blocks"("parent_block_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "block_snippets_block_id_idx" ON "block_snippets"("block_id");

-- CreateIndex
CREATE UNIQUE INDEX "block_snippets_block_id_snippet_id_key" ON "block_snippets"("block_id", "snippet_id");

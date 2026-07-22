-- CreateTable
CREATE TABLE "scratches" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "label" TEXT,
    "source_mode" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_snippets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "scratch_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_mode" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    CONSTRAINT "snippets_scratch_id_fkey" FOREIGN KEY ("scratch_id") REFERENCES "scratches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_snippets" ("content", "created_at", "id", "source_mode", "word_count") SELECT "content", "created_at", "id", "source_mode", "word_count" FROM "snippets";
DROP TABLE "snippets";
ALTER TABLE "new_snippets" RENAME TO "snippets";
CREATE INDEX "snippets_created_at_idx" ON "snippets"("created_at");
CREATE INDEX "snippets_scratch_id_idx" ON "snippets"("scratch_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "scratches_created_at_idx" ON "scratches"("created_at");

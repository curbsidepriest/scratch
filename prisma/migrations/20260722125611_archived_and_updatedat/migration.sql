-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "throughline_id" TEXT NOT NULL,
    "title" TEXT,
    "draft" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_throughline_id_fkey" FOREIGN KEY ("throughline_id") REFERENCES "throughlines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("created_at", "draft", "id", "throughline_id", "title") SELECT "created_at", "draft", "id", "throughline_id", "title" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_throughline_id_key" ON "projects"("throughline_id");
CREATE TABLE "new_snippets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "scratch_id" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_mode" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    CONSTRAINT "snippets_scratch_id_fkey" FOREIGN KEY ("scratch_id") REFERENCES "scratches" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_snippets" ("content", "created_at", "id", "label", "scratch_id", "sort_order", "source_mode", "word_count") SELECT "content", "created_at", "id", "label", "scratch_id", "sort_order", "source_mode", "word_count" FROM "snippets";
DROP TABLE "snippets";
ALTER TABLE "new_snippets" RENAME TO "snippets";
CREATE INDEX "snippets_created_at_idx" ON "snippets"("created_at");
CREATE INDEX "snippets_scratch_id_idx" ON "snippets"("scratch_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

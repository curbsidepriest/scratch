-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_project_snippets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "snippet_id" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "relation" TEXT NOT NULL DEFAULT 'unsure',
    CONSTRAINT "project_snippets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_snippets_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_project_snippets" ("id", "included", "project_id", "snippet_id") SELECT "id", "included", "project_id", "snippet_id" FROM "project_snippets";
DROP TABLE "project_snippets";
ALTER TABLE "new_project_snippets" RENAME TO "project_snippets";
CREATE INDEX "project_snippets_project_id_idx" ON "project_snippets"("project_id");
CREATE UNIQUE INDEX "project_snippets_project_id_snippet_id_key" ON "project_snippets"("project_id", "snippet_id");
CREATE TABLE "new_projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "throughline_id" TEXT NOT NULL,
    "title" TEXT,
    "draft" TEXT NOT NULL DEFAULT '',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_throughline_id_fkey" FOREIGN KEY ("throughline_id") REFERENCES "throughlines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_projects" ("created_at", "id", "throughline_id", "title") SELECT "created_at", "id", "throughline_id", "title" FROM "projects";
DROP TABLE "projects";
ALTER TABLE "new_projects" RENAME TO "projects";
CREATE UNIQUE INDEX "projects_throughline_id_key" ON "projects"("throughline_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateTable
CREATE TABLE "snippets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_mode" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL
);

-- CreateTable
CREATE TABLE "throughlines" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phrase" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'surfaced',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "throughline_id" TEXT NOT NULL,
    "snippet_id" TEXT NOT NULL,
    "observation" TEXT NOT NULL,
    CONSTRAINT "evidence_throughline_id_fkey" FOREIGN KEY ("throughline_id") REFERENCES "throughlines" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "evidence_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "throughline_id" TEXT NOT NULL,
    "title" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "projects_throughline_id_fkey" FOREIGN KEY ("throughline_id") REFERENCES "throughlines" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "project_snippets" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "snippet_id" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "project_snippets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "project_snippets_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT,
    "sort_order" INTEGER NOT NULL,
    "parent_block_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'placeholder',
    "snippet_id" TEXT,
    CONSTRAINT "blocks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_parent_block_id_fkey" FOREIGN KEY ("parent_block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blocks_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lint_flags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "project_id" TEXT NOT NULL,
    "block_id" TEXT,
    "range" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    CONSTRAINT "lint_flags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lint_flags_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "snippets_created_at_idx" ON "snippets"("created_at");

-- CreateIndex
CREATE INDEX "evidence_throughline_id_idx" ON "evidence"("throughline_id");

-- CreateIndex
CREATE UNIQUE INDEX "projects_throughline_id_key" ON "projects"("throughline_id");

-- CreateIndex
CREATE INDEX "project_snippets_project_id_idx" ON "project_snippets"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_snippets_project_id_snippet_id_key" ON "project_snippets"("project_id", "snippet_id");

-- CreateIndex
CREATE INDEX "blocks_project_id_idx" ON "blocks"("project_id");

-- CreateIndex
CREATE INDEX "blocks_parent_block_id_idx" ON "blocks"("parent_block_id");

-- CreateIndex
CREATE INDEX "lint_flags_project_id_idx" ON "lint_flags"("project_id");

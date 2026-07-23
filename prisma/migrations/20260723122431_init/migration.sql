-- CreateTable
CREATE TABLE "scratches" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "label" TEXT,
    "source_mode" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scratches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "snippets" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "label" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "scratch_id" TEXT,
    "archived" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "source_mode" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,

    CONSTRAINT "snippets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "throughlines" (
    "id" TEXT NOT NULL,
    "phrase" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'surfaced',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "throughlines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "throughline_id" TEXT NOT NULL,
    "snippet_id" TEXT NOT NULL,
    "observation" TEXT NOT NULL,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "throughline_id" TEXT NOT NULL,
    "title" TEXT,
    "draft" TEXT NOT NULL DEFAULT '',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_snippets" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "snippet_id" TEXT NOT NULL,
    "included" BOOLEAN NOT NULL DEFAULT true,
    "relation" TEXT NOT NULL DEFAULT 'unsure',

    CONSTRAINT "project_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blocks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "body" TEXT,
    "sort_order" INTEGER NOT NULL,
    "parent_block_id" TEXT,
    "kind" TEXT NOT NULL DEFAULT 'placeholder',

    CONSTRAINT "blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "block_snippets" (
    "id" TEXT NOT NULL,
    "block_id" TEXT NOT NULL,
    "snippet_id" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "block_snippets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lint_flags" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "block_id" TEXT,
    "range" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',

    CONSTRAINT "lint_flags_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "scratches_created_at_idx" ON "scratches"("created_at");

-- CreateIndex
CREATE INDEX "snippets_created_at_idx" ON "snippets"("created_at");

-- CreateIndex
CREATE INDEX "snippets_scratch_id_idx" ON "snippets"("scratch_id");

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
CREATE INDEX "block_snippets_block_id_idx" ON "block_snippets"("block_id");

-- CreateIndex
CREATE UNIQUE INDEX "block_snippets_block_id_snippet_id_key" ON "block_snippets"("block_id", "snippet_id");

-- CreateIndex
CREATE INDEX "lint_flags_project_id_idx" ON "lint_flags"("project_id");

-- AddForeignKey
ALTER TABLE "snippets" ADD CONSTRAINT "snippets_scratch_id_fkey" FOREIGN KEY ("scratch_id") REFERENCES "scratches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_throughline_id_fkey" FOREIGN KEY ("throughline_id") REFERENCES "throughlines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_throughline_id_fkey" FOREIGN KEY ("throughline_id") REFERENCES "throughlines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_snippets" ADD CONSTRAINT "project_snippets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_snippets" ADD CONSTRAINT "project_snippets_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blocks" ADD CONSTRAINT "blocks_parent_block_id_fkey" FOREIGN KEY ("parent_block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_snippets" ADD CONSTRAINT "block_snippets_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "block_snippets" ADD CONSTRAINT "block_snippets_snippet_id_fkey" FOREIGN KEY ("snippet_id") REFERENCES "snippets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lint_flags" ADD CONSTRAINT "lint_flags_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lint_flags" ADD CONSTRAINT "lint_flags_block_id_fkey" FOREIGN KEY ("block_id") REFERENCES "blocks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

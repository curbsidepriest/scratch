-- Piece deadlines ("on the anvil"): a finish-by date, a lifecycle status, and
-- when it shipped. All additive; existing pieces default to status 'active'.
ALTER TABLE "projects" ADD COLUMN "due_at" TIMESTAMP(3);
ALTER TABLE "projects" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'active';
ALTER TABLE "projects" ADD COLUMN "finished_at" TIMESTAMP(3);

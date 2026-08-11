-- A short, glanceable label for a through-line ("spark"). Additive and
-- nullable: existing rows and user-typed through-lines simply have no title.
ALTER TABLE "throughlines" ADD COLUMN "title" TEXT;

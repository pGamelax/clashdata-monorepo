/*
  Warnings:

  - A unique constraint covering the columns `[user_id,tag]` on the table `clans` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "clans_name_key";

-- DropIndex
DROP INDEX "clans_tag_key";

-- CreateIndex
CREATE INDEX "clans_tag_idx" ON "clans"("tag");

-- CreateIndex
CREATE UNIQUE INDEX "clans_user_id_tag_key" ON "clans"("user_id", "tag");

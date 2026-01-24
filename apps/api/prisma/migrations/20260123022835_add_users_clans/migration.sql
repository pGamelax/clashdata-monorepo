/*
  Warnings:

  - You are about to drop the column `user_id` on the `clans` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[tag]` on the table `clans` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "clans" DROP CONSTRAINT "clans_user_id_fkey";

-- DropIndex
DROP INDEX "clans_user_id_idx";

-- DropIndex
DROP INDEX "clans_user_id_tag_key";

-- AlterTable
ALTER TABLE "clans" DROP COLUMN "user_id";

-- CreateTable
CREATE TABLE "users_clans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_clans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_clans_user_id_idx" ON "users_clans"("user_id");

-- CreateIndex
CREATE INDEX "users_clans_clan_id_idx" ON "users_clans"("clan_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_clans_user_id_clan_id_key" ON "users_clans"("user_id", "clan_id");

-- CreateIndex
CREATE UNIQUE INDEX "clans_tag_key" ON "clans"("tag");

-- AddForeignKey
ALTER TABLE "users_clans" ADD CONSTRAINT "users_clans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users_clans" ADD CONSTRAINT "users_clans_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

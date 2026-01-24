/*
  Warnings:

  - The primary key for the `player_snapshots` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `lastAttackWins` on the `player_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `lastTrophies` on the `player_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `playerName` on the `player_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `playerTag` on the `player_snapshots` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `player_snapshots` table. All the data in the column will be lost.
  - Added the required column `last_trophies` to the `player_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player_name` to the `player_snapshots` table without a default value. This is not possible if the table is not empty.
  - Added the required column `player_tag` to the `player_snapshots` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "player_snapshots_updatedAt_idx";

-- AlterTable
ALTER TABLE "player_snapshots" DROP CONSTRAINT "player_snapshots_pkey",
DROP COLUMN "lastAttackWins",
DROP COLUMN "lastTrophies",
DROP COLUMN "playerName",
DROP COLUMN "playerTag",
DROP COLUMN "updatedAt",
ADD COLUMN     "last_attack_wins" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "last_trophies" INTEGER NOT NULL,
ADD COLUMN     "player_name" TEXT NOT NULL,
ADD COLUMN     "player_tag" VARCHAR(20) NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "player_snapshots_pkey" PRIMARY KEY ("player_tag");

-- CreateIndex
CREATE INDEX "player_snapshots_updated_at_idx" ON "player_snapshots"("updated_at");

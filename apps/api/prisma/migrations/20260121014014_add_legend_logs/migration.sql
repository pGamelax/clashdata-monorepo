-- CreateEnum
CREATE TYPE "LogType" AS ENUM ('ATTACK', 'DEFENSE');

-- CreateTable
CREATE TABLE "legend_logs" (
    "id" SERIAL NOT NULL,
    "player_tag" VARCHAR(20) NOT NULL,
    "player_name" VARCHAR(100) NOT NULL,
    "clan_tag" VARCHAR(20),
    "type" "LogType" NOT NULL,
    "diff" INTEGER NOT NULL,
    "trophies_result" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "legend_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "legend_logs_player_tag_timestamp_idx" ON "legend_logs"("player_tag", "timestamp");

-- CreateIndex
CREATE INDEX "legend_logs_timestamp_idx" ON "legend_logs"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "legend_logs_player_tag_trophies_result_timestamp_key" ON "legend_logs"("player_tag", "trophies_result", "timestamp");

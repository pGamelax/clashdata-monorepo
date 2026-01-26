-- CreateTable
CREATE TABLE "season_configs" (
    "id" TEXT NOT NULL,
    "season_end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "season_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "player_seasons" (
    "id" TEXT NOT NULL,
    "player_tag" VARCHAR(20) NOT NULL,
    "player_name" VARCHAR(100) NOT NULL,
    "clan_tag" VARCHAR(20) NOT NULL,
    "season_id" TEXT NOT NULL,
    "rank" INTEGER,
    "trophies" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "player_seasons_clan_tag_season_id_idx" ON "player_seasons"("clan_tag", "season_id");

-- CreateIndex
CREATE INDEX "player_seasons_season_id_idx" ON "player_seasons"("season_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_seasons_player_tag_season_id_key" ON "player_seasons"("player_tag", "season_id");


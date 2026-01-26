-- CreateTable
CREATE TABLE "season_configs" (
    "id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "is_processed" BOOLEAN NOT NULL DEFAULT false,
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
    "season_id" VARCHAR(255) NOT NULL,
    "rank" INTEGER,
    "trophies" INTEGER NOT NULL,
    "config_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "player_seasons_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "season_configs_scheduled_at_idx" ON "season_configs"("scheduled_at");

-- CreateIndex
CREATE INDEX "player_seasons_clan_tag_season_id_idx" ON "player_seasons"("clan_tag", "season_id");

-- CreateIndex
CREATE INDEX "player_seasons_season_id_idx" ON "player_seasons"("season_id");

-- CreateIndex
CREATE INDEX "player_seasons_config_id_idx" ON "player_seasons"("config_id");

-- CreateIndex
CREATE UNIQUE INDEX "player_seasons_player_tag_season_id_config_id_key" ON "player_seasons"("player_tag", "season_id", "config_id");

-- AddForeignKey
ALTER TABLE "player_seasons" ADD CONSTRAINT "player_seasons_config_id_fkey" FOREIGN KEY ("config_id") REFERENCES "season_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;


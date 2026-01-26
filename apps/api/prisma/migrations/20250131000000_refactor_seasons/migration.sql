-- Refatorar SeasonConfig para usar seasonId (previousSeason.id)
ALTER TABLE "season_configs" 
  ADD COLUMN IF NOT EXISTS "season_id" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "is_processed" BOOLEAN DEFAULT false;

-- Criar índice único para season_id
CREATE UNIQUE INDEX IF NOT EXISTS "season_configs_season_id_key" ON "season_configs"("season_id");

-- Adicionar clanRank em PlayerSeason
ALTER TABLE "player_seasons" 
  ADD COLUMN IF NOT EXISTS "clan_rank" INTEGER;

-- Atualizar dados existentes (se houver)
-- Para dados antigos, vamos gerar um seasonId baseado na data
UPDATE "season_configs" 
SET "season_id" = TO_CHAR("season_end_date", 'YYYY-MM-DD')
WHERE "season_id" IS NULL;

-- Remover constraint antiga se existir
ALTER TABLE "player_seasons" 
  DROP CONSTRAINT IF EXISTS "player_seasons_season_id_fkey";

-- Criar nova constraint usando season_id da SeasonConfig
ALTER TABLE "player_seasons" 
  ADD CONSTRAINT "player_seasons_season_id_fkey" 
  FOREIGN KEY ("season_id") REFERENCES "season_configs"("season_id") ON DELETE CASCADE;


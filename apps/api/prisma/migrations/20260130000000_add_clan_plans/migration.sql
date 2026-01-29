-- CreateTable
CREATE TABLE "clan_plans" (
    "id" TEXT NOT NULL,
    "clan_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "activated_at" TIMESTAMP(3),
    "activated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clan_plans_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clan_plans_clan_id_key" ON "clan_plans"("clan_id");

-- CreateIndex
CREATE INDEX "clan_plans_clan_id_idx" ON "clan_plans"("clan_id");

-- CreateIndex
CREATE INDEX "clan_plans_is_active_idx" ON "clan_plans"("is_active");

-- AddForeignKey
ALTER TABLE "clan_plans" ADD CONSTRAINT "clan_plans_clan_id_fkey" FOREIGN KEY ("clan_id") REFERENCES "clans"("id") ON DELETE CASCADE ON UPDATE CASCADE;


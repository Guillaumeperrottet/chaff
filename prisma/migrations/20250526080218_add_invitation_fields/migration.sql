ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "inviteCode" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "planType" TEXT DEFAULT 'FREE';
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "tempOrganizationId" TEXT;

-- Créer un index pour optimiser les recherches par code d'invitation
CREATE INDEX IF NOT EXISTS "user_inviteCode_key" ON "user"("inviteCode");

-- Optionnel: Nettoyer les anciennes données metadata si nécessaire
UPDATE "user" SET "metadata" = NULL WHERE "metadata" IS NOT NULL;
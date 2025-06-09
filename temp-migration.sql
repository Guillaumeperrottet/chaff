-- Migration complète pour recréer l'enum PlanType
-- Étape 1: Créer un nouveau type temporaire
CREATE TYPE "PlanType_new" AS ENUM ('FREE', 'PREMIUM', 'SUPER_ADMIN', 'ILLIMITE', 'CUSTOM');

-- Étape 2: Ajouter une colonne temporaire
ALTER TABLE "Plan" ADD COLUMN "name_new" "PlanType_new";

-- Étape 3: Migrer les données avec mapping
UPDATE "Plan" SET "name_new" = 
  CASE 
    WHEN "name" = 'FREE' THEN 'FREE'::"PlanType_new"
    WHEN "name" = 'PROFESSIONAL' THEN 'PREMIUM'::"PlanType_new"
    WHEN "name" = 'SUPER_ADMIN' THEN 'SUPER_ADMIN'::"PlanType_new"
    WHEN "name" = 'ILLIMITE' THEN 'ILLIMITE'::"PlanType_new"
    WHEN "name" = 'CUSTOM' THEN 'CUSTOM'::"PlanType_new"
    ELSE 'FREE'::"PlanType_new"
  END;

-- Étape 4: Supprimer l'ancienne colonne
ALTER TABLE "Plan" DROP COLUMN "name";

-- Étape 5: Renommer la nouvelle colonne
ALTER TABLE "Plan" RENAME COLUMN "name_new" TO "name";

-- Étape 6: Supprimer l'ancien type
DROP TYPE "PlanType";

-- Étape 7: Renommer le nouveau type
ALTER TYPE "PlanType_new" RENAME TO "PlanType";

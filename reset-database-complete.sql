-- Script pour nettoyer complètement la base de données en gardant seulement les plans
-- ⚠️  ATTENTION: Ce script supprime TOUTES les données sauf les plans !
-- À utiliser seulement en développement ou pour un reset complet

-- 1. Supprimer toutes les données liées aux mandats
DELETE FROM "day_values";
DELETE FROM "manual_payroll_entries";
DELETE FROM "payroll_summaries";
DELETE FROM "payroll_data";
DELETE FROM "time_entries";
DELETE FROM "employees";
DELETE FROM "payroll_import_history";
DELETE FROM "payroll_import_employees";
DELETE FROM "gastrotime_imports";
DELETE FROM "mandates";

-- 2. Supprimer les données d'organisation et utilisateurs
DELETE FROM "storage_usage";
DELETE FROM "plan_change_audit";
DELETE FROM "subscription";
DELETE FROM "invitation_code";
DELETE FROM "organization_user";
DELETE FROM "organization";

-- 3. Supprimer les données d'authentification
DELETE FROM "session";
DELETE FROM "account";
DELETE FROM "verification";
DELETE FROM "pending_user";

-- 4. Supprimer les notifications
DELETE FROM "device_tokens";
DELETE FROM "notification";

-- 5. Supprimer les utilisateurs
DELETE FROM "user";

-- ✅ Les plans restent intacts dans la table "Plan"
-- Vous pouvez maintenant recommencer avec des données propres

-- Pour vérifier ce qui reste :
-- SELECT name, "maxMandates", "maxUsers" FROM "Plan";

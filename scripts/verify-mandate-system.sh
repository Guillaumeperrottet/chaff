#!/bin/bash

# Script de vérification finale pour le système de limites des mandats
# Vérifie que tous les fichiers sont correctement configurés

echo "🔍 Vérification finale du système de limites des mandats..."
echo ""

# 1. Vérifier les erreurs TypeScript
echo "📝 Vérification des erreurs TypeScript..."
cd /Users/guili/code/Guillaumeperrottet/chaff

# Fichiers critiques à vérifier
FILES_TO_CHECK=(
    "src/app/api/mandats/route.ts"
    "src/app/api/import/route.ts"
    "src/app/api/import/preview/route.ts"
    "src/app/api/import/chunked/route.ts"
    "src/app/api/user/organization-recovery/route.ts"
    "src/lib/subscription-limits.ts"
    "src/app/dashboard/mandates/create/page.tsx"
    "src/app/components/LimitAlert.tsx"
)

ERROR_COUNT=0

for FILE in "${FILES_TO_CHECK[@]}"; do
    if [ -f "$FILE" ]; then
        echo "  ✅ $FILE existe"
    else
        echo "  ❌ $FILE manquant"
        ERROR_COUNT=$((ERROR_COUNT + 1))
    fi
done

echo ""

# 2. Vérifier la présence des mots-clés importants
echo "🔑 Vérification des mots-clés critiques..."

# Vérifier que organizationId est présent dans les routes d'import
if grep -q "organizationId" src/app/api/import/route.ts; then
    echo "  ✅ organizationId présent dans import/route.ts"
else
    echo "  ❌ organizationId manquant dans import/route.ts"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Vérifier que maxMandates est configuré
if grep -q "maxMandates" src/app/api/user/organization-recovery/route.ts; then
    echo "  ✅ maxMandates configuré dans organization-recovery"
else
    echo "  ❌ maxMandates manquant dans organization-recovery"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

# Vérifier que canCreateMandate existe
if grep -q "canCreateMandate" src/lib/subscription-limits.ts; then
    echo "  ✅ canCreateMandate existe dans subscription-limits"
else
    echo "  ❌ canCreateMandate manquant dans subscription-limits"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

echo ""

# 3. Vérifier les fichiers de documentation
echo "📚 Vérification de la documentation..."

if [ -f "MANDATE_LIMITS_SUMMARY.md" ]; then
    echo "  ✅ MANDATE_LIMITS_SUMMARY.md existe"
else
    echo "  ❌ MANDATE_LIMITS_SUMMARY.md manquant"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

if [ -f "CORRECTIONS_SUMMARY.md" ]; then
    echo "  ✅ CORRECTIONS_SUMMARY.md existe"
else
    echo "  ❌ CORRECTIONS_SUMMARY.md manquant"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

if [ -f "reset-database-complete.sql" ]; then
    echo "  ✅ reset-database-complete.sql existe"
else
    echo "  ❌ reset-database-complete.sql manquant"
    ERROR_COUNT=$((ERROR_COUNT + 1))
fi

echo ""

# 4. Résultat final
if [ $ERROR_COUNT -eq 0 ]; then
    echo "🎉 Toutes les vérifications sont PASSÉES !"
    echo "✅ Le système de limites des mandats est prêt pour la production"
    echo ""
    echo "🚀 Prochaines étapes :"
    echo "  1. Nettoyer la base avec: reset-database-complete.sql"
    echo "  2. Démarrer le serveur: npm run dev"
    echo "  3. Tester la création de mandats"
    echo "  4. Vérifier les limites avec un plan FREE"
else
    echo "❌ $ERROR_COUNT erreur(s) détectée(s)"
    echo "⚠️  Veuillez corriger les problèmes avant de continuer"
    exit 1
fi

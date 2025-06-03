#!/bin/bash

echo "🔧 Fixing route casing issues..."

# Étape 1: Renommer temporairement
echo "📝 Step 1: Renaming to temporary names..."
git mv src/app/dashboard/DayValues src/app/dashboard/dayvalues_temp
git mv src/app/dashboard/Mandates src/app/dashboard/mandates_temp

# Commit intermédiaire
git add .
git commit -m "chore: rename folders to temporary names (step 1/2)"

# Étape 2: Renommer vers noms finaux
echo "📝 Step 2: Renaming to final lowercase names..."
git mv src/app/dashboard/dayvalues_temp src/app/dashboard/dayvalues
git mv src/app/dashboard/mandates_temp src/app/dashboard/mandates

# Étape 3: Gérer les sous-dossiers
echo "📝 Step 3: Fixing subfolder casing..."
git mv src/app/dashboard/dayvalues/Create src/app/dashboard/dayvalues/create_temp
git mv src/app/dashboard/dayvalues/create_temp src/app/dashboard/dayvalues/create

git mv src/app/dashboard/mandates/Create src/app/dashboard/mandates/create_temp
git mv src/app/dashboard/mandates/create_temp src/app/dashboard/mandates/create

# Commit final
git add .
git commit -m "fix: standardize all route folders to lowercase (step 2/2)"

echo "✅ Done! Verifying..."
git ls-files | grep -E "(dayvalues|mandates|create)"

echo "🚀 Don't forget to: git push origin main"
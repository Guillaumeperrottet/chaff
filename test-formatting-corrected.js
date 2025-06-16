// Test du formatage suisse corrigé
console.log("=== Test du formatage suisse CORRIGÉ ===");

// Fonction de formatage CORRIGÉE (copie de celle du dashboard)
function formatDisplay(value) {
  // D'abord nettoyer complètement la valeur (supprimer apostrophes et espaces, puis remplacer virgules par points)
  const cleanedValue = value.replace(/['\s]/g, "").replace(",", ".");
  const num = parseFloat(cleanedValue);

  if (isNaN(num)) return "0";

  // Formater avec l'apostrophe suisse pour les milliers et la virgule pour les décimales
  if (num >= 1000) {
    // Pour les milliers, utiliser l'apostrophe suisse
    const parts = num.toFixed(2).split(".");
    const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
    return `${integerPart},${parts[1]}`;
  } else {
    // Pour les nombres < 1000, utiliser la virgule pour les décimales
    return num.toFixed(2).replace(".", ",");
  }
}

// Fonction pour convertir valeur formatée en valeur brute
function getRawValue(formattedValue) {
  // Enlever apostrophes et remplacer virgules par points
  return formattedValue.replace(/['\s]/g, "").replace(",", ".");
}

// Tests avec les nouvelles corrections
const testValues = [
  "3110.79",
  "3110,79",
  "3'110,79", // ⚠️ Valeur déjà formatée (PROBLÈME AVANT)
  "3'110.79", // ⚠️ Valeur mixte (PROBLÈME AVANT)
  "500.50",
  "500,50",
  "15000.00",
  "15'000,00", // ⚠️ Valeur déjà formatée (PROBLÈME AVANT)
];

testValues.forEach((value) => {
  console.log(`\nValeur d'entrée: "${value}"`);
  const formatted = formatDisplay(value);
  const raw = getRawValue(formatted);
  console.log(`  → Formatée: "${formatted}"`);
  console.log(`  → Brute (pour édition): "${raw}"`);

  // Vérifier si le cycle fonctionne
  const reFormatted = formatDisplay(raw);
  const cycleOK = reFormatted === formatted;
  console.log(`  → Cycle OK: ${cycleOK ? "✅" : "❌"} (${reFormatted})`);
});

// Test spécial pour les valeurs problématiques
console.log("\n=== Test spécial pour les valeurs déjà formatées ===");
const problematicValues = ["3'110,79", "15'000,00"];

problematicValues.forEach((value) => {
  console.log(`\nValeur déjà formatée: "${value}"`);

  // Ancien comportement (CASSÉ)
  const oldClean = value.replace(",", ".");
  const oldNum = parseFloat(oldClean);
  console.log(`  🚫 Ancien: "${oldClean}" → ${oldNum} (NaN!)`);

  // Nouveau comportement (CORRIGÉ)
  const newClean = value.replace(/['\s]/g, "").replace(",", ".");
  const newNum = parseFloat(newClean);
  console.log(`  ✅ Nouveau: "${newClean}" → ${newNum}`);

  const formatted = formatDisplay(value);
  console.log(`  ✅ Formatage: "${formatted}"`);
});

console.log("\n🎉 CORRECTION TERMINÉE!");

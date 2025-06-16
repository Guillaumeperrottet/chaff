// Test du formatage suisse
console.log("=== Test du formatage suisse ===");

// Fonction de formatage (copie de celle du dashboard)
function formatDisplay(value) {
  // D'abord normaliser la valeur en remplaçant les virgules par des points
  const normalizedValue = value.replace(",", ".");
  const num = parseFloat(normalizedValue);

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

// Tests
const testValues = [
  "3110.79",
  "3110,79",
  "3'110,79",
  "3'110.79",
  "500.50",
  "500,50",
  "15000.00",
];

testValues.forEach((value) => {
  console.log(`\nValeur d'entrée: "${value}"`);
  console.log(`Formatée: "${formatDisplay(value)}"`);
  console.log(`Brute (pour édition): "${getRawValue(formatDisplay(value))}"`);
});

// Test du processus complet
console.log("\n=== Test du processus complet ===");
const originalValue = "3110.79";
console.log(`1. Valeur originale: ${originalValue}`);

const displayed = formatDisplay(originalValue);
console.log(`2. Affichée: ${displayed}`);

const forEditing = getRawValue(displayed);
console.log(`3. Pour édition: ${forEditing}`);

const backToDisplay = formatDisplay(forEditing);
console.log(`4. Retour à l'affichage: ${backToDisplay}`);

console.log(
  `✅ Cycle complet: ${originalValue} → ${displayed} → ${forEditing} → ${backToDisplay}`
);

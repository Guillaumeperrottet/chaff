// Test rapide du parsing corrigé
const testValues = ["3110.79", "3'110,79", "15'000,00"];

testValues.forEach((value) => {
  const old = parseFloat(value.replace(",", "."));
  const new_ = parseFloat(value.replace(/['\s]/g, "").replace(",", "."));
  console.log(`${value} → Ancien: ${old} | Nouveau: ${new_}`);
});

console.log(
  "\n✅ Corrections appliquées pour les fonctions de calcul des totaux!"
);

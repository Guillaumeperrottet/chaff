// Script pour vérifier si toutes les routes API filtrent correctement par organizationId
import * as fs from "fs";
import * as path from "path";

const apiDir = path.join(process.cwd(), "src/app/api");

// Liste des fichiers à vérifier
const routesToCheck = [
  "dashboard/stats/route.ts",
  "dashboard/data/route.ts",
  "dashboard/best-day-global/route.ts",
  "dashboard/best-days-by-group/route.ts",
  "dashboard/payroll-ratios/route.ts",
  "dashboard/update-value/route.ts",
];

console.log("🔍 Vérification des filtres organizationId dans les routes API\n");
console.log("=".repeat(80));

for (const route of routesToCheck) {
  const filePath = path.join(apiDir, route);

  try {
    const content = fs.readFileSync(filePath, "utf-8");

    // Vérifier si le fichier récupère l'organizationId
    const hasOrgIdRetrieval =
      content.includes("organizationId") &&
      (content.includes("user.organizationId") ||
        content.includes("session.user.organizationId"));

    // Vérifier si les requêtes Prisma filtrent par organizationId
    const hasPrismaQueries = content.match(
      /prisma\.\w+\.(findMany|findUnique|findFirst|aggregate)/g
    );
    const hasOrgIdFilter =
      content.includes("organizationId:") ||
      content.includes("organizationId =") ||
      content.includes("mandate: { organizationId");

    console.log(`\n📄 ${route}`);
    console.log(
      `   Récupère organizationId: ${hasOrgIdRetrieval ? "✅" : "❌"}`
    );
    console.log(
      `   A des requêtes Prisma: ${hasPrismaQueries ? `✅ (${hasPrismaQueries.length})` : "❌"}`
    );
    console.log(
      `   Filtre par organizationId: ${hasOrgIdFilter ? "✅" : "❌"}`
    );

    if (hasPrismaQueries && !hasOrgIdFilter) {
      console.log(
        `   ⚠️  ATTENTION: Ce fichier fait des requêtes sans filtrer par organizationId!`
      );
    }
  } catch (error) {
    console.log(`\n❌ Erreur lors de la lecture de ${route}:`, error);
  }
}

console.log("\n" + "=".repeat(80));
console.log("✅ Vérification terminée\n");

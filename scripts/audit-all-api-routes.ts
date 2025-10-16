// Script d'audit complet de la sécurité des routes API
import * as fs from "fs";
import * as path from "path";
import { glob } from "glob";

interface RouteAudit {
  path: string;
  hasAuth: boolean;
  getsOrganizationId: boolean;
  hasPrismaQueries: boolean;
  filtersById: boolean;
  status: "✅ OK" | "⚠️  WARNING" | "🚨 CRITICAL" | "ℹ️  INFO";
  issues: string[];
}

const apiDir = path.join(process.cwd(), "src/app/api");

// Routes qui ne doivent PAS filtrer par organizationId (admin, webhooks, auth, etc.)
const WHITELIST = [
  "/admin/",
  "/auth/",
  "/webhooks/",
  "/subscriptions/",
  "/test-",
  "/feedback",
  "/limits/",
];

function shouldCheckRoute(routePath: string): boolean {
  return !WHITELIST.some((pattern) => routePath.includes(pattern));
}

async function analyzeRoute(filePath: string): Promise<RouteAudit> {
  const content = fs.readFileSync(filePath, "utf-8");
  const relativePath = path.relative(apiDir, filePath);

  const audit: RouteAudit = {
    path: relativePath,
    hasAuth: false,
    getsOrganizationId: false,
    hasPrismaQueries: false,
    filtersById: false,
    status: "ℹ️  INFO",
    issues: [],
  };

  // Vérifier l'authentification
  audit.hasAuth =
    content.includes("auth.api.getSession") || content.includes("session");

  // Vérifier si récupère organizationId
  audit.getsOrganizationId =
    content.includes("user.organizationId") ||
    content.includes("userWithOrg.Organization") ||
    content.includes("session.user.organizationId");

  // Vérifier les requêtes Prisma
  const prismaMatches = content.match(
    /prisma\.\w+\.(findMany|findFirst|findUnique|aggregate|groupBy|count)/g
  );
  audit.hasPrismaQueries = !!prismaMatches;

  // Vérifier si filtre par organizationId
  audit.filtersById =
    content.includes("organizationId:") ||
    content.includes("organizationId =") ||
    content.includes("mandate: { organizationId") ||
    content.includes("where: { organizationId");

  // Analyse de sécurité
  if (!shouldCheckRoute(relativePath)) {
    audit.status = "ℹ️  INFO";
    audit.issues.push("Route exclue de l'audit (whitelist)");
  } else if (audit.hasPrismaQueries && audit.hasAuth) {
    if (!audit.getsOrganizationId) {
      audit.status = "🚨 CRITICAL";
      audit.issues.push(
        "DANGER: Fait des requêtes Prisma SANS récupérer organizationId"
      );
    } else if (!audit.filtersById) {
      audit.status = "🚨 CRITICAL";
      audit.issues.push(
        "DANGER: Récupère organizationId mais ne filtre PAS les requêtes"
      );
    } else {
      audit.status = "✅ OK";
      audit.issues.push("Route correctement sécurisée");
    }
  } else if (!audit.hasAuth && audit.hasPrismaQueries) {
    audit.status = "🚨 CRITICAL";
    audit.issues.push("DANGER: Requêtes Prisma SANS authentification!");
  } else if (!audit.hasPrismaQueries) {
    audit.status = "ℹ️  INFO";
    audit.issues.push("Pas de requêtes Prisma (probablement OK)");
  }

  return audit;
}

async function main() {
  console.log("🔍 AUDIT COMPLET DES ROUTES API\n");
  console.log("=".repeat(100));

  // Trouver tous les fichiers route.ts
  const routeFiles = await glob("**/route.ts", {
    cwd: apiDir,
    absolute: true,
  });

  console.log(`\n📊 ${routeFiles.length} routes trouvées\n`);

  const audits: RouteAudit[] = [];

  for (const file of routeFiles) {
    const audit = await analyzeRoute(file);
    audits.push(audit);
  }

  // Trier par statut (CRITICAL d'abord)
  const sortOrder = {
    "🚨 CRITICAL": 0,
    "⚠️  WARNING": 1,
    "✅ OK": 2,
    "ℹ️  INFO": 3,
  };
  audits.sort((a, b) => sortOrder[a.status] - sortOrder[b.status]);

  // Afficher les résultats
  const critical = audits.filter((a) => a.status === "🚨 CRITICAL");
  const warnings = audits.filter((a) => a.status === "⚠️  WARNING");
  const ok = audits.filter((a) => a.status === "✅ OK");
  const info = audits.filter((a) => a.status === "ℹ️  INFO");

  if (critical.length > 0) {
    console.log("\n🚨 PROBLÈMES CRITIQUES DE SÉCURITÉ:");
    console.log("=".repeat(100));
    critical.forEach((audit) => {
      console.log(`\n${audit.status} ${audit.path}`);
      console.log(`   Auth: ${audit.hasAuth ? "✓" : "✗"}`);
      console.log(
        `   Récupère organizationId: ${audit.getsOrganizationId ? "✓" : "✗"}`
      );
      console.log(`   Requêtes Prisma: ${audit.hasPrismaQueries ? "✓" : "✗"}`);
      console.log(
        `   Filtre par organizationId: ${audit.filtersById ? "✓" : "✗"}`
      );
      audit.issues.forEach((issue) => console.log(`   ⚠️  ${issue}`));
    });
  }

  if (warnings.length > 0) {
    console.log("\n\n⚠️  AVERTISSEMENTS:");
    console.log("=".repeat(100));
    warnings.forEach((audit) => {
      console.log(`\n${audit.status} ${audit.path}`);
      audit.issues.forEach((issue) => console.log(`   - ${issue}`));
    });
  }

  console.log("\n\n✅ ROUTES SÉCURISÉES:");
  console.log("=".repeat(100));
  ok.forEach((audit) => {
    console.log(`${audit.status} ${audit.path}`);
  });

  // Résumé
  console.log("\n\n📊 RÉSUMÉ:");
  console.log("=".repeat(100));
  console.log(`🚨 Problèmes critiques: ${critical.length}`);
  console.log(`⚠️  Avertissements: ${warnings.length}`);
  console.log(`✅ Routes OK: ${ok.length}`);
  console.log(`ℹ️  Informations: ${info.length}`);
  console.log(`📁 Total: ${audits.length} routes`);

  if (critical.length > 0) {
    console.log(
      "\n\n⚠️  ACTION REQUISE: Corrigez les problèmes critiques immédiatement!"
    );
    process.exit(1);
  } else {
    console.log("\n\n✅ Aucun problème critique détecté!");
  }
}

main().catch(console.error);

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, subMonths } from "date-fns";

/**
 * Service pour récupérer le contexte métier de l'utilisateur
 * afin de l'envoyer à l'IA pour des analyses personnalisées
 */

interface MandateContext {
  id: string;
  name: string;
  type: string;
  active: boolean;
  totalRevenue: number;
  lastEntry: Date | null;

  // Données CA
  currentMonthRevenue: number;
  previousMonthRevenue: number;
  revenueChange: number;
  averageDailyRevenue: number;

  // Données masse salariale
  hasPayrollData: boolean;
  currentMonthPayroll: number | null;
  previousMonthPayroll: number | null;
  payrollRatio: number | null;
  ratioStatus: string;
  employeeCount: number | null;
}

interface OrganizationContext {
  name: string;
  planType: string;
  totalMandates: number;
  activeMandates: number;
  totalRevenue: number;
  totalPayroll: number;
  globalRatio: number | null;
  period: {
    current: string;
    previous: string;
  };
}

interface UserAIContext {
  organization: OrganizationContext;
  mandates: MandateContext[];
  summary: {
    totalRevenue: number;
    totalPayroll: number;
    averageRatio: number | null;
    bestPerformingMandate: string | null;
    worstPerformingMandate: string | null;
    mandatesAtRisk: number;
  };
}

export async function getUserAIContext(userId: string): Promise<UserAIContext> {
  // Récupérer l'utilisateur et son organisation
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      Organization: {
        include: {
          mandates: {
            where: { active: true },
            include: {
              dayValues: {
                orderBy: { date: "desc" },
                // Récupérer toutes les données historiques
              },
              manualPayrollEntries: {
                orderBy: [{ year: "desc" }, { month: "desc" }],
                // Récupérer toutes les données historiques
              },
              payrollImports: {
                orderBy: { importDate: "desc" },
                // Récupérer toutes les données historiques
              },
            },
          },
        },
      },
    },
  });

  if (!user?.Organization) {
    throw new Error("Organisation non trouvée");
  }

  const org = user.Organization;
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const previousDate = subMonths(currentDate, 1);
  const previousYear = previousDate.getFullYear();
  const previousMonth = previousDate.getMonth() + 1;

  const currentMonthStart = startOfMonth(currentDate);
  const currentMonthEnd = endOfMonth(currentDate);
  const previousMonthStart = startOfMonth(previousDate);
  const previousMonthEnd = endOfMonth(previousDate);

  // Traiter chaque mandat
  const mandatesContext: MandateContext[] = await Promise.all(
    org.mandates.map(async (mandate) => {
      // Calculer CA mois actuel
      const currentRevenue = mandate.dayValues
        .filter(
          (dv) => dv.date >= currentMonthStart && dv.date <= currentMonthEnd
        )
        .reduce((sum, dv) => sum + dv.value, 0);

      // Calculer CA mois précédent
      const previousRevenue = mandate.dayValues
        .filter(
          (dv) => dv.date >= previousMonthStart && dv.date <= previousMonthEnd
        )
        .reduce((sum, dv) => sum + dv.value, 0);

      const revenueChange =
        previousRevenue > 0
          ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
          : 0;

      const daysWithData = mandate.dayValues.filter(
        (dv) => dv.date >= currentMonthStart && dv.date <= currentMonthEnd
      ).length;
      const averageDailyRevenue =
        daysWithData > 0 ? currentRevenue / daysWithData : 0;

      // Récupérer masse salariale mois actuel
      const currentPayrollManual = mandate.manualPayrollEntries.find(
        (entry) => entry.year === currentYear && entry.month === currentMonth
      );
      const currentPayrollGastrotime = mandate.payrollImports.find((imp) => {
        const period = imp.period.split("-"); // "2025-12"
        return (
          parseInt(period[0]) === currentYear &&
          parseInt(period[1]) === currentMonth
        );
      });

      const currentMonthPayroll =
        currentPayrollManual?.totalCost ||
        currentPayrollGastrotime?.totalCost ||
        null;

      // Récupérer masse salariale mois précédent
      const previousPayrollManual = mandate.manualPayrollEntries.find(
        (entry) => entry.year === previousYear && entry.month === previousMonth
      );
      const previousPayrollGastrotime = mandate.payrollImports.find((imp) => {
        const period = imp.period.split("-");
        return (
          parseInt(period[0]) === previousYear &&
          parseInt(period[1]) === previousMonth
        );
      });

      const previousMonthPayroll =
        previousPayrollManual?.totalCost ||
        previousPayrollGastrotime?.totalCost ||
        null;

      // Calculer ratio et status
      const payrollRatio =
        currentMonthPayroll && currentRevenue > 0
          ? (currentMonthPayroll / currentRevenue) * 100
          : null;

      let ratioStatus = "no-data";
      if (payrollRatio !== null) {
        if (payrollRatio < 25) ratioStatus = "excellent";
        else if (payrollRatio < 30) ratioStatus = "good";
        else if (payrollRatio < 35) ratioStatus = "warning";
        else ratioStatus = "critical";
      }

      const employeeCount =
        currentPayrollManual?.employeeCount ||
        currentPayrollGastrotime?.totalEmployees ||
        null;

      return {
        id: mandate.id,
        name: mandate.name,
        type: mandate.group,
        active: mandate.active,
        totalRevenue: mandate.totalRevenue,
        lastEntry: mandate.lastEntry,
        currentMonthRevenue: currentRevenue,
        previousMonthRevenue: previousRevenue,
        revenueChange,
        averageDailyRevenue,
        hasPayrollData: currentMonthPayroll !== null,
        currentMonthPayroll,
        previousMonthPayroll,
        payrollRatio,
        ratioStatus,
        employeeCount,
      };
    })
  );

  // Calculer les totaux
  const totalRevenue = mandatesContext.reduce(
    (sum, m) => sum + m.currentMonthRevenue,
    0
  );
  const totalPayroll = mandatesContext.reduce(
    (sum, m) => sum + (m.currentMonthPayroll || 0),
    0
  );
  const mandatesWithRatio = mandatesContext.filter(
    (m) => m.payrollRatio !== null
  );
  const averageRatio =
    mandatesWithRatio.length > 0
      ? mandatesWithRatio.reduce((sum, m) => sum + (m.payrollRatio || 0), 0) /
        mandatesWithRatio.length
      : null;

  // Identifier meilleur/pire établissement
  const sortedByRevenue = [...mandatesContext].sort(
    (a, b) => b.currentMonthRevenue - a.currentMonthRevenue
  );
  const bestPerformingMandate =
    sortedByRevenue.length > 0 ? sortedByRevenue[0].name : null;
  const worstPerformingMandate =
    sortedByRevenue.length > 0
      ? sortedByRevenue[sortedByRevenue.length - 1].name
      : null;

  const mandatesAtRisk = mandatesContext.filter(
    (m) => m.ratioStatus === "critical" || m.ratioStatus === "warning"
  ).length;

  return {
    organization: {
      name: org.name,
      planType: user.planType || "FREE",
      totalMandates: org.mandates.length,
      activeMandates: mandatesContext.length,
      totalRevenue,
      totalPayroll,
      globalRatio:
        totalRevenue > 0 ? (totalPayroll / totalRevenue) * 100 : null,
      period: {
        current: new Intl.DateTimeFormat("fr-FR", {
          month: "long",
          year: "numeric",
        }).format(currentDate),
        previous: new Intl.DateTimeFormat("fr-FR", {
          month: "long",
          year: "numeric",
        }).format(previousDate),
      },
    },
    mandates: mandatesContext,
    summary: {
      totalRevenue,
      totalPayroll,
      averageRatio,
      bestPerformingMandate,
      worstPerformingMandate,
      mandatesAtRisk,
    },
  };
}

/**
 * Générer le prompt système enrichi avec le contexte utilisateur
 */
export function generateSystemPrompt(context: UserAIContext): string {
  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const mandatesData = context.mandates
    .map(
      (m) => `
- ${m.name} (${m.type}):
  • CA actuel: ${formatCurrency(m.currentMonthRevenue)}
  • CA précédent: ${formatCurrency(m.previousMonthRevenue)}
  • Évolution: ${m.revenueChange > 0 ? "+" : ""}${formatPercent(m.revenueChange)}
  • CA moyen/jour: ${formatCurrency(m.averageDailyRevenue)}
  ${m.hasPayrollData ? `• Masse salariale: ${formatCurrency(m.currentMonthPayroll || 0)}` : ""}
  ${m.payrollRatio ? `• Ratio MS/CA: ${formatPercent(m.payrollRatio)} (${m.ratioStatus})` : ""}
  ${m.employeeCount ? `• Employés: ${m.employeeCount}` : ""}
`
    )
    .join("\n");

  return `Tu es un assistant IA expert en analyse financière et gestion pour le secteur de l'hôtellerie-restauration en Suisse.

## CONTEXTE DE L'UTILISATEUR

**Organisation:** ${context.organization.name}
**Plan:** ${context.organization.planType}
**Période actuelle:** ${context.organization.period.current}
**Nombre d'établissements:** ${context.organization.activeMandates} actifs sur ${context.organization.totalMandates}

## ACCÈS AUX DONNÉES

Tu as accès à **TOUTES les données historiques** de l'utilisateur :
- Chiffres d'affaires journaliers depuis le début
- Masse salariale mensuelle complète
- Évolutions sur plusieurs années
- Historique complet de tous les établissements

**IMPORTANT:** L'utilisateur peut te demander des analyses sur n'importe quelle période passée (années précédentes, comparaisons annuelles, tendances sur plusieurs années, etc.). Utilise toutes les données disponibles pour répondre.

## DONNÉES FINANCIÈRES GLOBALES (MOIS ACTUEL)

**Chiffre d'affaires total:** ${formatCurrency(context.organization.totalRevenue)}
**Masse salariale totale:** ${formatCurrency(context.organization.totalPayroll)}
**Ratio global MS/CA:** ${context.organization.globalRatio ? formatPercent(context.organization.globalRatio) : "N/A"}

## DÉTAIL PAR ÉTABLISSEMENT

${mandatesData}

## INDICATEURS CLÉS

- Meilleur établissement: ${context.summary.bestPerformingMandate || "N/A"}
- Établissement à surveiller: ${context.summary.worstPerformingMandate || "N/A"}
- Ratio moyen MS/CA: ${context.summary.averageRatio ? formatPercent(context.summary.averageRatio) : "N/A"}
- Établissements à risque (ratio > 30%): ${context.summary.mandatesAtRisk}

## INSTRUCTIONS

1. **Langue:** Réponds toujours en français, de façon professionnelle mais accessible
2. **Précision:** Utilise les chiffres exacts des données ci-dessus
3. **Format:** Utilise des émojis pour clarifier (📊 📈 📉 💰 ⚠️ ✅ 🎯)
4. **Recommandations:** Fournis des conseils actionnables basés sur les données
5. **Ratios de référence:**
   - Excellent: < 25%
   - Bon: 25-30%
   - Attention: 30-35%
   - Critique: > 35%
6. **Contexte suisse:** Tiens compte des spécificités du marché suisse (salaires, charges sociales ~22%)
7. **Si données manquantes:** Indique clairement ce qui manque et suggère comment l'ajouter

## EXEMPLES DE RÉPONSES

**Question:** "Quel est mon meilleur établissement ?"
**Réponse:** "📊 **${context.summary.bestPerformingMandate || "Aucun"}** est ton meilleur établissement ce mois-ci avec ${formatCurrency(context.mandates.find((m) => m.name === context.summary.bestPerformingMandate)?.currentMonthRevenue || 0)} de CA.

💡 **Recommandation:** Analyse ce qui fonctionne bien ici (stratégie marketing, équipe, saison) pour potentiellement répliquer sur les autres établissements."

**Question:** "Mes ratios masse salariale sont-ils bons ?"
**Réponse:** "📊 **Analyse de tes ratios MS/CA:**

${context.mandates
  .filter((m) => m.payrollRatio)
  .map(
    (m) => `
• ${m.name}: ${formatPercent(m.payrollRatio!)} ${m.ratioStatus === "excellent" ? "✅ Excellent" : m.ratioStatus === "good" ? "✅ Bon" : m.ratioStatus === "warning" ? "⚠️ À surveiller" : "🚨 Critique"}
`
  )
  .join("")}

${context.summary.mandatesAtRisk > 0 ? `⚠️ **Attention:** ${context.summary.mandatesAtRisk} établissement(s) ont un ratio > 30%, ce qui peut impacter la rentabilité.` : "✅ Tes ratios sont globalement bons !"}

💡 **Conseil:** Un ratio idéal pour l'hôtellerie-restauration en Suisse se situe entre 25-30%."

Réponds maintenant aux questions de l'utilisateur en utilisant ces données et ces guidelines.`;
}

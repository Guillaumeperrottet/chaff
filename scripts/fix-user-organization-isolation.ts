// scripts/fix-user-organization-isolation.ts
// Script pour isoler les utilisateurs qui partagent incorrectement une organisation

import { PrismaClient } from "@prisma/client";
import readline from "readline";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

async function fixOrganizationIsolation() {
  console.log("🔧 CORRECTION DE L'ISOLATION DES ORGANISATIONS\n");

  try {
    // 1. Identifier les organisations partagées par plusieurs utilisateurs
    const organizations = await prisma.organization.findMany({
      include: {
        users: {
          include: {
            OrganizationUser: true,
          },
        },
        OrganizationUser: {
          include: {
            user: true,
          },
        },
        mandates: true,
      },
    });

    console.log("🔍 Analyse des organisations...\n");

    const sharedOrganizations = organizations.filter(
      (org) => org.users.length > 1 || org.OrganizationUser.length > 1
    );

    if (sharedOrganizations.length === 0) {
      console.log(
        "✅ Aucun problème détecté. Toutes les organisations sont correctement isolées."
      );
      return;
    }

    console.log(
      `⚠️  ${sharedOrganizations.length} organisation(s) partagée(s) détectée(s):\n`
    );

    for (const org of sharedOrganizations) {
      console.log(`🏢 Organisation: ${org.name} (${org.id})`);
      console.log(`   Nombre de mandats: ${org.mandates.length}`);
      console.log(`   Utilisateurs:`);

      const allUsers = [
        ...org.users.map((u) => ({
          ...u,
          role:
            org.OrganizationUser.find((ou) => ou.userId === u.id)?.role ||
            "unknown",
        })),
      ];

      // Dédupliquer les utilisateurs
      const uniqueUsers = Array.from(
        new Map(allUsers.map((u) => [u.id, u])).values()
      );

      uniqueUsers.forEach((user, index) => {
        console.log(
          `   ${index + 1}. ${user.email} (${user.role}) - Créé le ${user.createdAt.toLocaleDateString()}`
        );
      });

      console.log();

      // Proposer de séparer les utilisateurs
      const answer = await question(
        `Voulez-vous séparer ces utilisateurs en créant de nouvelles organisations ? (oui/non): `
      );

      if (answer.toLowerCase() === "oui" || answer.toLowerCase() === "o") {
        console.log("\n🔧 Séparation en cours...\n");

        // Le premier utilisateur (généralement le plus ancien) garde l'organisation existante
        const [ownerUser, ...otherUsers] = uniqueUsers;

        console.log(
          `✅ ${ownerUser.email} conserve l'organisation "${org.name}" avec tous les mandats`
        );

        // Créer une nouvelle organisation pour chaque autre utilisateur
        for (const user of otherUsers) {
          const newOrgName = `${user.name || user.email.split("@")[0]} - Organisation`;

          console.log(
            `\n🆕 Création d'une nouvelle organisation pour ${user.email}...`
          );

          // Créer la nouvelle organisation
          const newOrg = await prisma.organization.create({
            data: {
              name: newOrgName,
            },
          });

          console.log(
            `   ✅ Organisation créée: "${newOrgName}" (${newOrg.id})`
          );

          // Mettre à jour User.organizationId
          await prisma.user.update({
            where: { id: user.id },
            data: { organizationId: newOrg.id },
          });

          console.log(`   ✅ User.organizationId mis à jour`);

          // Mettre à jour ou créer OrganizationUser
          const existingOrgUser = await prisma.organizationUser.findUnique({
            where: { userId: user.id },
          });

          if (existingOrgUser) {
            await prisma.organizationUser.update({
              where: { userId: user.id },
              data: {
                organizationId: newOrg.id,
                role: "admin", // L'utilisateur devient admin de sa propre organisation
              },
            });
            console.log(`   ✅ OrganizationUser mis à jour (role: admin)`);
          } else {
            await prisma.organizationUser.create({
              data: {
                userId: user.id,
                organizationId: newOrg.id,
                role: "admin",
              },
            });
            console.log(`   ✅ OrganizationUser créé (role: admin)`);
          }

          // Créer un abonnement Free pour la nouvelle organisation
          const freePlan = await prisma.plan.findFirst({
            where: { name: "FREE" },
          });

          if (freePlan) {
            await prisma.subscription.create({
              data: {
                organizationId: newOrg.id,
                planId: freePlan.id,
                status: "ACTIVE",
                currentPeriodStart: new Date(),
                currentPeriodEnd: new Date(
                  Date.now() + 365 * 24 * 60 * 60 * 1000
                ),
              },
            });
            console.log(`   ✅ Abonnement Free créé`);
          }

          console.log(
            `   ✅ ${user.email} a maintenant sa propre organisation isolée`
          );
        }

        console.log(
          `\n✅ Séparation terminée pour l'organisation "${org.name}"\n`
        );
      } else {
        console.log(`⏭️  Organisation "${org.name}" ignorée\n`);
      }
    }

    console.log("=".repeat(80));
    console.log("🎉 CORRECTION TERMINÉE");
    console.log("=".repeat(80));

    // Afficher un résumé final
    const finalOrgs = await prisma.organization.count();
    const finalUsers = await prisma.user.count();

    console.log(`\nRésumé:`);
    console.log(`   📊 Organisations: ${finalOrgs}`);
    console.log(`   👥 Utilisateurs: ${finalUsers}`);
  } catch (error) {
    console.error("❌ Erreur lors de la correction:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

// Exécuter la correction
fixOrganizationIsolation();

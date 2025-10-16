// scripts/diagnose-user-organizations.ts
// Script de diagnostic pour identifier les problèmes d'organisations

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function diagnoseOrganizations() {
  console.log("🔍 DIAGNOSTIC DES ORGANISATIONS\n");

  try {
    // 1. Compter tous les utilisateurs
    const totalUsers = await prisma.user.count();
    console.log(`📊 Nombre total d'utilisateurs: ${totalUsers}\n`);

    // 2. Récupérer tous les utilisateurs avec leurs organisations
    const users = await prisma.user.findMany({
      include: {
        Organization: true,
        OrganizationUser: {
          include: {
            organization: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("=".repeat(80));
    console.log("LISTE DES UTILISATEURS ET LEURS ORGANISATIONS");
    console.log("=".repeat(80) + "\n");

    let usersWithoutOrg = 0;
    let usersWithMismatchedOrg = 0;
    const organizationMap = new Map<string, number>();

    for (const user of users) {
      console.log(`👤 Utilisateur: ${user.name || "Sans nom"}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   🆔 ID: ${user.id}`);
      console.log(`   📅 Créé le: ${user.createdAt.toLocaleDateString()}`);

      // Vérifier organizationId dans User
      if (user.organizationId) {
        console.log(
          `   🏢 Organization (User.organizationId): ${user.organizationId}`
        );
        if (user.Organization) {
          console.log(`   📝 Nom de l'organisation: ${user.Organization.name}`);
        } else {
          console.log(
            `   ⚠️  ATTENTION: organizationId défini mais Organization NULL!`
          );
        }
      } else {
        console.log(`   ⚠️  Organization (User.organizationId): AUCUNE`);
        usersWithoutOrg++;
      }

      // Vérifier OrganizationUser
      if (user.OrganizationUser) {
        console.log(
          `   🔗 OrganizationUser.organizationId: ${user.OrganizationUser.organizationId}`
        );
        console.log(`   👔 Rôle: ${user.OrganizationUser.role}`);
        console.log(
          `   📝 Nom (via OrganizationUser): ${user.OrganizationUser.organization.name}`
        );

        // Vérifier la cohérence
        if (
          user.organizationId &&
          user.organizationId !== user.OrganizationUser.organizationId
        ) {
          console.log(
            `   ❌ INCOHÉRENCE: User.organizationId ≠ OrganizationUser.organizationId`
          );
          usersWithMismatchedOrg++;
        }
      } else {
        console.log(`   ⚠️  OrganizationUser: AUCUNE ENTRÉE`);
      }

      // Compter les utilisateurs par organisation
      const orgId =
        user.organizationId || user.OrganizationUser?.organizationId;
      if (orgId) {
        organizationMap.set(orgId, (organizationMap.get(orgId) || 0) + 1);
      }

      console.log();
    }

    // 3. Statistiques par organisation
    console.log("=".repeat(80));
    console.log("STATISTIQUES PAR ORGANISATION");
    console.log("=".repeat(80) + "\n");

    const organizations = await prisma.organization.findMany({
      include: {
        users: true,
        OrganizationUser: true,
        mandates: true,
      },
    });

    for (const org of organizations) {
      console.log(`🏢 Organisation: ${org.name}`);
      console.log(`   🆔 ID: ${org.id}`);
      console.log(`   📅 Créée le: ${org.createdAt.toLocaleDateString()}`);
      console.log(
        `   👥 Utilisateurs (User.organizationId): ${org.users.length}`
      );
      console.log(
        `   🔗 Utilisateurs (OrganizationUser): ${org.OrganizationUser.length}`
      );
      console.log(`   📋 Mandats: ${org.mandates.length}`);

      // Afficher les utilisateurs
      if (org.users.length > 0) {
        console.log(`   Détail des utilisateurs:`);
        for (const user of org.users) {
          const orgUser = org.OrganizationUser.find(
            (ou) => ou.userId === user.id
          );
          console.log(
            `      - ${user.email} (${orgUser?.role || "pas de rôle"})`
          );
        }
      }

      console.log();
    }

    // 4. Résumé des problèmes
    console.log("=".repeat(80));
    console.log("RÉSUMÉ DES PROBLÈMES DÉTECTÉS");
    console.log("=".repeat(80) + "\n");

    if (usersWithoutOrg > 0) {
      console.log(`⚠️  ${usersWithoutOrg} utilisateur(s) sans organization`);
    }

    if (usersWithMismatchedOrg > 0) {
      console.log(
        `❌ ${usersWithMismatchedOrg} utilisateur(s) avec incohérence User.organizationId ≠ OrganizationUser.organizationId`
      );
    }

    // Identifier les organisations avec plusieurs utilisateurs
    const sharedOrgs = Array.from(organizationMap.entries()).filter(
      ([, count]) => count > 1
    );
    if (sharedOrgs.length > 0) {
      console.log(`\n🔍 Organisations partagées par plusieurs utilisateurs:`);
      for (const [orgId, count] of sharedOrgs) {
        const org = organizations.find((o) => o.id === orgId);
        console.log(
          `   - ${org?.name || "Organisation inconnue"} (${orgId}): ${count} utilisateurs`
        );

        // Lister les utilisateurs de cette organisation
        const usersInOrg = users.filter(
          (u) =>
            u.organizationId === orgId ||
            u.OrganizationUser?.organizationId === orgId
        );
        for (const user of usersInOrg) {
          console.log(`      • ${user.email}`);
        }
      }
    }

    // 5. Vérifier les mandats orphelins (mandats où l'organisation n'existe plus)
    const allMandates = await prisma.mandate.findMany({
      include: {
        organization: true,
      },
    });
    const mandatesWithoutOrg = allMandates.filter((m) => !m.organization);

    if (mandatesWithoutOrg.length > 0) {
      console.log(
        `\n⚠️  ${mandatesWithoutOrg.length} mandat(s) sans organisation:`
      );
      for (const mandate of mandatesWithoutOrg) {
        console.log(`   - ${mandate.name} (ID: ${mandate.id})`);
      }
    }

    console.log("\n" + "=".repeat(80));
    console.log("DIAGNOSTIC TERMINÉ");
    console.log("=".repeat(80));
  } catch (error) {
    console.error("❌ Erreur lors du diagnostic:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le diagnostic
diagnoseOrganizations();

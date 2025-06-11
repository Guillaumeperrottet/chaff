// Script pour changer le plan d'un utilisateur
// Usage: npx tsx scripts/change-user-plan.ts <email_utilisateur> <nouveau_plan>

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function changeUserPlan(userEmail: string, newPlanName: string) {
  try {
    console.log(`🔄 Changement de plan pour: ${userEmail} vers ${newPlanName}`);

    // 1. Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        Organization: {
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error(`❌ Utilisateur non trouvé: ${userEmail}`);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email}`);

    // 2. Chercher le nouveau plan
    const newPlan = await prisma.plan.findFirst({
      where: { name: newPlanName },
    });

    if (!newPlan) {
      throw new Error(`❌ Plan non trouvé: ${newPlanName}`);
    }

    console.log(`✅ Plan trouvé: ${newPlan.name} (ID: ${newPlan.id})`);

    // 3. Vérifier si l'utilisateur a une organisation
    if (!user.Organization) {
      throw new Error(`❌ L'utilisateur ${userEmail} n'a pas d'organisation`);
    }

    const oldPlan = user.Organization.subscription?.plan?.name || "Aucun";

    // 4. Mettre à jour dans une transaction
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le planType de l'utilisateur
      await tx.user.update({
        where: { id: user.id },
        data: { planType: newPlanName },
      });

      // Gérer l'abonnement
      const existingSubscription = user.Organization!.subscription;

      if (existingSubscription) {
        // Mettre à jour l'abonnement existant
        await tx.subscription.update({
          where: { id: existingSubscription.id },
          data: {
            planId: newPlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          },
        });
        console.log("✅ Abonnement existant mis à jour");
      } else {
        // Créer un nouvel abonnement
        await tx.subscription.create({
          data: {
            organizationId: user.Organization!.id,
            planId: newPlan.id,
            status: "ACTIVE",
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 an
          },
        });
        console.log("✅ Nouvel abonnement créé");
      }
    });

    console.log(`🎉 Plan changé avec succès pour ${userEmail}!`);
    console.log("📋 Résumé:");
    console.log(`   - Utilisateur: ${user.name || user.email}`);
    console.log(`   - Organisation: ${user.Organization.name}`);
    console.log(`   - Ancien plan: ${oldPlan}`);
    console.log(`   - Nouveau plan: ${newPlanName}`);

    return { success: true, oldPlan, newPlan: newPlanName };
  } catch (error) {
    console.error("❌ Erreur lors du changement de plan:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  const userEmail = process.argv[2];
  const newPlanName = process.argv[3];

  if (!userEmail || !newPlanName) {
    console.error(
      "❌ Usage: npx tsx scripts/change-user-plan.ts <email_utilisateur> <nouveau_plan>"
    );
    console.error(
      "Plans disponibles: FREE, PREMIUM, SUPER_ADMIN, ILLIMITE, CUSTOM"
    );
    process.exit(1);
  }

  changeUserPlan(userEmail, newPlanName)
    .then(() => {
      console.log("🎉 Script terminé avec succès!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

export { changeUserPlan };

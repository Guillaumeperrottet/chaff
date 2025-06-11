// Script pour attribuer le plan ILLIMITE à un utilisateur
// Usage: npx ts-node scripts/assign-unlimited-plan.ts <email_utilisateur>

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function assignUnlimitedPlan(userEmail: string) {
  try {
    console.log(`🚀 Attribution du plan ILLIMITE à: ${userEmail}`);

    // 1. Chercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        Organization: {
          include: {
            subscription: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error(`❌ Utilisateur non trouvé: ${userEmail}`);
    }

    console.log(`✅ Utilisateur trouvé: ${user.name || user.email}`);

    // 2. Chercher le plan ILLIMITE
    const unlimitedPlan = await prisma.plan.findFirst({
      where: { name: "ILLIMITE" },
    });

    if (!unlimitedPlan) {
      throw new Error(
        "❌ Plan ILLIMITE non trouvé! Exécutez d'abord: npx ts-node scripts/create-unlimited-plan.ts"
      );
    }

    console.log(`✅ Plan ILLIMITE trouvé: ${unlimitedPlan.id}`);

    // 3. Vérifier si l'utilisateur a une organisation
    if (!user.Organization) {
      throw new Error(`❌ L'utilisateur ${userEmail} n'a pas d'organisation`);
    }

    // 4. Mettre à jour dans une transaction
    await prisma.$transaction(async (tx) => {
      // Mettre à jour le planType de l'utilisateur
      await tx.user.update({
        where: { id: user.id },
        data: { planType: "ILLIMITE" },
      });

      // Désactiver l'ancien abonnement s'il existe
      const activeSubscription = user.Organization!.subscription;

      if (activeSubscription) {
        await tx.subscription.update({
          where: { id: activeSubscription.id },
          data: { status: "CANCELED" },
        });
        console.log("✅ Ancien abonnement désactivé");
      }

      // Créer le nouveau abonnement ILLIMITE
      await tx.subscription.create({
        data: {
          organizationId: user.Organization!.id,
          planId: unlimitedPlan.id,
          status: "ACTIVE",
          currentPeriodStart: new Date(),
          currentPeriodEnd: new Date(
            Date.now() + 10 * 365 * 24 * 60 * 60 * 1000
          ), // 10 ans
        },
      });

      console.log("✅ Nouvel abonnement ILLIMITE créé");
    });

    console.log(`🎉 Plan ILLIMITE attribué avec succès à ${userEmail}!`);
    console.log("📋 Résumé:");
    console.log(`   - Utilisateur: ${user.name || user.email}`);
    console.log(`   - Organisation: ${user.Organization.name}`);
    console.log(`   - Nouveau plan: ILLIMITE`);
    console.log(`   - Durée: 10 ans`);
  } catch (error) {
    console.error("❌ Erreur lors de l'attribution du plan:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Exécuter le script si appelé directement
if (require.main === module) {
  const userEmail = process.argv[2];

  if (!userEmail) {
    console.error(
      "❌ Usage: npx ts-node scripts/assign-unlimited-plan.ts <email_utilisateur>"
    );
    process.exit(1);
  }

  assignUnlimitedPlan(userEmail)
    .then(() => {
      console.log("🎉 Script terminé avec succès!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("💥 Erreur fatale:", error);
      process.exit(1);
    });
}

export { assignUnlimitedPlan };

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Mise à jour du plan vers ILLIMITE...");

  const targetEmail = "perrottet@soge-sa.ch";

  // Trouver l'utilisateur et son organisation
  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    include: { Organization: true },
  });

  if (!user) {
    console.log(`Utilisateur avec email ${targetEmail} non trouvé.`);
    return;
  }

  if (!user.Organization) {
    console.log(`Utilisateur trouvé mais sans organisation.`);
    return;
  }

  // Trouver le plan ILLIMITE
  const illimitePlan = await prisma.plan.findUnique({
    where: { name: "ILLIMITE" },
  });

  if (!illimitePlan) {
    console.log(
      "Plan ILLIMITE non trouvé. Assurez-vous qu'il existe dans la table Plan."
    );
    return;
  }

  // Mettre à jour ou créer l'abonnement
  await prisma.subscription.upsert({
    where: { organizationId: user.Organization.id },
    update: {
      planId: illimitePlan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 ans
      cancelAtPeriodEnd: false,
    },
    create: {
      organizationId: user.Organization.id,
      planId: illimitePlan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 ans
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Plan ILLIMITE configuré pour ${targetEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

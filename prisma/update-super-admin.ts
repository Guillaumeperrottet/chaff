import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("Mise à jour du compte super admin...");

  const superAdminEmail = "perrottet.guillaume.97@gmail.com";

  // Trouver l'utilisateur et son organisation
  const user = await prisma.user.findUnique({
    where: { email: superAdminEmail },
    include: { Organization: true },
  });

  if (!user) {
    console.log(`Utilisateur avec email ${superAdminEmail} non trouvé.`);
    return;
  }

  if (!user.Organization) {
    console.log(`Utilisateur trouvé mais sans organisation.`);
    return;
  }

  // Trouver le plan SUPER_ADMIN
  const superAdminPlan = await prisma.plan.findUnique({
    where: { name: "SUPER_ADMIN" },
  });

  if (!superAdminPlan) {
    console.log(
      "Plan SUPER_ADMIN non trouvé. Assurez-vous de l'avoir créé d'abord."
    );
    return;
  }

  // Mettre à jour ou créer l'abonnement
  await prisma.subscription.upsert({
    where: { organizationId: user.Organization.id },
    update: {
      planId: superAdminPlan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 ans
      cancelAtPeriodEnd: false,
    },
    create: {
      organizationId: user.Organization.id,
      planId: superAdminPlan.id,
      status: "ACTIVE",
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000), // 100 ans
      cancelAtPeriodEnd: false,
    },
  });

  console.log(`Plan SUPER_ADMIN configuré pour ${superAdminEmail}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

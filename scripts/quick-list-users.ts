// Script rapide pour lister les utilisateurs
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function listUsers() {
  try {
    console.log("📋 Liste des utilisateurs:");

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        planType: true,
        emailVerified: true,
        Organization: {
          select: {
            name: true,
            subscription: {
              select: {
                plan: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    if (users.length === 0) {
      console.log("❌ Aucun utilisateur trouvé");
      return;
    }

    users.forEach((user, index) => {
      console.log(`\n${index + 1}. 👤 ${user.name || user.email}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   📊 Plan User: ${user.planType || "Non défini"}`);
      console.log(`   ✅ Email vérifié: ${user.emailVerified ? "Oui" : "Non"}`);

      if (user.Organization) {
        console.log(`   🏢 Organisation: ${user.Organization.name}`);
        const planName = user.Organization.subscription?.plan?.name || "Aucun";
        console.log(`   📦 Plan Org: ${planName}`);
      } else {
        console.log(`   🏢 Organisation: Aucune`);
      }
    });

    console.log(`\n📊 Total: ${users.length} utilisateur(s)`);
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

listUsers();

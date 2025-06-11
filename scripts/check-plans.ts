// Script pour vérifier que le plan ILLIMITE existe
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkPlans() {
  try {
    console.log("🔍 Vérification des plans existants...");

    const plans = await prisma.plan.findMany({
      select: {
        id: true,
        name: true,
        maxUsers: true,
        maxMandates: true,
        maxStorage: true,
      },
      orderBy: { name: "asc" },
    });

    console.log(`📊 ${plans.length} plan(s) trouvé(s):`);

    plans.forEach((plan, index) => {
      console.log(`\n${index + 1}. 📦 ${plan.name}`);
      console.log(`   ID: ${plan.id}`);
      console.log(`   👥 Max Users: ${plan.maxUsers || "Illimité"}`);
      console.log(`   📋 Max Mandates: ${plan.maxMandates || "Illimité"}`);
      console.log(`   💾 Max Storage: ${plan.maxStorage || "Illimité"} MB`);
    });

    // Vérifier spécifiquement le plan ILLIMITE
    const illimitePlan = plans.find((p) => p.name === "ILLIMITE");
    if (illimitePlan) {
      console.log("\n✅ Plan ILLIMITE trouvé et prêt à être utilisé!");
    } else {
      console.log("\n❌ Plan ILLIMITE non trouvé");
    }
  } catch (error) {
    console.error("❌ Erreur:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkPlans();

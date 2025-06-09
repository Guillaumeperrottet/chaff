const { PrismaClient } = require('@prisma/client');

async function migratePlanData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== Migration des données de plans ===\n');
    
    // Mapping des anciens plans vers les nouveaux
    const planMapping = {
      'PERSONAL': 'FREE',      // Migrer PERSONAL vers FREE
      'PROFESSIONAL': 'PREMIUM', // Migrer PROFESSIONAL vers PREMIUM
      'ENTERPRISE': 'ILLIMITE'   // Migrer ENTERPRISE vers ILLIMITE
    };
    
    // 1. Migrer les plans dans la table Plan
    console.log('1. Migration des plans...');
    for (const [oldPlan, newPlan] of Object.entries(planMapping)) {
      const existingPlan = await prisma.plan.findFirst({
        where: { name: oldPlan }
      });
      
      if (existingPlan) {
        console.log(`  Mise à jour du plan ${oldPlan} vers ${newPlan}...`);
        await prisma.plan.update({
          where: { id: existingPlan.id },
          data: { name: newPlan }
        });
      }
    }
    
    // 2. Migrer les planType des utilisateurs (si nécessaire)
    console.log('\n2. Migration des planType utilisateurs...');
    for (const [oldPlan, newPlan] of Object.entries(planMapping)) {
      const usersToUpdate = await prisma.user.findMany({
        where: { planType: oldPlan }
      });
      
      if (usersToUpdate.length > 0) {
        console.log(`  Mise à jour de ${usersToUpdate.length} utilisateurs de ${oldPlan} vers ${newPlan}...`);
        await prisma.user.updateMany({
          where: { planType: oldPlan },
          data: { planType: newPlan }
        });
      }
    }
    
    console.log('\n✅ Migration terminée avec succès !');
    
    // Afficher l'état final
    console.log('\n=== État final ===');
    const finalPlans = await prisma.plan.findMany({
      select: { id: true, name: true }
    });
    finalPlans.forEach(plan => console.log(`  - ${plan.name}`));
    
  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migratePlanData();

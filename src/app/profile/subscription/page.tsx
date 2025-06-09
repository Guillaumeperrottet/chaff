// // src/app/profile/subscription/page.tsx - Version nettoyée
// import { getUser } from "@/lib/auth-session";
// import { prisma } from "@/lib/prisma";
// import { redirect } from "next/navigation";
// import SubscriptionDashboard from "./subscription-dashboard";

// export default async function SubscriptionPage() {
//   const user = await getUser();

//   if (!user) {
//     redirect("/signin?redirect=/profile/subscription");
//   }

//   // Récupérer l'organisation de l'utilisateur
//   const userWithOrg = await prisma.user.findUnique({
//     where: { id: user.id },
//     include: { Organization: true },
//   });

//   if (!userWithOrg?.Organization) {
//     redirect("/onboarding");
//   }

//   const organizationId = userWithOrg.Organization.id;

//   // Vérifier si l'utilisateur est admin de l'organisation
//   const isAdmin = await prisma.organizationUser.findFirst({
//     where: {
//       userId: user.id,
//       organizationId,
//       role: "admin",
//     },
//   });

//   // Récupérer l'abonnement et les plans disponibles (seulement FREE et PREMIUM)
//   const subscription = await prisma.subscription.findUnique({
//     where: { organizationId },
//     include: { plan: true },
//   });

//   const plans = await prisma.plan.findMany({
//     where: {
//       name: {
//         in: ["FREE", "PREMIUM"], // Seulement les plans publics
//       },
//       isActive: true, // Seulement les plans actifs
//     },
//     orderBy: {
//       price: "asc",
//     },
//   });

//   // Convertir les décimaux en nombres pour le client
//   const formattedPlans = plans.map((plan) => ({
//     ...plan,
//     price: typeof plan.price === "object" ? Number(plan.price) : plan.price,
//     monthlyPrice:
//       typeof plan.monthlyPrice === "object"
//         ? Number(plan.monthlyPrice)
//         : plan.monthlyPrice,
//     yearlyPrice: plan.yearlyPrice
//       ? typeof plan.yearlyPrice === "object"
//         ? Number(plan.yearlyPrice)
//         : plan.yearlyPrice
//       : null,
//   }));

//   const formattedSubscription = subscription
//     ? {
//         ...subscription,
//         plan: {
//           ...subscription.plan,
//           price:
//             typeof subscription.plan.price === "object"
//               ? Number(subscription.plan.price)
//               : subscription.plan.price,
//           monthlyPrice:
//             typeof subscription.plan.monthlyPrice === "object"
//               ? Number(subscription.plan.monthlyPrice)
//               : subscription.plan.monthlyPrice,
//           yearlyPrice: subscription.plan.yearlyPrice
//             ? typeof subscription.plan.yearlyPrice === "object"
//               ? Number(subscription.plan.yearlyPrice)
//               : subscription.plan.yearlyPrice
//             : null,
//           maxUsers: subscription.plan.maxUsers,
//           maxStorage: subscription.plan.maxStorage,
//           features: subscription.plan.features || [],
//           hasCustomPricing: subscription.plan.hasCustomPricing || false,
//           trialDays: subscription.plan.trialDays || 0,
//           // Ajout des nouvelles propriétés
//           hasAdvancedReports: subscription.plan.hasAdvancedReports || false,
//           hasApiAccess: subscription.plan.hasApiAccess || false,
//           hasCustomBranding: subscription.plan.hasCustomBranding || false,
//         },
//       }
//     : null;

//   return (
//     <SubscriptionDashboard
//       subscription={formattedSubscription}
//       plans={formattedPlans}
//       isAdmin={!!isAdmin}
//       organizationId={organizationId}
//     />
//   );
// }

// src/app/api/admin/subscriptions/[id]/route.ts - Version corrigée
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

// PUT : mettre à jour un abonnement
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: subscriptionId } = await params;
    const updateData = await request.json();

    console.log("Données reçues:", updateData);
    console.log("ID abonnement:", subscriptionId);

    // Vérifier que l'abonnement existe
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: { organization: true, plan: true },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Abonnement non trouvé" },
        { status: 404 }
      );
    }

    // Si un changement de plan est demandé
    if (updateData.subscription?.planName) {
      const newPlan = await prisma.plan.findUnique({
        where: { name: updateData.subscription.planName },
      });

      if (!newPlan) {
        return NextResponse.json(
          { error: `Plan "${updateData.subscription.planName}" non trouvé` },
          { status: 400 }
        );
      }

      // Mettre à jour l'abonnement avec le nouveau plan
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          planId: newPlan.id,
          status: updateData.subscription.status || existingSubscription.status,
          cancelAtPeriodEnd:
            updateData.subscription.cancelAtPeriodEnd ??
            existingSubscription.cancelAtPeriodEnd,
          currentPeriodEnd: updateData.subscription.currentPeriodEnd
            ? new Date(updateData.subscription.currentPeriodEnd)
            : existingSubscription.currentPeriodEnd,
        },
      });

      return NextResponse.json({
        success: true,
        message: "Abonnement mis à jour avec succès",
        subscription: updatedSubscription,
      });
    }

    // Sinon, mise à jour simple des champs
    const updatedSubscription = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: updateData.subscription?.status || existingSubscription.status,
        cancelAtPeriodEnd:
          updateData.subscription?.cancelAtPeriodEnd ??
          existingSubscription.cancelAtPeriodEnd,
        currentPeriodEnd: updateData.subscription?.currentPeriodEnd
          ? new Date(updateData.subscription.currentPeriodEnd)
          : existingSubscription.currentPeriodEnd,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement mis à jour avec succès",
      subscription: updatedSubscription,
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'abonnement:", error);
    return NextResponse.json(
      {
        error: "Erreur interne du serveur",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

// DELETE : supprimer un abonnement
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getUser();
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    const { id: subscriptionId } = await params;

    const existingSubscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!existingSubscription) {
      return NextResponse.json(
        { error: "Abonnement non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer l'abonnement
    await prisma.subscription.delete({
      where: { id: subscriptionId },
    });

    return NextResponse.json({
      success: true,
      message: "Abonnement supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'abonnement:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

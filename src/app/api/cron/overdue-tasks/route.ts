import { NextResponse } from "next/server";
import { NotificationService } from "@/lib/notification-serice";

export async function GET(req: Request) {
  try {
    // Vérifier le secret d'API
    const apiSecret = req.headers.get("x-api-secret");
    if (apiSecret !== process.env.EMAIL_API_SECRET) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    console.log("🕐 Démarrage vérification tâches en retard...");

    // Notifier les tâches en retard
    await NotificationService.notifyOverdueTasks();

    // Notifier les tâches dues bientôt
    await NotificationService.notifyTasksDueSoon();

    console.log("✅ Vérification tâches en retard terminée");

    return NextResponse.json({
      success: true,
      message: "Vérification des tâches en retard effectuée",
    });
  } catch (error) {
    console.error("❌ Erreur vérification tâches en retard:", error);
    return NextResponse.json(
      { error: "Erreur lors de la vérification des tâches en retard" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const user = await getUser();
    if (!user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { mandateId, dateKey, value } = await req.json();

    if (!mandateId || !dateKey || value === undefined) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur a accès à ce mandat via son organisation
    const mandate = await prisma.mandate.findFirst({
      where: {
        id: mandateId,
        organizationId: user.organizationId!,
      },
    });

    if (!mandate) {
      return NextResponse.json(
        { error: "Mandat non trouvé ou accès non autorisé" },
        { status: 404 }
      );
    }

    // Parse la dateKey pour extraire la date
    // Format attendu: "day_2024_12_16" ou similaire
    const dateMatch = dateKey.match(/day_(\d{4})_(\d{2})_(\d{2})/);
    if (!dateMatch) {
      return NextResponse.json(
        { error: "Format de date invalide" },
        { status: 400 }
      );
    }

    const [, year, month, day] = dateMatch;
    const entryDate = new Date(`${year}-${month}-${day}`);

    // Vérifier si une entrée existe déjà pour cette date et ce mandat
    const existingEntry = await prisma.dayValue.findUnique({
      where: {
        date_mandateId: {
          mandateId,
          date: entryDate,
        },
      },
    });

    if (existingEntry) {
      // Mettre à jour l'entrée existante
      await prisma.dayValue.update({
        where: {
          id: existingEntry.id,
        },
        data: {
          value: parseFloat(value.toString()),
          updatedAt: new Date(),
        },
      });
    } else {
      // Créer une nouvelle entrée
      await prisma.dayValue.create({
        data: {
          mandateId,
          date: entryDate,
          value: parseFloat(value.toString()),
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la valeur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

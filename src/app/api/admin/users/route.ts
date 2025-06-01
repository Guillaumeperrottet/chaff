// src/app/api/admin/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { superAdminGuard } from "@/lib/super-admin";

export async function GET() {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer tous les utilisateurs avec des informations sur leur organisation
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        organizationId: true,
        Organization: {
          select: {
            name: true,
          },
        },
        OrganizationUser: {
          select: {
            role: true,
          },
        }, // This will return an array of { role: string }
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatter les résultats
    const formattedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      organizationId: user.organizationId,
      organizationName: user.Organization?.name || null,
      role:
        Array.isArray(user.OrganizationUser) && user.OrganizationUser.length > 0
          ? user.OrganizationUser[0].role
          : null,
    }));

    return NextResponse.json({ users: formattedUsers });
  } catch (error) {
    console.error("Erreur lors de la récupération des utilisateurs:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getUser();

    // Vérifier si l'utilisateur est un super-admin
    if (!user || !(await superAdminGuard(user.id))) {
      return NextResponse.json(
        { error: "Accès non autorisé" },
        { status: 403 }
      );
    }

    // Récupérer les données du nouvel utilisateur
    const userData = await request.json();

    // Vérifier les données requises
    if (!userData.email || !userData.name) {
      return NextResponse.json(
        { error: "L'email et le nom sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 400 }
      );
    }

    // Créer l'utilisateur
    const newUser = await prisma.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        emailVerified: userData.emailVerified || false,
        image: userData.image || null,
        organizationId: userData.organizationId || null,
      },
    });

    // Si un organizationId est fourni, créer l'association OrganizationUser
    if (userData.organizationId) {
      await prisma.organizationUser.create({
        data: {
          userId: newUser.id,
          organizationId: userData.organizationId,
          role: userData.role || "member",
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Utilisateur créé avec succès",
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Erreur lors de la création de l'utilisateur:", error);
    return NextResponse.json(
      { error: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

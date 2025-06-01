// src/app/profile/invitations/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import GenerateInviteForm from "./generate-invite-form";
import InvitationsList from "./invitations-list";
import Link from "next/link";

export default async function InvitationsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/signin");
  }

  // Vérifiez si l'utilisateur est admin
  const orgUser = await prisma.organizationUser.findFirst({
    where: { userId: user.id },
    include: { organization: true },
  });

  if (!orgUser || orgUser.role !== "admin") {
    redirect("/profile");
  }

  // Récupérez les codes d'invitation actifs
  const invitationCodes = await prisma.invitationCode.findMany({
    where: {
      organizationId: orgUser.organizationId,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-[color:var(--background)] rounded-lg shadow-md border border-[color:var(--border)]">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
          Invitations
        </h1>
        <Link
          href="/profile/edit"
          className="px-4 py-2 bg-[color:var(--muted)] rounded hover:bg-[color:var(--muted)]/80 transition text-[color:var(--foreground)]"
        >
          Retour aux utilisateurs
        </Link>
      </div>

      <GenerateInviteForm
        organizationId={orgUser.organizationId}
        userId={user.id}
      />

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-[color:var(--foreground)]">
          Codes d&apos;invitation actifs
        </h2>
        <InvitationsList
          invitationCodes={invitationCodes}
          organizationName={orgUser.organization.name}
        />
      </div>
    </div>
  );
}

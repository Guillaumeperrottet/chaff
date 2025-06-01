import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import NewObjectForm from "@/app/dashboard/objet/new/new-objet-form";

export default async function NewObjetPage() {
  const session = await getUser();

  if (!session) {
    redirect("/signin");
  }

  // Récupérer l'organisation de l'utilisateur
  const userWithOrg = await prisma.user.findUnique({
    where: { id: session.id },
    include: { Organization: true },
  });

  if (!userWithOrg?.Organization) {
    redirect("/dashboard");
  }

  return <NewObjectForm />;
}

import { redirect } from "next/navigation";
import { getUser } from "@/lib/auth-session";
import ArchivesPage from "@/app/dashboard/archives/archives-page";

export const metadata = {
  title: "Archives des tâches | PlanniKeeper",
  description: "Consultez et gérez vos tâches archivées",
};

export default async function ArchivesPageWrapper() {
  // Vérifier l'authentification
  const session = await getUser();
  if (!session) {
    redirect("/signin");
  }

  return <ArchivesPage />;
}

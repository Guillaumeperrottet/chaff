// src/app/admin/page.tsx
import { getUser } from "@/lib/auth-session";
import { isSuperAdmin } from "@/lib/super-admin";
import { redirect } from "next/navigation";
import { AdminDashboard } from "@/app/admin/admin-dashboard";

export default async function AdminPage() {
  const user = await getUser();

  // Rediriger si aucun utilisateur n'est connecté
  if (!user) {
    redirect("/signin");
  }

  // Vérifier si l'utilisateur est super-admin
  const isAdmin = await isSuperAdmin(user.id);

  if (!isAdmin) {
    // Rediriger si l'utilisateur n'est pas super-admin
    redirect("/dashboard");
  }

  // Rendre la page admin si l'utilisateur est autorisé
  return <AdminDashboard user={user} />;
}

import { getUser } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import { Metadata } from "next";
import DashboardClient from "@/app/dashboard/dashboard-client";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Votre espace personnel",
};

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect("/signin");
  }

  if (!user.emailVerified) {
    redirect("/auth/email-verification-required");
  }

  return <DashboardClient user={user} />;
}

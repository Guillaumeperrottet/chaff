// src/app/profile/notifications/page.tsx
import { getUser } from "@/lib/auth-session";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { NotificationsList } from "@/app/profile/notifications/notifications-list";
import { NotificationPreferences } from "@/app/profile/notifications/notification-preferences";
import { EmailPreferences } from "@/app/profile/email-preferences";
import { DailySummaryPreferences } from "@/app/profile/notifications/daily-summary-preferences";
import { BackButton } from "@/app/components/ui/BackButton";

import { Bell, Settings, Sparkles, Zap } from "lucide-react";

export default async function NotificationsPage() {
  const user = await getUser();
  if (!user) {
    redirect("/signin");
  }

  // Récupérer les notifications récentes
  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Récupérer les préférences de notifications
  const userWithPrefs = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      notificationsEnabled: true,
      emailNotificationsEnabled: true,
      dailySummaryEnabled: true,
    },
  });

  const notificationsEnabled = userWithPrefs?.notificationsEnabled ?? true;
  const emailNotificationsEnabled =
    userWithPrefs?.emailNotificationsEnabled ?? true;
  const dailySummaryEnabled = userWithPrefs?.dailySummaryEnabled ?? false;

  const mappedNotifications = notifications.map((n) => ({
    id: typeof n.id === "string" ? parseInt(n.id, 10) : n.id,
    createdAt:
      n.createdAt instanceof Date ? n.createdAt.toISOString() : n.createdAt,
    userId: n.userId,
    link: n.link,
    title: n.title,
    message: n.message,
    category: n.category,
    data: n.data,
    type: n.category ?? "default",
    content: n.message,
    isRead: n.read,
    read: n.read,
  }));

  const unreadCount = mappedNotifications.filter((n) => !n.read).length;
  const totalCount = mappedNotifications.length;

  return (
    <div className="min-h-screen bg-[color:var(--background)]">
      {/* Header compact */}
      <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          {/* Ligne navigation avec titre et stats */}
          <div className="flex items-center justify-between">
            {/* Navigation et titre */}
            <div className="flex items-center gap-4">
              <BackButton
                href="/profile"
                label="Retour au profil"
                loadingMessage="Retour au profil..."
              />

              <div className="h-4 w-px bg-[color:var(--border)]"></div>

              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[color:var(--primary)] rounded-lg flex items-center justify-center">
                  <Bell
                    size={16}
                    className="text-[color:var(--primary-foreground)]"
                  />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-[color:var(--foreground)]">
                    Notifications
                  </h1>
                  <p className="text-xs text-[color:var(--muted-foreground)] hidden sm:block">
                    Centre de notifications et préférences
                  </p>
                </div>
              </div>
            </div>

            {/* Stats compactes */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--muted)] rounded-full text-sm">
                <div className="w-2 h-2 bg-[color:var(--primary)] rounded-full animate-pulse"></div>
                <span className="font-medium text-[color:var(--foreground)]">
                  {unreadCount}
                </span>
                <span className="text-[color:var(--muted-foreground)] hidden sm:inline">
                  non lues
                </span>
              </div>
              <div className="text-xs text-[color:var(--muted-foreground)] hidden md:block">
                {totalCount} au total
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
        {/* Section préférences - version compacte horizontale */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Settings size={18} className="text-[color:var(--primary)]" />
            <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
              Préférences
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Notifications générales */}
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-[color:var(--border)] bg-[color:var(--muted)]/30">
                <div className="flex items-center gap-2">
                  <Bell size={16} className="text-[color:var(--primary)]" />
                  <h3 className="font-medium text-[color:var(--foreground)] text-sm">
                    Notifications
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <NotificationPreferences
                  initialEnabled={notificationsEnabled}
                />
              </div>
            </div>

            {/* Notifications email */}
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-[color:var(--border)] bg-[color:var(--muted)]/30">
                <div className="flex items-center gap-2">
                  <Zap size={16} className="text-[color:var(--primary)]" />
                  <h3 className="font-medium text-[color:var(--foreground)] text-sm">
                    Emails
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <EmailPreferences initialEnabled={emailNotificationsEnabled} />
              </div>
            </div>

            {/* Récapitulatifs quotidiens */}
            <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
              <div className="p-3 border-b border-[color:var(--border)] bg-[color:var(--muted)]/30">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-[color:var(--primary)]" />
                  <h3 className="font-medium text-[color:var(--foreground)] text-sm">
                    Récapitulatifs
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <DailySummaryPreferences initialEnabled={dailySummaryEnabled} />
              </div>
            </div>
          </div>
        </div>

        {/* Section historique - avec header plus compact */}
        <div className="mb-6">
          <div className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b border-[color:var(--border)] bg-[color:var(--muted)]/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Bell size={18} className="text-[color:var(--primary)]" />
                  <div>
                    <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                      Historique
                    </h2>
                    <p className="text-xs text-[color:var(--muted-foreground)]">
                      {totalCount} notifications
                    </p>
                  </div>
                </div>

                {unreadCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-full text-sm font-medium">
                    <div className="w-1.5 h-1.5 bg-[color:var(--primary-foreground)] rounded-full animate-pulse"></div>
                    {unreadCount} nouvelles
                  </div>
                )}
              </div>
            </div>

            <div className="max-h-[calc(100vh-300px)] overflow-y-auto">
              <NotificationsList notifications={mappedNotifications} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

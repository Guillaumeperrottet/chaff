import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { ThemeProvider } from "@/app/components/theme-provider";
import Navbar from "@/app/components/Navbar";
import { UnifiedSessionManager } from "@/app/components/UnifiedSessionManager";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Chaff.ch - Analytics Business",
  description: "Plateforme d'analyse pour votre business",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5, // Permettre un zoom jusqu'à 500%
    userScalable: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body
        className={cn(
          inter.className,
          "min-h-screen bg-background antialiased"
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Gestionnaire de session unifié */}
          <UnifiedSessionManager />

          {/* Navbar conditionnelle */}
          <Navbar>{children}</Navbar>

          {/* Toast notifications */}
          <Toaster
            position="bottom-center"
            richColors
            closeButton
            theme="system"
            toastOptions={{
              classNames: {
                toast: "bg-card border border-border shadow-md",
                title: "text-foreground font-medium",
                description: "text-muted-foreground",
                actionButton: "bg-primary text-primary-foreground",
                cancelButton: "bg-muted text-muted-foreground",
                success: "border-l-4 border-green-500",
                error: "border-l-4 border-destructive",
                warning: "border-l-4 border-amber-500",
                info: "border-l-4 border-blue-500",
              },
              duration: 4000,
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}

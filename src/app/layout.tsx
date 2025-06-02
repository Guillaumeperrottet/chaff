import "./globals.css";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import { defaultMetadata } from "@/lib/metadata";
import { ThemeProvider } from "@/app/components/theme-provider";
import Navbar from "@/app/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata = defaultMetadata;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar>{children}</Navbar>
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

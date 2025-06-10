"use client";

import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

export default function TestAuthPage() {
  const { data: session, isPending, error } = useSession();

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      console.log("✅ Déconnexion réussie");
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Test d'Authentification Better Auth</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">État du chargement:</h3>
            <p
              className={`px-2 py-1 rounded text-sm ${isPending ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}`}
            >
              {isPending ? "Chargement..." : "Chargé"}
            </p>
          </div>

          {error && (
            <div>
              <h3 className="font-semibold mb-2 text-red-600">Erreur:</h3>
              <p className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">
                {error.message}
              </p>
            </div>
          )}

          <div>
            <h3 className="font-semibold mb-2">Session:</h3>
            {session?.user ? (
              <div className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm space-y-1">
                <p>
                  <strong>ID:</strong> {session.user.id}
                </p>
                <p>
                  <strong>Email:</strong> {session.user.email}
                </p>
                <p>
                  <strong>Nom:</strong> {session.user.name}
                </p>
                <p>
                  <strong>Email vérifié:</strong>{" "}
                  {session.user.emailVerified ? "Oui" : "Non"}
                </p>
              </div>
            ) : (
              <p className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">
                Aucune session active
              </p>
            )}
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">Actions:</h3>

            {session?.user ? (
              <Button
                onClick={handleSignOut}
                variant="outline"
                className="w-full"
              >
                Se déconnecter
              </Button>
            ) : (
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <a href="/signin">Se connecter</a>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <a href="/signup">S'inscrire</a>
                </Button>
              </div>
            )}
          </div>

          <div>
            <h3 className="font-semibold mb-2">Debug:</h3>
            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto max-h-32">
              {JSON.stringify(
                {
                  hasSession: !!session,
                  isPending,
                  hasError: !!error,
                  userCount: session?.user ? 1 : 0,
                },
                null,
                2
              )}
            </pre>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

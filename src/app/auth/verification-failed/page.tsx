// src/app/auth/verification-failed/page.tsx
export default function VerificationFailedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="w-full max-w-md p-8 space-y-8 bg-card rounded-lg shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-foreground">
            Échec de la vérification
          </h2>
          <p className="mt-2 text-muted-foreground">
            Nous n&apos;avons pas pu vérifier votre adresse email. Le lien a
            peut-être expiré ou est invalide.
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="flex items-center justify-center">
            <a
              href="/resend-verification"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Renvoyer un email de vérification
            </a>
          </div>
          <div className="flex items-center justify-center">
            <a
              href="/signin"
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Retour à la connexion
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

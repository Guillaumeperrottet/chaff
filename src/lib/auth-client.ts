import { createAuthClient } from "better-auth/react";

const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_MODE === "true";

export const authClient = createAuthClient({
  baseURL:
    typeof window !== "undefined"
      ? `${window.location.origin}/api/auth`
      : isDev
        ? "http://localhost:3000/api/auth"
        : process.env.BETTER_AUTH_URL || "https://chaff.vercel.app/api/auth",
});

// Export des hooks et actions directement depuis Better Auth
export const { useSession, signIn, signOut, signUp } = authClient;

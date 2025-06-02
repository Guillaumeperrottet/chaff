// src/hooks/useAdminStats.ts
import useSWR from "swr";

// Fetcher simple sans cache (cohérent avec useData.tsx)
class FetchError extends Error {
  info?: unknown;
  status?: number;

  constructor(message: string, status?: number, info?: unknown) {
    super(message);
    this.name = "FetchError";
    this.status = status;
    this.info = info;
  }
}

export interface AdminStats {
  totalUsers: number;
  totalOrganizations: number;
  activeSubscriptions: number;
  totalObjects: number;
  totalTasks: number;
  recentUsers: number;
  systemHealth: "good" | "warning" | "critical";
  avgUsersPerOrganization: number;
  avgObjectsPerOrganization: number;
  subscriptionRate: number;
  growth: {
    users: number;
    usersPercentage: number;
  };
}

export interface AdminStatsResponse {
  stats: AdminStats;
}

// Fetcher pour les statistiques admin (cohérent avec useData.tsx)
const fetcher = async (url: string): Promise<AdminStatsResponse> => {
  const response = await fetch(url);

  if (!response.ok) {
    const info = await response.json().catch(() => null);
    throw new FetchError(
      `Erreur ${response.status}: ${response.statusText}`,
      response.status,
      info
    );
  }

  return response.json();
};

/**
 * Hook pour récupérer les statistiques du dashboard admin
 */
export function useAdminStats() {
  const { data, error, mutate } = useSWR<AdminStatsResponse>(
    "/api/admin/stats",
    fetcher,
    {
      refreshInterval: 30000, // Actualiser toutes les 30 secondes
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      errorRetryCount: 3,
      errorRetryInterval: 5000,
    }
  );

  return {
    stats: data?.stats,
    isLoading: !error && !data,
    isError: !!error,
    error,
    mutate, // Pour forcer une actualisation manuelle
    refresh: () => mutate(), // Alias plus simple
  };
}

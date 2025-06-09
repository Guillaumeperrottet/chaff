// src/hooks/usePayrollApi.ts - Hook pour appeler les APIs payroll protégées
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function usePayrollApi() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const callProtectedApi = async (endpoint: string, options?: RequestInit) => {
    setLoading(true);

    try {
      const response = await fetch(endpoint, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        // Gestion des erreurs d'accès spécifiques
        if (data.code === "FEATURE_ACCESS_DENIED") {
          toast.error("Fonctionnalité Premium requise", {
            description: data.message,
            action: {
              label: "Voir les plans",
              onClick: () => router.push(data.details.upgradeUrl),
            },
            duration: 8000,
          });

          return { error: true, data: null, errorType: "ACCESS_DENIED" };
        }

        if (data.code === "AUTH_REQUIRED") {
          toast.error("Connexion requise", {
            description:
              "Veuillez vous connecter pour accéder à cette fonctionnalité",
            action: {
              label: "Se connecter",
              onClick: () => router.push("/signin"),
            },
          });

          return { error: true, data: null, errorType: "AUTH_REQUIRED" };
        }

        throw new Error(data.message || "Erreur API");
      }

      return { error: false, data: data.data || data };
    } catch (error) {
      console.error("Erreur API:", error);
      toast.error("Erreur de connexion", {
        description:
          error instanceof Error
            ? error.message
            : "Une erreur inattendue s'est produite",
      });
      return { error: true, data: null, errorType: "NETWORK_ERROR" };
    } finally {
      setLoading(false);
    }
  };

  // APIs spécifiques pour payroll
  const importGastrotime = (file: File, mandateId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mandateId", mandateId);

    return callProtectedApi("/api/payroll/import/gastrotime", {
      method: "POST",
      body: formData,
      headers: {}, // Pas de Content-Type pour FormData
    });
  };

  const simpleImport = (
    file: File,
    mandateId: string,
    period: string,
    defaultHourlyRate: number
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mandateId", mandateId);
    formData.append("period", period);
    formData.append("defaultHourlyRate", defaultHourlyRate.toString());

    return callProtectedApi("/api/payroll/simple-import", {
      method: "POST",
      body: formData,
      headers: {},
    });
  };

  const validateImport = (
    file: File,
    mandateId: string,
    defaultHourlyRate: number
  ) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("mandateId", mandateId);
    formData.append("defaultHourlyRate", defaultHourlyRate.toString());

    return callProtectedApi("/api/payroll/validate-import", {
      method: "POST",
      body: formData,
      headers: {},
    });
  };

  const confirmedImport = (importData: {
    mandateId: string;
    period: string;
    employees: Array<{
      name: string;
      hours: number;
      rate: number;
    }>;
  }) =>
    callProtectedApi("/api/payroll/confirmed-import", {
      method: "POST",
      body: JSON.stringify(importData),
    });

  const calculatePayroll = (calculationData: {
    mandateId?: string;
    periodStart: string;
    periodEnd: string;
    periodType: "WEEKLY" | "MONTHLY";
    recalculate?: boolean;
  }) =>
    callProtectedApi("/api/payroll/calculate", {
      method: "POST",
      body: JSON.stringify(calculationData),
    });

  return {
    loading,
    callProtectedApi,
    importGastrotime,
    simpleImport,
    validateImport,
    confirmedImport,
    calculatePayroll,
  };
}

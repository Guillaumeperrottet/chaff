// src/app/components/UsageLimits.tsx - Version nettoyée
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import {
  Users,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  BarChart3,
} from "lucide-react";

interface LimitData {
  current: number;
  limit: number | null;
  unlimited: boolean;
  percentage?: number;
  remaining?: number;
}

interface UsageLimitsData {
  users: LimitData;
  storage: LimitData;
}

export default function UsageLimits() {
  const [limits, setLimits] = useState<UsageLimitsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        setIsLoading(true);

        // Récupérer les limites utilisateurs
        const usersResponse = await fetch("/api/limits/users");
        const usersData = await usersResponse.json();

        // Récupérer les limites de stockage
        const storageResponse = await fetch("/api/limits/storage");
        const storageData = await storageResponse.json();

        setLimits({
          users: usersData,
          storage: storageData,
        });
      } catch (err) {
        setError("Erreur lors du chargement des limites");
        console.error("Erreur limites:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLimits();
  }, []);

  const formatStorage = (bytes: number) => {
    if (bytes === 0) return "0 MB";
    const mb = bytes / (1024 * 1024);
    if (mb < 1024) return `${mb.toFixed(1)} MB`;
    const gb = mb / 1024;
    return `${gb.toFixed(1)} GB`;
  };

  const getStatusIcon = (percentage?: number) => {
    if (!percentage) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (percentage >= 90)
      return <AlertTriangle className="h-4 w-4 text-red-600" />;
    if (percentage >= 75)
      return <AlertTriangle className="h-4 w-4 text-orange-600" />;
    return <CheckCircle className="h-4 w-4 text-green-600" />;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Utilisation actuelle</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
            <p>{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!limits) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Utilisation actuelle
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Utilisateurs */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium">Utilisateurs</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(limits.users.percentage)}
                <span className="text-sm text-gray-600">
                  {limits.users.current}
                  {limits.users.unlimited
                    ? " (illimité)"
                    : ` / ${limits.users.limit}`}
                </span>
              </div>
            </div>

            {!limits.users.unlimited && (
              <>
                <Progress
                  value={limits.users.percentage || 0}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{limits.users.percentage || 0}% utilisé</span>
                  <span>{limits.users.remaining} disponible(s)</span>
                </div>
              </>
            )}

            {limits.users.unlimited && (
              <Badge
                variant="secondary"
                className="text-green-700 bg-green-100"
              >
                Utilisateurs illimités
              </Badge>
            )}
          </div>

          {/* Stockage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="h-4 w-4 text-purple-600" />
                <span className="font-medium">Stockage</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(limits.storage.percentage)}
                <span className="text-sm text-gray-600">
                  {formatStorage(limits.storage.current)}
                  {limits.storage.unlimited
                    ? " (illimité)"
                    : ` / ${formatStorage(limits.storage.limit || 0)}`}
                </span>
              </div>
            </div>

            {!limits.storage.unlimited && (
              <>
                <Progress
                  value={limits.storage.percentage || 0}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{limits.storage.percentage || 0}% utilisé</span>
                  <span>
                    {formatStorage(limits.storage.remaining || 0)} disponible
                  </span>
                </div>
              </>
            )}

            {limits.storage.unlimited && (
              <Badge
                variant="secondary"
                className="text-green-700 bg-green-100"
              >
                Stockage illimité
              </Badge>
            )}
          </div>

          {/* Alertes si proche des limites */}
          {((limits.users.percentage && limits.users.percentage >= 90) ||
            (limits.storage.percentage && limits.storage.percentage >= 90)) && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Limites bientôt atteintes
                  </p>
                  <p className="text-xs text-red-700 mt-1">
                    Considérez une mise à niveau vers le plan Premium pour plus
                    de capacité.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

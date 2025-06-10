// src/app/components/UsageLimits.tsx - Version mise à jour avec support des mandats
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import {
  Users,
  HardDrive,
  Building2, // ✨ NOUVEAU: Icône pour les mandats
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Crown,
} from "lucide-react";
import Link from "next/link";

interface LimitData {
  current: number;
  limit: number | null;
  unlimited: boolean;
  percentage?: number;
  remaining?: number;
}

interface UsageLimitsData {
  planName: string;
  planId: string;
  isActive: boolean;
  limits: {
    users: LimitData;
    storage: LimitData;
    mandates: LimitData; // ✨ NOUVEAU
  };
}

export default function UsageLimits() {
  const [limitsData, setLimitsData] = useState<UsageLimitsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLimits = async () => {
      try {
        setIsLoading(true);

        // ✨ NOUVEAU: Utiliser la nouvelle route de résumé
        const response = await fetch("/api/limits/summary");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Erreur lors du chargement");
        }

        setLimitsData(data);
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

  // ✨ NOUVEAU: Helper pour obtenir le nom d'affichage du plan
  const getPlanDisplayName = (planName: string) => {
    switch (planName) {
      case "FREE":
        return "Gratuit";
      case "PREMIUM":
        return "Premium";
      case "SUPER_ADMIN":
        return "Super Admin";
      default:
        return planName;
    }
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

  if (!limitsData) return null;

  const { limits, planName } = limitsData;
  const nearLimits = [limits.users, limits.mandates, limits.storage].some(
    (limit) => limit.percentage && limit.percentage >= 90
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Utilisation actuelle
          <Badge
            variant={planName === "FREE" ? "secondary" : "default"}
            className={`ml-2 ${
              planName === "PREMIUM"
                ? "bg-blue-100 text-blue-700"
                : planName === "SUPER_ADMIN"
                  ? "bg-purple-100 text-purple-700"
                  : ""
            }`}
          >
            {planName === "SUPER_ADMIN" && <Crown className="h-3 w-3 mr-1" />}
            {getPlanDisplayName(planName)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* ✨ NOUVEAU: Mandats/Entreprises */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="h-4 w-4 text-orange-600" />
                <span className="font-medium">Entreprises/Mandats</span>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(limits.mandates.percentage)}
                <span className="text-sm text-gray-600">
                  {limits.mandates.current}
                  {limits.mandates.unlimited
                    ? " (illimité)"
                    : ` / ${limits.mandates.limit}`}
                </span>
              </div>
            </div>

            {!limits.mandates.unlimited && (
              <>
                <Progress
                  value={limits.mandates.percentage || 0}
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{limits.mandates.percentage || 0}% utilisé</span>
                  <span>{limits.mandates.remaining} disponible(s)</span>
                </div>
              </>
            )}

            {limits.mandates.unlimited && (
              <Badge
                variant="secondary"
                className="text-green-700 bg-green-100"
              >
                Entreprises illimitées
              </Badge>
            )}
          </div>

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

          {/* Alerte discrète si proche des limites */}
          {nearLimits && planName === "FREE" && (
            <div className="mt-4 p-3 bg-amber-50 border-l-4 border-amber-400 rounded">
              <p className="text-sm text-amber-800">
                Vous approchez des limites de votre plan.{" "}
                <Link href="/pricing" className="underline hover:no-underline">
                  Voir les options
                </Link>
              </p>
            </div>
          )}

          {/* Message critique si limites dépassées */}
          {((limits.users.percentage && limits.users.percentage >= 100) ||
            (limits.mandates.percentage && limits.mandates.percentage >= 100) ||
            (limits.storage.percentage &&
              limits.storage.percentage >= 100)) && (
            <div className="mt-4 p-3 bg-red-50 border-l-4 border-red-400 rounded">
              <p className="text-sm text-red-800">
                Limites atteintes. Certaines fonctionnalités peuvent être
                restreintes.{" "}
                <Link
                  href="/profile/subscription"
                  className="underline hover:no-underline"
                >
                  Gérer l&apos;abonnement
                </Link>
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

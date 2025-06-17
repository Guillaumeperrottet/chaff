"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  ArrowLeft,
  Building2,
  DollarSign,
  TrendingUp,
  Calculator,
  BarChart3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface MandateBreakdown {
  id: string;
  name: string;
  group: string;
  totalRevenue: number;
  totalPayroll: number;
  contribution: number;
}

interface PeriodData {
  year: number;
  month: number;
  label: string;
  totalValue: number;
  averageDaily: number;
  daysWithData: number;
}

interface GlobalCAResponse {
  organization: {
    name: string;
    totalMandates: number;
  };
  periods: PeriodData[];
  summary: {
    totalPeriods: number;
    grandTotal: number;
    averagePerPeriod: number;
    bestPeriod: PeriodData;
    worstPeriod: PeriodData;
    totalPayrollCost: number;
    globalPayrollRatio: number | null;
    yearOverYearGrowth: {
      revenue: number | null;
      payroll: number | null;
    };
    mandatesBreakdown: MandateBreakdown[];
  };
  meta: {
    year: number;
    startMonth: number;
    period: string;
    generatedAt: string;
  };
}

export default function GlobalCAPage() {
  const router = useRouter();

  const [caData, setCaData] = useState<GlobalCAResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedSemester, setSelectedSemester] = useState(() => {
    const currentMonth = new Date().getMonth() + 1;
    return currentMonth <= 6 ? "1" : "2";
  });

  useEffect(() => {
    const loadGlobalCAData = async () => {
      try {
        setLoading(true);
        const startMonth = selectedSemester === "1" ? 1 : 7;
        const endMonth = selectedSemester === "1" ? 6 : 12;

        const response = await fetch(
          `/api/mandats/ca-global?year=${selectedYear}&startMonth=${startMonth}&endMonth=${endMonth}&period=6months`
        );

        if (!response.ok) {
          throw new Error("Erreur lors du chargement des données CA globales");
        }

        const data = await response.json();
        setCaData(data);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Erreur lors du chargement des données");
      } finally {
        setLoading(false);
      }
    };

    loadGlobalCAData();
  }, [selectedYear, selectedSemester]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-CH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!caData) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aucune donnée CA trouvée</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardHeader className="bg-white/50 border-b border-emerald-200 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push("/dashboard")}
                className="flex-shrink-0 hover:bg-emerald-100"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>

              <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg">
                <Building2 className="h-6 w-6" />
              </div>

              <div>
                <CardTitle className="text-2xl font-bold text-gray-900">
                  CA Global - Vue d&apos;ensemble
                </CardTitle>
                <div className="text-sm text-gray-600">
                  {caData.organization?.totalMandates || 0} mandats actifs •{" "}
                  {selectedSemester === "1" ? "1er" : "2ème"} semestre{" "}
                  {selectedYear}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={selectedSemester}
                onValueChange={setSelectedSemester}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Semestre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1er Semestre</SelectItem>
                  <SelectItem value="2">2ème Semestre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">CA Total Global</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(caData.summary?.grandTotal || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Mandats Actifs</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {caData.organization?.totalMandates || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Meilleur Mois</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(caData.summary?.bestPeriod?.totalValue || 0)}
            </div>
            <div className="text-sm text-muted-foreground">
              {caData.summary?.bestPeriod?.label || "-"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Masse Salariale</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(caData.summary?.totalPayrollCost || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Répartition par mandat
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {caData.summary?.mandatesBreakdown?.map(
              (mandate: MandateBreakdown) => (
                <div
                  key={mandate.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                      {mandate.name?.charAt(0)?.toUpperCase() || "M"}
                    </div>
                    <div>
                      <div className="font-medium">{mandate.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {mandate.group}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      {formatCurrency(mandate.totalRevenue || 0)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {mandate.contribution
                        ? `${mandate.contribution.toFixed(1)}%`
                        : "0%"}{" "}
                      du total
                    </div>
                  </div>
                </div>
              )
            ) || (
              <div className="text-center text-muted-foreground">
                Aucun mandat trouvé
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

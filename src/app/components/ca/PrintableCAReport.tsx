"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  TrendingUp,
  TrendingDown,
  Calculator,
  DollarSign,
  BarChart3,
} from "lucide-react";

// Types pour les données CA
interface DayCAData {
  date: string;
  value: number;
  formattedDate: string;
}

interface PayrollData {
  year: number;
  month: number;
  grossAmount: number;
  socialCharges: number;
  totalCost: number;
  employeeCount?: number;
}

interface PeriodData {
  year: number;
  month: number;
  label: string;
  totalValue: number;
  dailyValues: DayCAData[];
  previousYearDailyValues: DayCAData[];
  averageDaily: number;
  daysWithData: number;
  cumulativeTotal?: number;
  cumulativePayroll?: number;
  cumulativePreviousYearRevenue?: number;
  cumulativePreviousYearPayroll?: number;
  cumulativeRevenueGrowth?: number | null;
  cumulativePayrollGrowth?: number | null;
  payrollData?: PayrollData;
  payrollToRevenueRatio?: number;
  yearOverYear: {
    previousYearRevenue: number;
    previousYearPayroll?: number;
    revenueGrowth: number | null;
    payrollGrowth: number | null;
  };
}

interface CAResponse {
  mandate: {
    id: string;
    name: string;
    group: string;
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
  };
  meta: {
    year: number;
    startMonth: number;
    period: string;
    generatedAt: string;
  };
}

interface PrintableCAReportProps {
  caData: CAResponse;
  selectedYear: string;
}

export default function PrintableCAReport({
  caData,
  selectedYear,
}: PrintableCAReportProps) {
  // Utilitaires de formatage
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("fr-CH", {
      style: "decimal",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      useGrouping: true, // Active les séparateurs de milliers
    }).format(amount);
  };

  const formatPercentage = (value: number | null, showSign = true) => {
    if (value === null) return "-";
    const formatted = Math.abs(value).toFixed(1);
    const sign = value >= 0 ? "+" : "-";
    const color = value >= 0 ? "text-green-600" : "text-red-600";
    return (
      <span className={color}>
        {showSign && sign}
        {formatted}%
      </span>
    );
  };

  const getGrowthIcon = (value: number | null) => {
    if (value === null) return null;
    return value >= 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : (
      <TrendingDown className="h-4 w-4 text-red-600" />
    );
  };

  // Créer la structure de données pour le tableau
  const tableData = () => {
    if (!caData) return { rows: [], totals: {}, payrollTotals: {}, ratios: {} };

    // Obtenir tous les jours uniques
    const allDays = new Set<number>();
    caData.periods.forEach((period) => {
      period.dailyValues.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
      period.previousYearDailyValues?.forEach((dv) => {
        const day = new Date(dv.date).getDate();
        allDays.add(day);
      });
    });

    const sortedDays = Array.from(allDays).sort((a, b) => a - b);

    // Construire les lignes du tableau
    const rows = sortedDays.map((day) => {
      const values: Record<string, { current: number; previous: number }> = {};

      caData.periods.forEach((period, index) => {
        const dayValue = period.dailyValues.find(
          (dv) => new Date(dv.date).getDate() === day
        );
        const previousDayValue = period.previousYearDailyValues?.find(
          (dv) => new Date(dv.date).getDate() === day
        );

        values[`period_${index}`] = {
          current: dayValue?.value || 0,
          previous: previousDayValue?.value || 0,
        };
      });

      return { day, values };
    });

    // Calculer les totaux
    const totals: Record<string, { current: number; previous: number }> = {};
    const payrollTotals: Record<string, { current: number; previous: number }> =
      {};
    const ratios: Record<string, { current: number; previous: number }> = {};

    caData.periods.forEach((period, index) => {
      totals[`period_${index}`] = {
        current: period.totalValue,
        previous: period.yearOverYear.previousYearRevenue,
      };

      payrollTotals[`period_${index}`] = {
        current: period.payrollData?.totalCost || 0,
        previous: period.yearOverYear.previousYearPayroll || 0,
      };

      const currentRatio = period.payrollToRevenueRatio || 0;
      const previousRatio =
        period.yearOverYear.previousYearRevenue > 0 &&
        period.yearOverYear.previousYearPayroll
          ? (period.yearOverYear.previousYearPayroll /
              period.yearOverYear.previousYearRevenue) *
            100
          : 0;

      ratios[`period_${index}`] = {
        current: currentRatio,
        previous: previousRatio,
      };
    });

    return { rows, totals, payrollTotals, ratios };
  };

  const { rows, totals, payrollTotals, ratios } = tableData();

  return (
    <div className="print-only-content">
      {/* Styles spécifiques pour l'impression */}
      <style jsx global>{`
        @media print {
          /* Cacher TOUS les éléments non nécessaires pour l'impression */
          nav,
          header,
          .navbar,
          .print-hidden,
          .sidebar,
          .footer,
          .breadcrumb,
          .navigation,
          .menu,
          .toolbar,
          button:not(.print-keep),
          .action-buttons,
          .header-actions,
          .page-header,
          .search-bar,
          .filters,
          .modal,
          .tooltip,
          .dropdown,
          .user-menu,
          .notifications,
          .layout-wrapper,
          .main-content:not(.print-only-content),
          .dashboard-wrapper {
            display: none !important;
          }

          /* S'assurer que notre contenu d'impression est le seul visible */
          .print-only-content {
            display: block !important;
            visibility: visible !important;
            position: relative !important;
            z-index: 99999 !important;
          }

          /* Cacher tout contenu qui n'est pas dans les pages d'impression */
          body > *:not(.print-only-content) {
            display: none !important;
          }

          /* Alternative : utiliser visibility au lieu de display */
          body * {
            visibility: hidden;
          }

          .print-only-content,
          .print-only-content * {
            visibility: visible !important;
          }

          /* Forcer le body à occuper toute la page */
          body {
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
            background: white !important;
          }

          /* S'assurer que seules nos pages d'impression sont visibles */
          .print-table-page,
          .print-stats-page {
            display: block !important;
            visibility: visible !important;
          }

          /* Page 1: Tableau uniquement - Isolation complète */
          .print-table-page {
            page-break-after: always;
            height: 100vh;
            width: 100%;
            margin: 0;
            padding: 0.5cm;
            position: relative;
            z-index: 9999;
            background: white !important;
            isolation: isolate;
          }

          /* Page 2: Statistiques uniquement - Isolation complète */
          .print-stats-page {
            page-break-before: always;
            height: 100vh;
            width: 100%;
            margin: 0;
            padding: 0.3cm;
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 9999;
            background: white !important;
            isolation: isolate;
          }

          /* Optimiser le tableau pour l'impression */
          .print-table {
            font-size: 5px !important;
            width: 100% !important;
            margin: 0 !important;
            line-height: 1 !important;
          }

          .print-table th,
          .print-table td {
            padding: 1px !important;
            border: 0.5px solid #333 !important;
            font-size: 5px !important;
            line-height: 1 !important;
          }

          .print-table th {
            font-size: 4px !important;
            font-weight: bold !important;
          }

          .print-table tr {
            height: auto !important;
            min-height: 8px !important;
          }

          .print-table .sticky {
            width: 20px !important;
          }

          .print-table .month-col {
            width: 35px !important;
          }

          /* Page 2: Statistiques ultra-compactes */
          .print-stats-page {
            page-break-before: always;
            height: 100vh;
            width: 100%;
            margin: 0;
            padding: 0.3cm;
            display: flex;
            flex-direction: column;
            position: relative;
            z-index: 9999;
            background: white !important;
            isolation: isolate;
          }

          .print-stats {
            page-break-inside: avoid;
            margin-top: 0 !important;
            flex: 1;
            font-size: 5px !important;
            line-height: 1 !important;
            position: relative;
            z-index: 10000;
          }

          .print-stats .grid {
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 3px !important;
          }

          .print-stats .grid > * {
            font-size: 5px !important;
            padding: 3px !important;
            line-height: 1 !important;
          }

          .print-stats .text-2xl {
            font-size: 7px !important;
            line-height: 1 !important;
            font-weight: bold !important;
          }

          .print-stats .text-xl {
            font-size: 6px !important;
            line-height: 1 !important;
          }

          .print-stats .text-lg {
            font-size: 6px !important;
            line-height: 1 !important;
            font-weight: 600 !important;
          }

          .print-stats .text-base {
            font-size: 5px !important;
            line-height: 1 !important;
          }

          .print-stats .text-sm {
            font-size: 4px !important;
            line-height: 1 !important;
          }

          .print-stats .text-xs {
            font-size: 3px !important;
            line-height: 1 !important;
          }

          .print-stats .space-y-6 > * + * {
            margin-top: 4px !important;
          }

          .print-stats .space-y-4 > * + * {
            margin-top: 2px !important;
          }

          .print-stats .space-y-2 > * + * {
            margin-top: 1px !important;
          }

          .print-stats .mb-4 {
            margin-bottom: 2px !important;
          }

          .print-stats .mb-2 {
            margin-bottom: 1px !important;
          }

          .print-stats .p-6 {
            padding: 3px !important;
          }

          .print-stats .gap-4 {
            gap: 2px !important;
          }

          .print-stats .gap-2 {
            gap: 1px !important;
          }

          .print-stats .h-5 {
            height: 4px !important;
            width: 4px !important;
          }

          .print-stats .h-4 {
            height: 3px !important;
            width: 3px !important;
          }

          .print-stats .border {
            border: 0.5px solid #ddd !important;
          }

          .print-stats .rounded-lg {
            border-radius: 1px !important;
          }

          .print-stats .shadow-sm {
            box-shadow: none !important;
          }

          .print-stats
            .flex.flex-row.items-center.justify-between.space-y-0.pb-2 {
            padding-bottom: 0 !important;
            margin-bottom: 1px !important;
          }

          .print-stats .space-y-2 {
            margin-top: 0 !important;
          }

          .print-stats .space-y-2 > * {
            margin-top: 0 !important;
          }

          .print-stats .space-y-2 > * + * {
            margin-top: 1px !important;
          }

          .print-stats .flex.items-center {
            gap: 1px !important;
          }

          .print-stats .flex.items-center.gap-2 {
            gap: 1px !important;
          }

          .print-stats .md\\:grid-cols-2,
          .print-stats .lg\\:grid-cols-4 {
            grid-template-columns: repeat(4, 1fr) !important;
          }

          .print-stats [class*="CardHeader"] {
            padding: 1px !important;
          }

          .print-stats [class*="CardContent"] {
            padding: 1px !important;
          }

          .print-title h1 {
            font-size: 8px !important;
            line-height: 1 !important;
            font-weight: bold !important;
            margin-bottom: 2px !important;
          }

          .print-title p {
            font-size: 5px !important;
            line-height: 1 !important;
            margin-bottom: 2px !important;
          }

          .print-table tr {
            background-color: white !important;
          }

          .print-table td,
          .print-table th {
            border: 1px solid #333 !important;
          }

          @page {
            margin: 0.3cm;
            size: A4 landscape;
          }

          /* Assurer que seules nos pages sont visibles */
          @media print {
            html,
            body {
              overflow: hidden !important;
              margin: 0 !important;
              padding: 0 !important;
            }
          }

          .print-table-page {
            height: auto !important;
            min-height: 100vh;
            overflow: hidden;
            position: relative;
            z-index: 10000;
          }

          .print-table * {
            margin: 0 !important;
            padding: 1px !important;
          }

          .print-table th,
          .print-table td {
            width: 30px !important;
            max-width: 30px !important;
            min-width: 30px !important;
            font-size: 4px !important;
            line-height: 0.8 !important;
            padding: 0.5px !important;
          }

          .print-table th:first-child,
          .print-table td:first-child {
            width: 15px !important;
            max-width: 15px !important;
            min-width: 15px !important;
          }

          .print-title {
            text-align: center;
            margin-bottom: 10px !important;
            font-size: 12px !important;
            line-height: 1.2 !important;
          }

          .print-title h1 {
            font-size: 14px !important;
            margin-bottom: 5px !important;
          }

          .print-title p {
            font-size: 10px !important;
            margin: 0 !important;
          }
        }
      `}</style>

      {/* PAGE 1: Tableau uniquement */}
      <div className="print-table-page">
        {/* Titre pour la page tableau */}
        <div className="hidden print:block print-title">
          <h1 className="text-xl font-bold mb-2">
            Analyse Chiffre d&apos;Affaires - {caData.mandate.name}
          </h1>
          <p className="text-sm text-gray-700 mb-4">
            Données détaillées par jour - {selectedYear} vs{" "}
            {parseInt(selectedYear) - 1}
          </p>
        </div>

        {/* Tableau optimisé pour l'année complète */}
        <div className="overflow-x-auto border rounded-lg print-table">
          <Table className="text-xs print-table">
            <TableHeader>
              <TableRow>
                <TableHead className="sticky left-0 bg-white border-r w-[50px] text-center text-xs p-1 print:w-[20px]">
                  Jour
                </TableHead>
                {caData.periods.map((period, index) => (
                  <TableHead
                    key={index}
                    className="text-center w-[120px] border-r px-1 py-1 month-col print:w-[35px]"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-xs print:text-[4px]">
                        {period.label.split(" ")[0]}
                      </div>
                      <div className="text-[10px] print:text-[3px]">
                        {period.label.split(" ")[1]}
                      </div>
                      <div className="flex justify-between text-[10px] text-muted-foreground print:text-[3px]">
                        <span>Curr</span>
                        <span>Prev</span>
                      </div>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.day} className="h-6 print:h-auto">
                  <TableCell className="sticky left-0 bg-white border-r font-medium text-center py-0.5 text-xs p-1 print:text-[5px] print:p-0">
                    {row.day.toString().padStart(2, "0")}
                  </TableCell>
                  {caData.periods.map((_, index) => (
                    <TableCell
                      key={index}
                      className="text-center border-r px-0.5 py-0.5 whitespace-nowrap print:text-[4px] print:p-0"
                    >
                      <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                        <div className="flex-1 text-left">
                          {row.values[`period_${index}`]?.current > 0
                            ? (
                                row.values[`period_${index}`].current / 1000
                              ).toFixed(0) + "k"
                            : "-"}
                        </div>
                        <div className="flex-1 text-right text-muted-foreground">
                          {row.values[`period_${index}`]?.previous > 0
                            ? (
                                row.values[`period_${index}`].previous / 1000
                              ).toFixed(0) + "k"
                            : "-"}
                        </div>
                      </div>
                    </TableCell>
                  ))}
                </TableRow>
              ))}

              {/* Lignes récapitulatives */}
              <TableRow className="bg-blue-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-blue-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Total CA
                  </span>
                </TableCell>
                {caData.periods.map((_, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                      <div className="flex-1 text-left font-bold text-blue-700">
                        {(
                          ((
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.current || 0) / 1000
                        ).toFixed(0)}
                        k
                      </div>
                      <div className="flex-1 text-right text-blue-600">
                        {(
                          ((
                            totals as Record<
                              string,
                              { current: number; previous: number }
                            >
                          )[`period_${index}`]?.previous || 0) / 1000
                        ).toFixed(0)}
                        k
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne masse salariale */}
              <TableRow className="bg-green-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-green-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Masse Sal.
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                      <div className="flex-1 text-left">
                        {period.payrollData ? (
                          <div className="space-y-0.5 print:space-y-0">
                            <div className="font-bold text-green-700">
                              {(period.payrollData.totalCost / 1000).toFixed(0)}
                              k
                            </div>
                            {period.payrollData.employeeCount && (
                              <div className="text-[9px] text-green-600 print:text-[3px]">
                                {period.payrollData.employeeCount}emp
                              </div>
                            )}
                          </div>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="flex-1 text-right text-green-600">
                        {(
                          payrollTotals as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.previous > 0
                          ? (
                              (
                                payrollTotals as Record<
                                  string,
                                  { current: number; previous: number }
                                >
                              )[`period_${index}`].previous / 1000
                            ).toFixed(0) + "k"
                          : "-"}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne ratio */}
              <TableRow className="bg-yellow-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-yellow-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Ratio %
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[10px] print:text-[4px] print:space-x-0">
                      <div className="flex-1 text-left">
                        {period.payrollToRevenueRatio ? (
                          <span
                            className={`font-medium ${
                              period.payrollToRevenueRatio < 30
                                ? "text-green-700"
                                : period.payrollToRevenueRatio < 50
                                  ? "text-yellow-700"
                                  : "text-red-700"
                            }`}
                          >
                            {period.payrollToRevenueRatio.toFixed(0)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="flex-1 text-right">
                        {((
                          ratios as Record<
                            string,
                            { current: number; previous: number }
                          >
                        )[`period_${index}`]?.previous || 0) > 0 ? (
                          <span
                            className={`${
                              ((
                                ratios as Record<
                                  string,
                                  { current: number; previous: number }
                                >
                              )[`period_${index}`]?.previous || 0) < 30
                                ? "text-green-600"
                                : ((
                                      ratios as Record<
                                        string,
                                        { current: number; previous: number }
                                      >
                                    )[`period_${index}`]?.previous || 0) < 50
                                  ? "text-yellow-600"
                                  : "text-red-600"
                            }`}
                          >
                            {(
                              (
                                ratios as Record<
                                  string,
                                  { current: number; previous: number }
                                >
                              )[`period_${index}`]?.previous || 0
                            ).toFixed(0)}
                            %
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne évolution */}
              <TableRow className="bg-purple-50 font-medium print:bg-white">
                <TableCell className="sticky left-0 bg-purple-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Évolution
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="space-y-0.5 print:space-y-0">
                      <div className="flex items-center justify-center gap-0.5 print:gap-0">
                        {getGrowthIcon(period.yearOverYear.revenueGrowth)}
                        <span className="text-[9px] font-medium print:text-[3px]">
                          {period.yearOverYear.revenueGrowth !== null
                            ? (period.yearOverYear.revenueGrowth >= 0
                                ? "+"
                                : "") +
                              period.yearOverYear.revenueGrowth.toFixed(0) +
                              "%"
                            : "-"}
                        </span>
                      </div>
                      {period.yearOverYear.payrollGrowth !== null && (
                        <div className="flex items-center justify-center gap-0.5 print:gap-0">
                          {getGrowthIcon(period.yearOverYear.payrollGrowth)}
                          <span className="text-[9px] font-medium print:text-[3px]">
                            MS:{" "}
                            {(period.yearOverYear.payrollGrowth >= 0
                              ? "+"
                              : "") +
                              period.yearOverYear.payrollGrowth.toFixed(0)}
                            %
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne cumul */}
              <TableRow className="bg-gray-100 font-bold print:bg-white">
                <TableCell className="sticky left-0 bg-gray-100 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px]">
                    Cumul
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="space-y-0.5 text-[9px] print:text-[3px]">
                      {/* Année précédente */}
                      <div className="flex justify-between items-center space-x-0.5 text-gray-500">
                        <div className="flex-1 text-left">
                          {period.cumulativePreviousYearPayroll
                            ? `${(period.cumulativePreviousYearPayroll / 1000).toFixed(0)}k`
                            : "-"}
                        </div>
                        <div className="flex-1 text-right">
                          {period.cumulativePreviousYearRevenue
                            ? `${(period.cumulativePreviousYearRevenue / 1000).toFixed(0)}k`
                            : "-"}
                        </div>
                      </div>
                      {/* Année courante */}
                      <div className="flex justify-between items-center space-x-0.5">
                        <div className="flex-1 text-left text-green-700 font-bold">
                          {period.cumulativePayroll
                            ? `${(period.cumulativePayroll / 1000).toFixed(0)}k`
                            : "-"}
                        </div>
                        <div className="flex-1 text-right text-blue-700 font-bold">
                          {period.cumulativeTotal
                            ? `${(period.cumulativeTotal / 1000).toFixed(0)}k`
                            : "-"}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>

              {/* Ligne évolution du cumul */}
              <TableRow className="bg-emerald-50 font-bold print:bg-white">
                <TableCell className="sticky left-0 bg-emerald-50 border-r text-center py-1 p-1 print:bg-white print:text-[5px] print:p-0">
                  <span className="text-[10px] font-bold print:text-[4px] text-emerald-800">
                    Évol. Cumul %
                  </span>
                </TableCell>
                {caData.periods.map((period, index) => (
                  <TableCell
                    key={index}
                    className="text-center border-r px-0.5 py-1 whitespace-nowrap print:text-[4px] print:p-0"
                  >
                    <div className="flex justify-between items-center space-x-0.5 text-[9px] print:text-[3px]">
                      <div className="flex-1 text-left font-bold">
                        {period.cumulativePayrollGrowth !== null &&
                        period.cumulativePayrollGrowth !== undefined ? (
                          <span
                            className={
                              period.cumulativePayrollGrowth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {period.cumulativePayrollGrowth >= 0 ? "+" : ""}
                            {period.cumulativePayrollGrowth.toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                      <div className="flex-1 text-right font-bold">
                        {period.cumulativeRevenueGrowth !== null &&
                        period.cumulativeRevenueGrowth !== undefined ? (
                          <span
                            className={
                              period.cumulativeRevenueGrowth >= 0
                                ? "text-green-600"
                                : "text-red-600"
                            }
                          >
                            {period.cumulativeRevenueGrowth >= 0 ? "+" : ""}
                            {period.cumulativeRevenueGrowth.toFixed(1)}%
                          </span>
                        ) : (
                          "-"
                        )}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>

      {/* PAGE 2: Statistiques uniquement */}
      <div className="print-stats-page">
        <div className="hidden print:block print-title">
          <h1 className="text-xl font-bold mb-2">
            Indicateurs de Performance - {caData.mandate.name}
          </h1>
          <p className="text-sm text-gray-700 mb-4">
            Analyse statistique - {selectedYear} | Généré le{" "}
            {new Date().toLocaleDateString("fr-CH")}
          </p>
        </div>

        <div className="space-y-6 print-stats">
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              Indicateurs de performance {selectedYear}
            </h2>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    CA Total
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.grandTotal)}
                  </div>
                  {caData.summary.yearOverYearGrowth.revenue !== null && (
                    <div className="flex items-center text-xs">
                      {getGrowthIcon(caData.summary.yearOverYearGrowth.revenue)}
                      <span className="ml-1">
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth.revenue
                        )}{" "}
                        vs {parseInt(selectedYear) - 1}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Masse Salariale
                  </CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.totalPayrollCost)}
                  </div>
                  {caData.summary.yearOverYearGrowth.payroll !== null && (
                    <div className="flex items-center text-xs">
                      {getGrowthIcon(caData.summary.yearOverYearGrowth.payroll)}
                      <span className="ml-1">
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth.payroll
                        )}{" "}
                        vs {parseInt(selectedYear) - 1}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Ratio Global
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {caData.summary.globalPayrollRatio
                      ? formatPercentage(
                          caData.summary.globalPayrollRatio,
                          false
                        )
                      : "-"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Masse sal. / CA
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Meilleur Mois
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(caData.summary.bestPeriod.totalValue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {caData.summary.bestPeriod.label}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Statistiques détaillées */}
          <div className="bg-white rounded-lg border shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calculator className="h-5 w-5 text-green-600" />
              Analyse détaillée
            </h3>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Période analysée</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {caData.summary.totalPeriods} mois
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Moyenne mensuelle:{" "}
                      {formatCurrency(caData.summary.averagePerPeriod)}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Performance CA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-sm text-green-600">
                      Meilleur:{" "}
                      {formatCurrency(caData.summary.bestPeriod.totalValue)}
                    </div>
                    <div className="text-sm text-red-600">
                      Plus faible:{" "}
                      {formatCurrency(caData.summary.worstPeriod.totalValue)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Écart:{" "}
                      {formatCurrency(
                        caData.summary.bestPeriod.totalValue -
                          caData.summary.worstPeriod.totalValue
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Masse Salariale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="text-2xl font-bold">
                      {formatCurrency(caData.summary.totalPayrollCost)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Ratio global:{" "}
                      {caData.summary.globalPayrollRatio
                        ? formatPercentage(
                            caData.summary.globalPayrollRatio,
                            false
                          )
                        : "-"}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">
                    Évolution annuelle
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      {getGrowthIcon(caData.summary.yearOverYearGrowth.revenue)}
                      <span className="text-sm">
                        CA:{" "}
                        {formatPercentage(
                          caData.summary.yearOverYearGrowth.revenue
                        )}
                      </span>
                    </div>
                    {caData.summary.yearOverYearGrowth.payroll !== null && (
                      <div className="flex items-center gap-2">
                        {getGrowthIcon(
                          caData.summary.yearOverYearGrowth.payroll
                        )}
                        <span className="text-sm">
                          MS:{" "}
                          {formatPercentage(
                            caData.summary.yearOverYearGrowth.payroll
                          )}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

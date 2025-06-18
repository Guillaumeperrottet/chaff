"use client";

import React from "react";

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
    try {
      const formatted = new Intl.NumberFormat("de-CH", {
        style: "decimal",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
        useGrouping: true,
      }).format(amount);

      if (amount >= 1000 && !formatted.includes("'")) {
        const parts = amount.toFixed(2).split(".");
        const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
        return `${integerPart}.${parts[1]}`;
      }

      return formatted;
    } catch {
      const parts = amount.toFixed(2).split(".");
      const integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, "'");
      return `${integerPart}.${parts[1]}`;
    }
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
    <div className="print-report">
      <style jsx global>{`
        @media print {
          @page {
            margin: 8mm;
            size: A4 landscape;
          }

          /* Masquer TOUT le contenu de la page */
          * {
            visibility: hidden;
          }

          /* Rendre visible seulement le rapport d'impression et ses enfants */
          .print-report,
          .print-report * {
            visibility: visible;
          }

          /* Positionner le rapport d'impression en haut de la page */
          .print-report {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            font-family: Arial, sans-serif;
            color: black;
            background: white;
            font-size: 10px;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 7px;
            margin-bottom: 5px;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #333;
            padding: 1px;
            text-align: center;
            line-height: 1.1;
          }

          .print-table th {
            background-color: #f5f5f5;
            font-weight: bold;
            font-size: 6px;
          }

          .print-title {
            text-align: center;
            margin-bottom: 10px;
          }

          .print-title h1 {
            font-size: 14px;
            margin: 0 0 3px 0;
          }

          .print-title p {
            font-size: 10px;
            margin: 0;
          }

          .print-stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8px;
            margin-top: 10px;
          }

          .print-card {
            border: 1px solid #ddd;
            padding: 6px;
            border-radius: 4px;
            text-align: center;
          }

          .print-card-title {
            font-size: 9px;
            font-weight: bold;
            margin-bottom: 3px;
          }

          .print-card-value {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 2px;
          }

          .print-card-subtitle {
            font-size: 7px;
            color: #666;
          }

          .page-break {
            page-break-before: always;
          }
        }

        @media screen {
          .print-report {
            display: none;
          }
        }
      `}</style>

      {/* PAGE 1: Tableau des données */}
      <div>
        <div className="print-title">
          <h1>Analyse CA - {caData.mandate.name}</h1>
          <p>
            {selectedYear} vs {parseInt(selectedYear) - 1}
          </p>
        </div>

        <table className="print-table">
          <thead>
            <tr>
              <th>Jour</th>
              {caData.periods.map((period, index) => (
                <th key={index}>
                  {period.label}
                  <br />
                  (Act. / Préc.)
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.day}>
                <td>{row.day.toString().padStart(2, "0")}</td>
                {caData.periods.map((_, index) => (
                  <td key={index}>
                    {row.values[`period_${index}`]?.current > 0
                      ? formatCurrency(row.values[`period_${index}`].current)
                      : "-"}{" "}
                    /{" "}
                    {row.values[`period_${index}`]?.previous > 0
                      ? formatCurrency(row.values[`period_${index}`].previous)
                      : "-"}
                  </td>
                ))}
              </tr>
            ))}

            <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <td>TOTAL CA</td>
              {caData.periods.map((_, index) => (
                <td key={index}>
                  {formatCurrency(totals[`period_${index}`]?.current || 0)} /{" "}
                  {formatCurrency(totals[`period_${index}`]?.previous || 0)}
                </td>
              ))}
            </tr>

            <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <td>MOY/JOUR</td>
              {caData.periods.map((period, index) => (
                <td key={index}>
                  {period.daysWithData > 0
                    ? formatCurrency(period.averageDaily)
                    : "-"}{" "}
                  /{" "}
                  {period.yearOverYear.previousYearRevenue > 0
                    ? formatCurrency(
                        period.yearOverYear.previousYearRevenue /
                          (period.previousYearDailyValues?.filter(
                            (dv) => dv.value > 0
                          ).length || 1)
                      )
                    : "-"}
                </td>
              ))}
            </tr>

            <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <td>MASSE SAL.</td>
              {caData.periods.map((_, index) => (
                <td key={index}>
                  {formatCurrency(
                    payrollTotals[`period_${index}`]?.current || 0
                  )}{" "}
                  /{" "}
                  {formatCurrency(
                    payrollTotals[`period_${index}`]?.previous || 0
                  )}
                </td>
              ))}
            </tr>

            <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
              <td>RATIO %</td>
              {caData.periods.map((_, index) => (
                <td key={index}>
                  {ratios[`period_${index}`]?.current?.toFixed(1) || "-"}% /{" "}
                  {ratios[`period_${index}`]?.previous?.toFixed(1) || "-"}%
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* PAGE 2: Statistiques de performance */}
      <div className="page-break">
        <div className="print-title">
          <h1>Indicateurs de Performance</h1>
          <p>
            {caData.mandate.name} - {selectedYear}
          </p>
        </div>

        <div className="print-stats-grid">
          <div className="print-card">
            <div className="print-card-title">CA Total</div>
            <div className="print-card-value">
              {formatCurrency(caData.summary.grandTotal)}
            </div>
            {caData.summary.yearOverYearGrowth.revenue !== null && (
              <div className="print-card-subtitle">
                Évolution:{" "}
                {caData.summary.yearOverYearGrowth.revenue >= 0 ? "+" : ""}
                {caData.summary.yearOverYearGrowth.revenue?.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="print-card">
            <div className="print-card-title">Masse Salariale</div>
            <div className="print-card-value">
              {formatCurrency(caData.summary.totalPayrollCost)}
            </div>
            {caData.summary.yearOverYearGrowth.payroll !== null && (
              <div className="print-card-subtitle">
                Évolution:{" "}
                {caData.summary.yearOverYearGrowth.payroll >= 0 ? "+" : ""}
                {caData.summary.yearOverYearGrowth.payroll?.toFixed(1)}%
              </div>
            )}
          </div>

          <div className="print-card">
            <div className="print-card-title">Ratio Global</div>
            <div className="print-card-value">
              {caData.summary.globalPayrollRatio !== null
                ? `${caData.summary.globalPayrollRatio.toFixed(1)}%`
                : "N/A"}
            </div>
            <div className="print-card-subtitle">Masse salariale / CA</div>
          </div>

          <div className="print-card">
            <div className="print-card-title">Moyenne par Période</div>
            <div className="print-card-value">
              {formatCurrency(caData.summary.averagePerPeriod)}
            </div>
            <div className="print-card-subtitle">
              Sur {caData.summary.totalPeriods} périodes
            </div>
          </div>

          <div className="print-card">
            <div className="print-card-title">Meilleure Période</div>
            <div className="print-card-value">
              {formatCurrency(caData.summary.bestPeriod.totalValue)}
            </div>
            <div className="print-card-subtitle">
              {caData.summary.bestPeriod.label}
            </div>
          </div>

          <div className="print-card">
            <div className="print-card-title">Période la Plus Faible</div>
            <div className="print-card-value">
              {formatCurrency(caData.summary.worstPeriod.totalValue)}
            </div>
            <div className="print-card-subtitle">
              {caData.summary.worstPeriod.label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

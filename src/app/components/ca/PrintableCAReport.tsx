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
            margin: 15mm;
            size: A4 landscape;
          }

          .print-report {
            font-family: Arial, sans-serif;
            color: black;
            background: white;
          }

          .print-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
            margin-bottom: 20px;
          }

          .print-table th,
          .print-table td {
            border: 1px solid #333;
            padding: 4px 2px;
            text-align: center;
          }

          .print-table th {
            background-color: #f5f5f5;
            font-weight: bold;
          }

          .print-title {
            text-align: center;
            margin-bottom: 20px;
          }

          .print-stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-top: 20px;
          }

          .print-card {
            border: 1px solid #ddd;
            padding: 10px;
            border-radius: 4px;
          }

          .print-card-title {
            font-size: 11px;
            font-weight: bold;
            margin-bottom: 5px;
          }

          .print-card-value {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 3px;
          }

          .print-card-subtitle {
            font-size: 9px;
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

      <div className="print-title">
        <h1>Analyse Chiffre d&apos;Affaires - {caData.mandate.name}</h1>
        <p>
          Données détaillées par jour - {selectedYear} vs{" "}
          {parseInt(selectedYear) - 1}
        </p>
      </div>

      <table className="print-table">
        <thead>
          <tr>
            <th>Jour</th>
            {caData.periods.map((period, index) => (
              <th key={index}>
                <div>{period.label}</div>
                <div>Actuel / Précédent</div>
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
                  <div>
                    {row.values[`period_${index}`]?.current > 0
                      ? formatCurrency(row.values[`period_${index}`].current)
                      : "-"}
                  </div>
                  <div>
                    {row.values[`period_${index}`]?.previous > 0
                      ? formatCurrency(row.values[`period_${index}`].previous)
                      : "-"}
                  </div>
                </td>
              ))}
            </tr>
          ))}

          <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
            <td>TOTAL CA</td>
            {caData.periods.map((_, index) => (
              <td key={index}>
                <div>
                  {formatCurrency(totals[`period_${index}`]?.current || 0)}
                </div>
                <div>
                  {formatCurrency(totals[`period_${index}`]?.previous || 0)}
                </div>
              </td>
            ))}
          </tr>

          <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
            <td>MASSE SAL.</td>
            {caData.periods.map((_, index) => (
              <td key={index}>
                <div>
                  {formatCurrency(
                    payrollTotals[`period_${index}`]?.current || 0
                  )}
                </div>
                <div>
                  {formatCurrency(
                    payrollTotals[`period_${index}`]?.previous || 0
                  )}
                </div>
              </td>
            ))}
          </tr>

          <tr style={{ backgroundColor: "#f5f5f5", fontWeight: "bold" }}>
            <td>RATIO %</td>
            {caData.periods.map((_, index) => (
              <td key={index}>
                <div>
                  {ratios[`period_${index}`]?.current?.toFixed(1) || "-"}%
                </div>
                <div>
                  {ratios[`period_${index}`]?.previous?.toFixed(1) || "-"}%
                </div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      <div className="page-break">
        <div className="print-title">
          <h1>Indicateurs de Performance - {caData.mandate.name}</h1>
          <p>
            Analyse statistique - {selectedYear} | Généré le{" "}
            {new Date().toLocaleDateString("fr-CH")}
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
                {caData.summary.yearOverYearGrowth.revenue?.toFixed(1)}% vs{" "}
                {parseInt(selectedYear) - 1}
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
                {caData.summary.yearOverYearGrowth.payroll?.toFixed(1)}% vs{" "}
                {parseInt(selectedYear) - 1}
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

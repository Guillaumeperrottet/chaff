"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { Button } from "@/app/components/ui/button";
import { BackButton } from "@/app/components/ui/BackButton";
import { CalendarIcon, Download, Loader2 } from "lucide-react";

// Types pour les données CA
interface DayValue {
  date: string;
  value: number;
}

interface MonthData {
  month: string;
  year: number;
  values: DayValue[];
  total: number;
  comparison: number; // Pourcentage de comparaison
}

interface CAData {
  mandateName: string;
  periods: MonthData[];
  summary: {
    totalCumul: number;
    totalComparison: number;
  };
}

// Données simulées basées sur ton image
const mockCAData: CAData = {
  mandateName: "Camping Lac",
  periods: [
    {
      month: "2022-S1",
      year: 2022,
      values: [
        { date: "01.07", value: 2852.94 },
        { date: "02.07", value: 3042.34 },
        { date: "03.07", value: 2879.44 },
        // ... autres jours
        { date: "31.07", value: 4647.48 },
      ],
      total: 131464.2,
      comparison: -100.0,
    },
    {
      month: "2022-S2",
      year: 2022,
      values: [
        { date: "01.08", value: 4619.93 },
        { date: "02.08", value: 5058.68 },
        // ... autres jours
      ],
      total: 138310.38,
      comparison: -100.0,
    },
    // ... autres périodes
  ],
  summary: {
    totalCumul: 508529.41,
    totalComparison: -41.19,
  },
};

export default function MandateCAPage() {
  const params = useParams();
  const mandateId = params.id as string;

  const [caData, setCAData] = useState<CAData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState("2025");
  const [startMonth, setStartMonth] = useState("7");

  // Charger les données CA
  useEffect(() => {
    const loadCAData = async () => {
      try {
        setLoading(true);

        // Appel API avec filtres
        // const response = await fetch(
        //   `/api/mandates/${mandateId}/ca?year=${selectedYear}&startMonth=${startMonth}`
        // );
        // const data = await response.json();

        // Pour l'instant, utiliser les données simulées
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCAData(mockCAData);
      } catch (error) {
        console.error("Erreur lors du chargement des données CA:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCAData();
  }, [mandateId, selectedYear, startMonth]);

  // Générer les jours du mois pour l'affichage
  const generateDaysInMonth = () => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      days.push(i.toString().padStart(2, "0"));
    }
    return days;
  };

  // Générer les colonnes d'années/périodes
  const generatePeriodColumns = () => {
    const columns = [];
    const currentYear = parseInt(selectedYear);

    for (let i = 0; i < 6; i++) {
      const year1 = currentYear - 3 + i;
      const year2 = year1 + 1;
      columns.push({
        id: `${year1}-${year2}`,
        label: `${year1}-S${parseInt(startMonth) >= 7 ? "1" : "2"}`,
        years: [year1, year2],
      });
    }
    return columns;
  };

  const handleExport = () => {
    // Logique d'export des données
    console.log("Export des données CA");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <BackButton href="/dashboard/mandates" />
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  const days = generateDaysInMonth();
  const periodColumns = generatePeriodColumns();

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <BackButton href="/dashboard/mandates" label="Retour aux mandats" />
      <div className="border-b pb-4">
        <nav className="flex items-center space-x-4 text-sm text-blue-600 mb-4">
          <Link href="/dashboard" className="hover:underline">
            Campus
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/dashboard" className="hover:underline">
            Tableau de bord
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/dashboard/day-values" className="hover:underline">
            Valeurs journalières
          </Link>
          <span className="text-gray-400">|</span>
          <Link href="/dashboard/mandates" className="hover:underline">
            Mandants
          </Link>
          <span className="text-gray-400">|</span>
          <button onClick={handleExport} className="hover:underline">
            Exporte tout
          </button>
        </nav>

        <h1 className="text-2xl font-bold text-gray-900">
          {caData?.mandateName}
        </h1>
      </div>
      x{/* Filtres */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <CalendarIcon className="h-4 w-4 text-gray-500" />
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2023">2023</SelectItem>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={startMonth} onValueChange={setStartMonth}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Janvier</SelectItem>
            <SelectItem value="7">Juillet</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={handleExport} variant="outline" size="sm">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>
      {/* Table des données avec scroll horizontal */}
      <div className="overflow-x-auto border rounded-lg">
        <Table className="text-xs">
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-white border-r min-w-[60px]">
                Date
              </TableHead>
              {periodColumns.map((period) => (
                <TableHead
                  key={period.id}
                  className="text-center min-w-[100px] border-r"
                >
                  <div className="space-y-1">
                    <div className="font-medium">{period.label}</div>
                    <div className="flex">
                      <div className="w-1/2 text-xs font-normal">
                        {period.years[0]}
                      </div>
                      <div className="w-1/2 text-xs font-normal">
                        {period.years[1]}
                      </div>
                    </div>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {days.map((day) => (
              <TableRow key={day} className="hover:bg-gray-50">
                <TableCell className="sticky left-0 bg-white border-r font-medium">
                  {day}.{startMonth.padStart(2, "0")}
                </TableCell>
                {periodColumns.map((period) => (
                  <TableCell
                    key={`${day}-${period.id}`}
                    className="text-center border-r"
                  >
                    <div className="flex">
                      <div className="w-1/2 px-1">
                        {/* Valeur année 1 */}
                        {Math.random() > 0.3
                          ? (Math.random() * 5000).toFixed(2)
                          : ""}
                      </div>
                      <div className="w-1/2 px-1">
                        {/* Valeur année 2 */}
                        {Math.random() > 0.3
                          ? (Math.random() * 5000).toFixed(2)
                          : ""}
                      </div>
                    </div>
                  </TableCell>
                ))}
              </TableRow>
            ))}

            {/* Ligne des totaux */}
            <TableRow className="bg-gray-100 font-medium">
              <TableCell className="sticky left-0 bg-gray-100 border-r">
                Mois
              </TableCell>
              {periodColumns.map((period) => (
                <TableCell
                  key={`total-${period.id}`}
                  className="text-center border-r"
                >
                  <div className="flex">
                    <div className="w-1/2 px-1">
                      {(Math.random() * 150000).toFixed(2)}
                    </div>
                    <div className="w-1/2 px-1">
                      {(Math.random() * 150000).toFixed(2)}
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne jour moyen */}
            <TableRow className="bg-gray-50">
              <TableCell className="sticky left-0 bg-gray-50 border-r">
                Jour
              </TableCell>
              {periodColumns.map((period) => (
                <TableCell
                  key={`avg-${period.id}`}
                  className="text-center border-r"
                >
                  <div className="flex">
                    <div className="w-1/2 px-1">
                      {(Math.random() * 5000).toFixed(2)}
                    </div>
                    <div className="w-1/2 px-1">
                      {(Math.random() * 5000).toFixed(2)}
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne comparaison */}
            <TableRow className="bg-blue-50">
              <TableCell className="sticky left-0 bg-blue-50 border-r">
                Comp
              </TableCell>
              {periodColumns.map((period) => (
                <TableCell
                  key={`comp-${period.id}`}
                  className="text-center border-r"
                >
                  <div className="flex">
                    <div className="w-1/2 px-1 text-red-600">
                      {(Math.random() * -100).toFixed(2)}%
                    </div>
                    <div className="w-1/2 px-1 text-red-600">
                      {(Math.random() * -100).toFixed(2)}%
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne cumul */}
            <TableRow className="bg-yellow-50 font-medium">
              <TableCell className="sticky left-0 bg-yellow-50 border-r">
                Cumul
              </TableCell>
              {periodColumns.map((period) => (
                <TableCell
                  key={`cumul-${period.id}`}
                  className="text-center border-r"
                >
                  <div className="flex">
                    <div className="w-1/2 px-1">
                      {(Math.random() * 800000).toFixed(2)}
                    </div>
                    <div className="w-1/2 px-1">
                      {(Math.random() * 800000).toFixed(2)}
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>

            {/* Ligne comparaison cumul */}
            <TableRow className="bg-yellow-100">
              <TableCell className="sticky left-0 bg-yellow-100 border-r">
                Comp
              </TableCell>
              {periodColumns.map((period) => (
                <TableCell
                  key={`comp-cumul-${period.id}`}
                  className="text-center border-r"
                >
                  <div className="flex">
                    <div className="w-1/2 px-1 text-red-600">
                      {(Math.random() * -100).toFixed(2)}%
                    </div>
                    <div className="w-1/2 px-1 text-red-600">
                      {(Math.random() * -100).toFixed(2)}%
                    </div>
                  </div>
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
      {/* Informations supplémentaires */}
      <div className="text-sm text-gray-600">
        <p>
          Données du {selectedYear} - Période commençant en{" "}
          {startMonth === "7" ? "juillet" : "janvier"}
        </p>
      </div>
    </div>
  );
}

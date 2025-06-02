import Link from "next/link";
import { Plus, TrendingUp, Calendar, Building2 } from "lucide-react";
import ProtectedRoute from "@/app/components/ProtectedRoute";

// Types temporaires (remplacer par les vrais types Prisma plus tard)
interface Mandate {
  id: string;
  name: string;
  group: "HEBERGEMENT" | "RESTAURATION";
  lastEntry?: string;
}

// Données simulées (remplacer par de vraies requêtes Prisma)
const mockMandates: Mandate[] = [
  { id: "1", name: "Camping Lac", group: "HEBERGEMENT", lastEntry: "28.05.25" },
  {
    id: "2",
    name: "Camping Pont",
    group: "HEBERGEMENT",
    lastEntry: "28.05.25",
  },
  {
    id: "3",
    name: "Camping Sapins",
    group: "HEBERGEMENT",
    lastEntry: "28.05.25",
  },
  { id: "4", name: "Hotel Alpha", group: "HEBERGEMENT", lastEntry: "01.01.01" },
  {
    id: "5",
    name: "Lodges de Camargue",
    group: "HEBERGEMENT",
    lastEntry: "28.05.25",
  },
  {
    id: "6",
    name: "Popliving Riaz",
    group: "HEBERGEMENT",
    lastEntry: "28.05.25",
  },
  { id: "7", name: "DP-Aigle", group: "RESTAURATION", lastEntry: "28.05.25" },
  { id: "8", name: "DP-Bulle", group: "RESTAURATION", lastEntry: "28.05.25" },
  { id: "9", name: "DP-Sierre", group: "RESTAURATION", lastEntry: "28.05.25" },
  { id: "10", name: "DP-Susten", group: "RESTAURATION", lastEntry: "28.05.25" },
  {
    id: "11",
    name: "DP-Yverdon",
    group: "RESTAURATION",
    lastEntry: "28.05.25",
  },
];

const mockDailyData = {
  "jeu. 22.05.25": {
    "Camping Lac": 1684.54,
    "Camping Pont": 291.69,
    "Camping Sapins": 763.29,
    "Hotel Alpha": 0.0,
    "Lodges de Camargue": 2175.08,
    "Popliving Riaz": 369.69,
    "DP-Aigle": 1314.9,
    "DP-Bulle": 3626.4,
    "DP-Sierre": 1718.9,
    "DP-Susten": 1890.5,
    "DP-Yverdon": 1242.6,
  },
  "ven. 23.05.25": {
    "Camping Lac": 2372.67,
    "Camping Pont": 291.69,
    "Camping Sapins": 945.29,
    "Hotel Alpha": 0.0,
    "Lodges de Camargue": 2382.02,
    "Popliving Riaz": 369.69,
    "DP-Aigle": 1541.25,
    "DP-Bulle": 3693.4,
    "DP-Sierre": 2250.2,
    "DP-Susten": 2170.45,
    "DP-Yverdon": 1766.9,
  },
  "mer. 28.05.25": {
    "Camping Lac": 3457.38,
    "Camping Pont": 291.69,
    "Camping Sapins": 1559.99,
    "Hotel Alpha": 0.0,
    "Lodges de Camargue": 3998.08,
    "Popliving Riaz": 369.69,
    "DP-Aigle": 1721.6,
    "DP-Bulle": 3810.0,
    "DP-Sierre": 2151.8,
    "DP-Susten": 2487.8,
    "DP-Yverdon": 1553.4,
  },
};

const dates = Object.keys(mockDailyData);

function calculateTotal(data: Record<string, number>): number {
  return Object.values(data).reduce((sum, value) => sum + value, 0);
}

function calculateDailyTotals() {
  return dates.map((date) => ({
    date,
    total: calculateTotal(mockDailyData[date as keyof typeof mockDailyData]),
  }));
}

export default function Dashboard() {
  const dailyTotals = calculateDailyTotals();
  const grandTotal = dailyTotals.reduce((sum, day) => sum + day.total, 0);

  return (
    <ProtectedRoute>
      <div className="px-4 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="sm:flex sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Tableau de bord
            </h1>
            <p className="mt-2 text-sm text-gray-700">
              Vue d&apos;ensemble des chiffres d&apos;affaires par mandat et par
              jour
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Link href="/valeurs/nouvelle" className="btn-primary">
              <Plus className="h-4 w-4 inline mr-2" />
              Nouvelle valeur
            </Link>
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Total général
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {grandTotal.toLocaleString("fr-CH", {
                        style: "currency",
                        currency: "CHF",
                      })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Dernière période
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {dailyTotals[
                        dailyTotals.length - 1
                      ]?.total.toLocaleString("fr-CH", {
                        style: "currency",
                        currency: "CHF",
                      })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Building2 className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Mandats actifs
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {
                        mockMandates.filter((m) => m.lastEntry !== "01.01.01")
                          .length
                      }
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      Moyenne journalière
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {(grandTotal / dates.length).toLocaleString("fr-CH", {
                        style: "currency",
                        currency: "CHF",
                      })}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tableau principal */}
        <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-md">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Chiffres d&apos;affaires par mandat
            </h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Détail des revenus journaliers pour chaque établissement
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="table-header">Mandat</th>
                  <th className="table-header">Dernière saisie</th>
                  <th className="table-header">Top</th>
                  {dates.map((date) => (
                    <th key={date} className="table-header text-center">
                      {date}
                    </th>
                  ))}
                  <th className="table-header">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* Hébergement */}
                <tr className="bg-gray-50">
                  <td
                    colSpan={dates.length + 4}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-100"
                  >
                    Hébergement
                  </td>
                </tr>
                {mockMandates
                  .filter((mandate) => mandate.group === "HEBERGEMENT")
                  .map((mandate) => (
                    <tr key={mandate.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{mandate.name}</td>
                      <td className="table-cell">{mandate.lastEntry}</td>
                      <td className="table-cell">
                        {/* Placeholder pour le "Top" - pourrait être le max ou une formule */}
                        5&apos;311.94 / 24.07.22
                      </td>
                      {dates.map((date) => (
                        <td key={date} className="table-cell text-right">
                          {(
                            mockDailyData[
                              date as keyof typeof mockDailyData
                            ] as Record<string, number>
                          )[mandate.name]?.toLocaleString("fr-CH") || "0.00"}
                        </td>
                      ))}
                      <td className="table-cell">
                        <Link
                          href={`/mandats/${mandate.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          CA Add
                        </Link>
                      </td>
                    </tr>
                  ))}

                {/* Sous-total hébergement */}
                <tr className="bg-blue-50 font-medium">
                  <td className="table-cell">Hébergement</td>
                  <td className="table-cell"></td>
                  <td className="table-cell"></td>
                  {dates.map((date) => (
                    <td key={date} className="table-cell text-right">
                      {mockMandates
                        .filter((m) => m.group === "HEBERGEMENT")
                        .reduce(
                          (sum, m) =>
                            sum +
                            ((
                              mockDailyData[
                                date as keyof typeof mockDailyData
                              ] as Record<string, number>
                            )[m.name] || 0),
                          0
                        )
                        .toLocaleString("fr-CH")}
                    </td>
                  ))}
                  <td className="table-cell">CA</td>
                </tr>

                {/* Restauration */}
                <tr className="bg-gray-50">
                  <td
                    colSpan={dates.length + 4}
                    className="px-6 py-3 text-left text-sm font-semibold text-gray-900 bg-gray-100"
                  >
                    Restauration
                  </td>
                </tr>
                {mockMandates
                  .filter((mandate) => mandate.group === "RESTAURATION")
                  .map((mandate) => (
                    <tr key={mandate.id} className="hover:bg-gray-50">
                      <td className="table-cell font-medium">{mandate.name}</td>
                      <td className="table-cell">{mandate.lastEntry}</td>
                      <td className="table-cell">4&apos;313.30 / 15.05.25</td>
                      {dates.map((date) => (
                        <td key={date} className="table-cell text-right">
                          {(
                            mockDailyData[
                              date as keyof typeof mockDailyData
                            ] as Record<string, number>
                          )[mandate.name]?.toLocaleString("fr-CH") || "0.00"}
                        </td>
                      ))}
                      <td className="table-cell">
                        <Link
                          href={`/mandats/${mandate.id}`}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          CA Add
                        </Link>
                      </td>
                    </tr>
                  ))}

                {/* Sous-total restauration */}
                <tr className="bg-green-50 font-medium">
                  <td className="table-cell">Restauration</td>
                  <td className="table-cell"></td>
                  <td className="table-cell"></td>
                  {dates.map((date) => (
                    <td key={date} className="table-cell text-right">
                      {mockMandates
                        .filter((m) => m.group === "RESTAURATION")
                        .reduce(
                          (sum, m) =>
                            sum +
                            ((
                              mockDailyData[
                                date as keyof typeof mockDailyData
                              ] as Record<string, number>
                            )[m.name] || 0),
                          0
                        )
                        .toLocaleString("fr-CH")}
                    </td>
                  ))}
                  <td className="table-cell">CA</td>
                </tr>

                {/* Total général */}
                <tr className="bg-gray-100 font-bold">
                  <td className="table-cell">Total</td>
                  <td className="table-cell"></td>
                  <td className="table-cell"></td>
                  {dates.map((date) => (
                    <td key={date} className="table-cell text-right">
                      {calculateTotal(
                        mockDailyData[date as keyof typeof mockDailyData]
                      ).toLocaleString("fr-CH")}
                    </td>
                  ))}
                  <td className="table-cell">CA</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

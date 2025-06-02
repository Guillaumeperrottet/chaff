"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Plus,
  Download,
  Upload,
  Filter,
  Search,
  Calendar,
  Eye,
  Edit,
  Trash2,
} from "lucide-react";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";

// Données simulées pour reproduire l'interface
const campusData = [
  {
    id: 1,
    name: "Camping Lac",
    lastEntry: "01.06.25",
    performance: "5'311.94 / 24.07.22",
    values: {
      "26.05": "1'942.58",
      "27.05": "2'210.58",
      "28.05": "3'461.38",
      "29.05": "4'529.88",
      "30.05": "4'774.78",
      "31.05": "4'797.08",
      "01.06": "2'453.90",
    },
    category: "Hébergement",
    status: "active",
  },
  {
    id: 2,
    name: "Camping Pont",
    lastEntry: "01.06.25",
    performance: "473.53 / 07.11.22",
    values: {
      "26.05": "291.69",
      "27.05": "291.69",
      "28.05": "291.69",
      "29.05": "291.69",
      "30.05": "291.69",
      "31.05": "291.69",
      "01.06": "291.69",
    },
    category: "Hébergement",
    status: "active",
  },
  {
    id: 3,
    name: "Camping Sapins",
    lastEntry: "01.06.25",
    performance: "4'052.29 / 01.06.24",
    values: {
      "26.05": "1'206.29",
      "27.05": "1'240.09",
      "28.05": "1'516.79",
      "29.05": "2'236.39",
      "30.05": "2'359.99",
      "31.05": "2'195.81",
      "01.06": "1'217.65",
    },
    category: "Hébergement",
    status: "active",
  },
  {
    id: 4,
    name: "Hôtel Alpha",
    lastEntry: "01.06.25",
    performance: "3'039.60 / 01.06.25",
    values: {
      "26.05": "0.00",
      "27.05": "0.00",
      "28.05": "0.00",
      "29.05": "0.00",
      "30.05": "0.00",
      "31.05": "0.00",
      "01.06": "3'039.60",
    },
    category: "Hébergement",
    status: "new",
  },
  {
    id: 5,
    name: "Lodges de Camargue",
    lastEntry: "01.06.25",
    performance: "5'174.22 / 18.08.23",
    values: {
      "26.05": "2'492.32",
      "27.05": "3'153.76",
      "28.05": "3'998.08",
      "29.05": "4'361.02",
      "30.05": "4'107.02",
      "31.05": "4'429.34",
      "01.06": "1'282.54",
    },
    category: "Hébergement",
    status: "active",
  },
];

const dateColumns = [
  { key: "26.05", label: "lun. 26.05.25" },
  { key: "27.05", label: "mar. 27.05.25" },
  { key: "28.05", label: "mer. 28.05.25" },
  { key: "29.05", label: "jeu. 29.05.25" },
  { key: "30.05", label: "ven. 30.05.25" },
  { key: "31.05", label: "sam. 31.05.25" },
  { key: "01.06", label: "dim. 01.06.25" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header avec titre et actions */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campus</h1>
          <p className="text-muted-foreground">
            Tableau de bord des valeurs journalières
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Calendar className="mr-2 h-4 w-4" />
            Période
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Ajouter
          </Button>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un campus..."
              className="pl-8 w-[300px]"
            />
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              <SelectItem value="hebergement">Hébergement</SelectItem>
              <SelectItem value="restauration">Restauration</SelectItem>
            </SelectContent>
          </Select>
          <Select>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
              <SelectItem value="new">Nouveau</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
        </div>
      </div>

      {/* Table principale */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Valeurs journalières</CardTitle>
              <CardDescription>
                Vue d&apos;ensemble des performances par campus
              </CardDescription>
            </div>
            <Badge variant="secondary" className="text-xs">
              {campusData.length} campus
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[150px]">Campus</TableHead>
                  <TableHead className="min-w-[120px]">
                    Dernière saisie
                  </TableHead>
                  <TableHead className="min-w-[150px]">Top</TableHead>
                  {dateColumns.map((col) => (
                    <TableHead
                      key={col.key}
                      className="text-center min-w-[100px]"
                    >
                      {col.label}
                    </TableHead>
                  ))}
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campusData.map((campus) => (
                  <TableRow key={campus.id} className="hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div>
                          <div className="font-medium">{campus.name}</div>
                          <div className="text-sm text-muted-foreground flex items-center">
                            <Badge
                              variant={
                                campus.status === "active"
                                  ? "default"
                                  : campus.status === "new"
                                    ? "secondary"
                                    : "outline"
                              }
                              className="text-xs mr-2"
                            >
                              {campus.category}
                            </Badge>
                            {campus.status === "new" && (
                              <Badge variant="destructive" className="text-xs">
                                Nouveau
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium">
                        {campus.lastEntry}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm font-medium text-blue-600">
                        {campus.performance}
                      </div>
                    </TableCell>
                    {dateColumns.map((col) => (
                      <TableCell key={col.key} className="text-center">
                        <div className="text-sm font-medium">
                          {campus.values[col.key as keyof typeof campus.values]}
                        </div>
                      </TableCell>
                    ))}
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Voir les détails
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer avec totaux */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Affichage de {campusData.length} campus sur {campusData.length} au
              total
            </div>
            <div className="flex items-center space-x-4 text-sm">
              <div className="font-medium">
                Total: <span className="text-lg">23&apos;157.82</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

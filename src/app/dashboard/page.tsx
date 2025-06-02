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
import { Progress } from "@/app/components/ui/progress";
import {
  BarChart3,
  Users,
  FileText,
  TrendingUp,
  Calendar,
  Activity,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  MoreHorizontal,
} from "lucide-react";
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

// Données simulées pour la démo
const stats = [
  {
    title: "Total des revenus",
    value: "45,231€",
    change: "+20.1%",
    trend: "up",
    icon: BarChart3,
  },
  {
    title: "Utilisateurs actifs",
    value: "2,350",
    change: "+180",
    trend: "up",
    icon: Users,
  },
  {
    title: "Projets en cours",
    value: "12",
    change: "-2",
    trend: "down",
    icon: FileText,
  },
  {
    title: "Taux de conversion",
    value: "23.5%",
    change: "+2.4%",
    trend: "up",
    icon: TrendingUp,
  },
];

const recentData = [
  {
    id: "1",
    name: "Projet Alpha",
    status: "En cours",
    progress: 75,
    date: "2025-01-15",
    amount: "2,350€",
  },
  {
    id: "2",
    name: "Campaign Beta",
    status: "Terminé",
    progress: 100,
    date: "2025-01-14",
    amount: "1,890€",
  },
  {
    id: "3",
    name: "Initiative Gamma",
    status: "En attente",
    progress: 25,
    date: "2025-01-13",
    amount: "950€",
  },
  {
    id: "4",
    name: "Project Delta",
    status: "En cours",
    progress: 60,
    date: "2025-01-12",
    amount: "3,200€",
  },
  {
    id: "5",
    name: "Task Epsilon",
    status: "En cours",
    progress: 40,
    date: "2025-01-11",
    amount: "1,750€",
  },
];

const getStatusBadgeVariant = (status: string) => {
  switch (status) {
    case "Terminé":
      return "default";
    case "En cours":
      return "secondary";
    case "En attente":
      return "outline";
    default:
      return "secondary";
  }
};

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Vue d&apos;ensemble de vos données et activités
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Derniers 30 jours
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouveau projet
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground flex items-center">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="mr-1 h-3 w-3 text-green-500" />
                ) : (
                  <ArrowDownRight className="mr-1 h-3 w-3 text-red-500" />
                )}
                <span
                  className={
                    stat.trend === "up" ? "text-green-500" : "text-red-500"
                  }
                >
                  {stat.change}
                </span>
                <span className="ml-1">par rapport au mois dernier</span>
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Graphique principal */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Vue d&apos;ensemble</CardTitle>
            <CardDescription>
              Évolution de vos métriques principales
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center border-2 border-dashed border-muted-foreground/20 rounded-lg">
              <div className="text-center space-y-2">
                <BarChart3 className="h-8 w-8 text-muted-foreground mx-auto" />
                <p className="text-sm text-muted-foreground">
                  Graphique à venir
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activités récentes */}
        <Card>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
            <CardDescription>
              Dernières actions sur votre compte
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: "Nouveau projet créé", time: "Il y a 2h" },
                { action: "Données exportées", time: "Il y a 4h" },
                { action: "Utilisateur invité", time: "Il y a 1j" },
                { action: "Rapport généré", time: "Il y a 2j" },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.action}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tableau des données récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Données récentes</CardTitle>
          <CardDescription>
            Aperçu de vos derniers projets et leur progression
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentData.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={getStatusBadgeVariant(item.status)}>
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Progress value={item.progress} className="w-[60px]" />
                      <span className="text-sm text-muted-foreground">
                        {item.progress}%
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{item.date}</TableCell>
                  <TableCell>{item.amount}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem>Voir les détails</DropdownMenuItem>
                        <DropdownMenuItem>Modifier</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-red-600">
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

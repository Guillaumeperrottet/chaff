"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/app/components/ui/table";
import { Badge } from "@/app/components/ui/badge";
import { Plus, Search, Upload, Download, Loader2, Edit } from "lucide-react";
import { toast } from "sonner";
import EmptyState from "@/app/components/EmptyState";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phoneNumber?: string;
  position?: string;
  hourlyRate?: number;
  isActive: boolean;
  hiredAt?: Date;
  mandate: {
    id: string;
    name: string;
    group: string;
  };
  _count: {
    timeEntries: number;
    payrollData: number;
  };
}

interface Mandate {
  id: string;
  name: string;
  group: string;
}

export default function EmployeesPage() {
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [mandates, setMandates] = useState<Mandate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [mandateFilter, setMandateFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  useEffect(() => {
    Promise.all([fetchEmployees(), fetchMandates()]).finally(() => {
      setLoading(false);
    });
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await fetch(
        "/api/employees?includeInactive=true&limit=100"
      );
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setEmployees(data.data || []);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des employés");
    }
  };

  const fetchMandates = async () => {
    try {
      const response = await fetch("/api/mandats");
      if (!response.ok) throw new Error("Erreur lors du chargement");

      const data = await response.json();
      setMandates(data);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors du chargement des mandats");
    }
  };

  // Filtrer les employés
  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesMandate =
      mandateFilter === "all" || employee.mandate.id === mandateFilter;

    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && employee.isActive) ||
      (statusFilter === "inactive" && !employee.isActive);

    return matchesSearch && matchesMandate && matchesStatus;
  });

  const handleCreateNew = () => {
    router.push("/dashboard/employees/create");
  };

  const handleEdit = (employeeId: string) => {
    router.push(`/dashboard/employees/${employeeId}/edit`);
  };

  const handleExport = async () => {
    try {
      const response = await fetch("/api/export/employees");
      if (!response.ok) throw new Error("Erreur lors de l'export");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `employees_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success("Export téléchargé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de l'export");
    }
  };

  const formatCurrency = (amount?: number) => {
    if (!amount) return "-";
    return new Intl.NumberFormat("fr-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employés</h1>
          <p className="text-muted-foreground">
            Gestion des employés et masse salariale
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              router.push("/dashboard/payroll/import-with-validation")
            }
          >
            <Upload className="mr-2 h-4 w-4" />
            Import Gastrotime
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel employé
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Rechercher et filtrer</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={mandateFilter} onValueChange={setMandateFilter}>
              <SelectTrigger className="w-full md:w-[250px]">
                <SelectValue placeholder="Tous les établissements" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les établissements</SelectItem>
                {mandates.map((mandate) => (
                  <SelectItem key={mandate.id} value={mandate.id}>
                    {mandate.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des employés</CardTitle>
          <CardDescription>
            {filteredEmployees.length} employé(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Établissement</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Taux horaire</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Données temps</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployees.map((employee) => (
                <TableRow
                  key={employee.id}
                  className={!employee.isActive ? "opacity-60 bg-muted/30" : ""}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {employee.firstName} {employee.lastName}
                        {!employee.isActive && (
                          <span className="ml-2 text-xs text-muted-foreground">
                            (Inactif)
                          </span>
                        )}
                      </div>
                      {employee.email && (
                        <div className="text-sm text-muted-foreground">
                          {employee.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {employee.employeeId}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{employee.mandate.name}</div>
                      <Badge variant="outline" className="text-xs">
                        {employee.mandate.group === "HEBERGEMENT"
                          ? "Hébergement"
                          : "Restauration"}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>{employee.position || "-"}</TableCell>
                  <TableCell>{formatCurrency(employee.hourlyRate)}</TableCell>
                  <TableCell>
                    <Badge
                      variant={employee.isActive ? "default" : "secondary"}
                    >
                      {employee.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{employee._count.timeEntries} entrées temps</div>
                      <div className="text-muted-foreground">
                        {employee._count.payrollData} périodes paie
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(employee.id)}
                      className="h-8 px-3"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredEmployees.length === 0 && (
            <EmptyState type="employees" onPrimaryAction={handleCreateNew} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

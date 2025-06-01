"use client";

import { useState, useEffect } from "react";
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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Edit,
  Trash2,
  Shield,
  Search,
  RefreshCw,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

interface User {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
  emailVerified: boolean;
  organizationId: string | null;
  organizationName?: string;
  role?: string;
}

interface UsersManagementProps {
  hideCreateButton?: boolean;
}

export function UsersManagement({
  hideCreateButton = false,
}: UsersManagementProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  // Charger les utilisateurs
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/admin/users");
        if (!response.ok) {
          throw new Error("Erreur lors du chargement des utilisateurs");
        }
        const data = await response.json();
        setUsers(data.users);
      } catch (error) {
        console.error("Erreur:", error);
        toast.error("Impossible de charger les utilisateurs");
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Filtrer les utilisateurs
  const filteredUsers = users.filter((user) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(searchLower) ||
      (user.name && user.name.toLowerCase().includes(searchLower)) ||
      (user.organizationName &&
        user.organizationName.toLowerCase().includes(searchLower))
    );
  });

  // Fonction pour supprimer un utilisateur
  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression");
      }

      // Mettre à jour la liste des utilisateurs
      setUsers(users.filter((user) => user.id !== userId));
      toast.success("Utilisateur supprimé avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la suppression de l'utilisateur");
    }
  };

  // Fonction pour assigner un rôle super-admin
  const handleMakeSuperAdmin = async (userId: string) => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir donner les droits de super administrateur à cet utilisateur ?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `/api/admin/users/${userId}/make-super-admin`,
        {
          method: "POST",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du rôle");
      }

      // Mettre à jour la liste des utilisateurs
      toast.success("Rôle de super administrateur attribué avec succès");

      // Mettre à jour les utilisateurs
      const updatedUsers = users.map((user) => {
        if (user.id === userId) {
          return { ...user, role: "super-admin" };
        }
        return user;
      });

      setUsers(updatedUsers);
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la modification du rôle");
    }
  };

  // Fonction pour modifier un utilisateur
  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setIsEditing(true);
  };

  // Fonction pour sauvegarder les modifications
  const handleSaveUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(selectedUser),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour");
      }

      // Mettre à jour la liste des utilisateurs
      const updatedUsers = users.map((user) => {
        if (user.id === selectedUser.id) {
          return selectedUser;
        }
        return user;
      });

      setUsers(updatedUsers);
      setIsEditing(false);
      setSelectedUser(null);
      toast.success("Utilisateur mis à jour avec succès");
    } catch (error) {
      console.error("Erreur:", error);
      toast.error("Erreur lors de la mise à jour de l'utilisateur");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des Utilisateurs</CardTitle>
          <CardDescription>
            Administrez tous les utilisateurs du système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-6">
            <div className="relative max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un utilisateur..."
                className="w-full pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              {!hideCreateButton && (
                <Button variant="default">Créer un utilisateur</Button>
              )}
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
                disabled={loading}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Actualiser
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center p-8">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Organisation</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Vérifié</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-center py-8 text-muted-foreground"
                      >
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name || "—"}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.organizationName || "—"}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {user.emailVerified ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500" />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditUser(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleMakeSuperAdmin(user.id)}
                            >
                              <Shield className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUser(user.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {isEditing && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background p-6 rounded-lg shadow-lg w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">
              Modifier l&apos;utilisateur
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nom</label>
                <Input
                  value={selectedUser.name || ""}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, name: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <Input
                  value={selectedUser.email}
                  onChange={(e) =>
                    setSelectedUser({ ...selectedUser, email: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Organisation
                </label>
                <Input value={selectedUser.organizationName || ""} disabled />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Email vérifié
                </label>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedUser.emailVerified}
                    onChange={(e) =>
                      setSelectedUser({
                        ...selectedUser,
                        emailVerified: e.target.checked,
                      })
                    }
                    className="mr-2"
                  />
                  <span>
                    {selectedUser.emailVerified ? "Vérifié" : "Non vérifié"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditing(false);
                  setSelectedUser(null);
                }}
              >
                Annuler
              </Button>
              <Button onClick={handleSaveUser}>Enregistrer</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

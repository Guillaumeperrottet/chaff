"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Edit,
  ChevronDown,
  Search,
  ShieldAlert,
  User as UserIcon,
  X,
  Crown,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { useRouter } from "next/navigation";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  isCurrentUser: boolean;
}

export function UsersTable({ users }: { users: User[] }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "email" | "role">("name");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const router = useRouter();

  // Filtre sur la recherche
  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Tri des utilisateurs
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let comparison = 0;
    if (sortBy === "name") {
      comparison = a.name.localeCompare(b.name);
    } else if (sortBy === "email") {
      comparison = a.email.localeCompare(b.email);
    } else if (sortBy === "role") {
      comparison = a.role.localeCompare(b.role);
    }

    return sortDirection === "asc" ? comparison : -comparison;
  });

  // Gestion du tri au clic sur un en-tête de colonne
  const toggleSort = (column: "name" | "email" | "role") => {
    if (sortBy === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortBy(column);
      setSortDirection("asc");
    }
  };

  // Rendu de l'icône de tri
  const renderSortIcon = (column: "name" | "email" | "role") => {
    if (sortBy !== column) return null;

    return (
      <ChevronDown
        size={16}
        className={`ml-1 transition-transform text-slate-600 ${
          sortDirection === "desc" ? "rotate-180" : ""
        }`}
      />
    );
  };

  return (
    <div className="w-full">
      {/* Barre de recherche avec design financier */}
      <div className="mb-6 relative">
        <div className="relative max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search size={16} className="text-slate-400" />
          </div>
          <Input
            type="text"
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10 py-3 bg-white/80 backdrop-blur-sm border-slate-200 rounded-lg shadow-sm focus:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
          />
          {searchQuery && (
            <button
              className="absolute inset-y-0 right-0 pr-3 flex items-center rounded-r-lg transition-colors"
              onClick={() => setSearchQuery("")}
            >
              <X size={16} className="text-slate-400" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-slate-500 mt-2">
            {filteredUsers.length} résultat{filteredUsers.length > 1 ? "s" : ""}{" "}
            trouvé{filteredUsers.length > 1 ? "s" : ""}
          </p>
        )}
      </div>

      {/* Table pour desktop */}
      <div className="hidden md:block overflow-hidden rounded-lg border border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <table className="w-full">
          <thead>
            <tr className="bg-gradient-to-r from-slate-50 to-blue-50/30 border-b border-slate-200/60">
              <th className="p-4 text-left font-medium text-sm text-slate-600 w-12"></th>
              <th
                className="p-4 text-left font-medium text-sm text-slate-600 cursor-pointer transition-colors"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center">
                  <span>Nom</span>
                  {renderSortIcon("name")}
                </div>
              </th>
              <th
                className="p-4 text-left font-medium text-sm text-slate-600 cursor-pointer transition-colors"
                onClick={() => toggleSort("email")}
              >
                <div className="flex items-center">
                  <span>Email</span>
                  {renderSortIcon("email")}
                </div>
              </th>
              <th
                className="p-4 text-left font-medium text-sm text-slate-600 cursor-pointer transition-colors"
                onClick={() => toggleSort("role")}
              >
                <div className="flex items-center">
                  <span>Rôle</span>
                  {renderSortIcon("role")}
                </div>
              </th>
              <th className="p-4 text-right font-medium text-sm text-slate-600">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="p-3 rounded-lg bg-slate-100">
                      <Search size={24} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-600">
                        Aucun utilisateur trouvé
                      </p>
                      <p className="text-sm text-slate-500">
                        {searchQuery
                          ? "Essayez avec d'autres termes de recherche"
                          : "Aucun membre dans cette organisation"}
                      </p>
                    </div>
                  </div>
                </td>
              </tr>
            ) : (
              sortedUsers.map((user, index) => (
                <tr
                  key={user.id}
                  className={`border-b border-slate-200/40 transition-all duration-200 ${
                    index % 2 === 0 ? "bg-white/30" : "bg-slate-50/30"
                  }`}
                >
                  <td className="p-4">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                        {user.avatar ? (
                          <Image
                            src={user.avatar}
                            alt={user.name}
                            width={40}
                            height={40}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-slate-600">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      {user.role === "admin" && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-amber-400 to-amber-500 rounded-full flex items-center justify-center">
                          <Crown size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-semibold text-slate-800">
                          {user.name}
                        </p>
                        {user.isCurrentUser && (
                          <div className="flex items-center gap-1 mt-1">
                            <CheckCircle2
                              size={12}
                              className="text-emerald-500"
                            />
                            <span className="text-xs text-emerald-600 font-medium">
                              C&apos;est vous
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400" />
                      <span className="text-slate-600">{user.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center">
                      {user.role === "admin" ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
                          <Crown size={14} className="text-blue-600" />
                          <span className="text-sm font-medium text-blue-700">
                            Administrateur
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/50">
                          <UserIcon size={14} className="text-slate-500" />
                          <span className="text-sm font-medium text-slate-600">
                            Membre
                          </span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-2 border-slate-200 bg-white/80 text-slate-700 transition-all duration-200"
                    >
                      <Link href={`/profile/edit/${user.id}`}>
                        <Edit size={14} />
                        <span>Modifier</span>
                      </Link>
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Liste pour mobile */}
      <div className="md:hidden space-y-4">
        {sortedUsers.length === 0 ? (
          <div className="text-center py-12">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-xl bg-slate-100">
                <Search size={32} className="text-slate-400" />
              </div>
              <div>
                <p className="font-medium text-slate-600">
                  Aucun utilisateur trouvé
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  {searchQuery
                    ? "Essayez avec d'autres termes"
                    : "Aucun membre dans cette organisation"}
                </p>
              </div>
            </div>
          </div>
        ) : (
          sortedUsers.map((user) => (
            <div
              key={user.id}
              className="relative bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-xl p-5 shadow-sm transition-all duration-200"
            >
              {/* Badge admin pour mobile */}
              {user.role === "admin" && (
                <div className="absolute top-3 right-3">
                  <div className="px-2 py-1 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium flex items-center gap-1">
                    <Crown size={10} />
                    <span>Admin</span>
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className="relative flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-sm">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={48}
                        height={48}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-lg font-semibold text-slate-600">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                      {user.name}
                      {user.isCurrentUser && (
                        <div className="flex items-center gap-1">
                          <CheckCircle2
                            size={14}
                            className="text-emerald-500"
                          />
                          <span className="text-xs text-emerald-600 font-medium">
                            Vous
                          </span>
                        </div>
                      )}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail size={12} className="text-slate-400" />
                      <p className="text-sm text-slate-600 truncate">
                        {user.email}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div>
                      {user.role === "admin" ? (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50">
                          <ShieldAlert size={12} className="text-blue-600" />
                          <span className="text-xs font-medium text-blue-700">
                            Administrateur
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200/50">
                          <UserIcon size={12} className="text-slate-500" />
                          <span className="text-xs font-medium text-slate-600">
                            Membre
                          </span>
                        </div>
                      )}
                    </div>

                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1.5 border-slate-200 bg-white text-slate-700 transition-all duration-200"
                      onClick={() => router.push(`/profile/edit/${user.id}`)}
                    >
                      <Link href={`/profile/edit/${user.id}`}>
                        <Edit size={12} />
                        <span className="text-xs">Modifier</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

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
        className={`ml-1 transition-transform text-[color:var(--foreground)] ${
          sortDirection === "desc" ? "rotate-180" : ""
        }`}
      />
    );
  };

  return (
    <div className="w-full">
      {/* Barre de recherche */}
      <div className="mb-4 relative max-w-sm">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className="text-[color:var(--muted-foreground)]" />
        </div>
        <Input
          type="text"
          placeholder="Rechercher un utilisateur..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 py-2 bg-[color:var(--background)] text-[color:var(--foreground)] border-[color:var(--border)]"
        />
        {searchQuery && (
          <button
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
            onClick={() => setSearchQuery("")}
          >
            <X
              size={16}
              className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            />
          </button>
        )}
      </div>

      {/* Table pour desktop */}
      <div className="hidden md:block overflow-x-auto rounded-md">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[color:var(--muted)]">
              <th className="p-3 text-left font-medium text-sm text-[color:var(--muted-foreground)] w-12"></th>
              <th
                className="p-3 text-left font-medium text-sm text-[color:var(--muted-foreground)] cursor-pointer"
                onClick={() => toggleSort("name")}
              >
                <div className="flex items-center">
                  <span>Nom</span>
                  {renderSortIcon("name")}
                </div>
              </th>
              <th
                className="p-3 text-left font-medium text-sm text-[color:var(--muted-foreground)] cursor-pointer"
                onClick={() => toggleSort("email")}
              >
                <div className="flex items-center">
                  <span>Email</span>
                  {renderSortIcon("email")}
                </div>
              </th>
              <th
                className="p-3 text-left font-medium text-sm text-[color:var(--muted-foreground)] cursor-pointer"
                onClick={() => toggleSort("role")}
              >
                <div className="flex items-center">
                  <span>Rôle</span>
                  {renderSortIcon("role")}
                </div>
              </th>
              <th className="p-3 text-right font-medium text-sm text-[color:var(--muted-foreground)]">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-4 text-center text-[color:var(--muted-foreground)]"
                >
                  Aucun utilisateur trouvé
                </td>
              </tr>
            ) : (
              sortedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-[color:var(--border)] hover:bg-[color:var(--muted)] transition-colors"
                >
                  <td className="p-3">
                    <div className="w-8 h-8 rounded-full bg-[color:var(--muted)] flex items-center justify-center overflow-hidden">
                      {user.avatar ? (
                        <Image
                          src={user.avatar}
                          alt={user.name}
                          width={32}
                          height={32}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">
                          {user.name.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 font-medium text-[color:var(--foreground)]">
                    {user.name}
                    {user.isCurrentUser && (
                      <span className="ml-2 text-xs bg-[color:var(--muted)] text-[color:var(--muted-foreground)] px-2 py-0.5 rounded-full">
                        Vous
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-[color:var(--muted-foreground)]">
                    {user.email}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center">
                      {user.role === "admin" ? (
                        <div className="flex items-center gap-1 text-[color:var(--primary)]">
                          <ShieldAlert size={14} />
                          <span>Administrateur</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[color:var(--muted-foreground)]">
                          <UserIcon size={14} />
                          <span>Membre</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <Button
                      asChild
                      variant="outline"
                      size="sm"
                      className="gap-1 border-[color:var(--border)] bg-[color:var(--muted)] hover:bg-[color:var(--muted)]/80 text-[color:var(--foreground)]"
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
          <div className="text-center py-8 text-[color:var(--muted-foreground)]">
            Aucun utilisateur trouvé
          </div>
        ) : (
          sortedUsers.map((user) => (
            <div
              key={user.id}
              className="bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg p-4"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-[color:var(--muted)] flex items-center justify-center overflow-hidden flex-shrink-0">
                  {user.avatar ? (
                    <Image
                      src={user.avatar}
                      alt={user.name}
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-sm font-medium text-[color:var(--muted-foreground)]">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center">
                    <h3 className="font-medium truncate text-[color:var(--foreground)]">
                      {user.name}
                    </h3>
                    {user.isCurrentUser && (
                      <span className="ml-2 text-xs bg-[color:var(--muted)] text-[color:var(--muted-foreground)] px-2 py-0.5 rounded-full whitespace-nowrap">
                        Vous
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-[color:var(--muted-foreground)] truncate">
                    {user.email}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  {user.role === "admin" ? (
                    <div className="flex items-center gap-1 text-[color:var(--primary)] text-sm">
                      <ShieldAlert size={14} />
                      <span>Administrateur</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-[color:var(--muted-foreground)] text-sm">
                      <UserIcon size={14} />
                      <span>Membre</span>
                    </div>
                  )}
                </div>
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="gap-1 border-[color:var(--border)] bg-[color:var(--muted)] hover:bg-[color:var(--muted)]/80 text-[color:var(--foreground)]"
                  onClick={() => router.push(`/profile/edit/${user.id}`)}
                >
                  <Link href={`/profile/edit/${user.id}`}>
                    <Edit size={14} />
                    <span>Modifier</span>
                  </Link>
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

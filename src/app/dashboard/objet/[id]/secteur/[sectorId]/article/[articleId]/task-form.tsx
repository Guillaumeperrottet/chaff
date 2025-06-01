"use client";

import { useState, useRef } from "react";
import {
  Calendar,
  X,
  AlertCircle,
  Paperclip,
  Image as ImageIcon,
  FileText,
  ChevronsUpDown,
  Check,
} from "lucide-react";

import { motion } from "framer-motion";
import { toast } from "sonner";
import { useEffect } from "react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id?: string;
  name: string;
  description: string | null;
  executantComment: string | null;
  done: boolean;
  realizationDate: Date | null;
  status: string;
  taskType: string | null;
  color: string | null;
  recurring: boolean;
  period: string | null;
  endDate: Date | null;
  recurrenceReminderDate: Date | null;
  assignedToId: string | null;
  assignedTo?: User | null;
  createdAt?: Date;
  updatedAt?: Date;
};

interface TaskFormProps {
  task?: Task;
  users: User[];
  articleId: string;
  onSave: (task: Task, documents?: File[]) => Promise<void>;
  onCancel: () => void;
}

const PREDEFINED_TASK_TYPES = ["Maintenance", "Entretien", "Réparation"];

// Composant pour le sélecteur de type de tâche
function TaskTypeSelect({
  value,
  onChange,
  className = "",
}: {
  value: string | null;
  onChange: (value: string) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [customMode, setCustomMode] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Détecter si la valeur actuelle est personnalisée
  useEffect(() => {
    if (value && !PREDEFINED_TASK_TYPES.includes(value)) {
      setCustomMode(true);
      setSearchTerm(value);
    } else {
      setSearchTerm("");
    }
  }, [value]);

  // Activer l'input en mode personnalisé
  useEffect(() => {
    if (customMode && open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [customMode, open]);

  // Filtrer les types prédéfinis selon la recherche
  const filteredTypes = searchTerm
    ? PREDEFINED_TASK_TYPES.filter((type) =>
        type.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : PREDEFINED_TASK_TYPES;

  return (
    <div className={`relative ${className}`}>
      <div
        className="flex items-center justify-between w-full px-3 py-2 border border-[color:var(--border)] rounded-lg cursor-pointer bg-[color:var(--background)]"
        onClick={() => setOpen(!open)}
      >
        {!customMode ? (
          <span
            className={
              value
                ? "text-[color:var(--foreground)]"
                : "text-[color:var(--muted-foreground)]"
            }
          >
            {value || "Sélectionner ou saisir un type"}
          </span>
        ) : (
          <input
            ref={inputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              onChange(e.target.value);
            }}
            className="w-full bg-transparent outline-none"
            placeholder="Saisir un type personnalisé"
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <ChevronsUpDown size={16} className="opacity-50" />
      </div>

      {open && (
        <div className="absolute z-10 w-full mt-1 bg-[color:var(--card)] border border-[color:var(--border)] rounded-lg shadow-lg">
          <div className="max-h-60 overflow-y-auto">
            <div className="p-1">
              {/* Option pour basculer en mode personnalisé */}
              <div
                className="flex items-center px-3 py-2 hover:bg-[color:var(--muted)] rounded cursor-pointer"
                onClick={() => {
                  setCustomMode(true);
                  setOpen(false);
                  setTimeout(() => {
                    setOpen(true);
                    if (inputRef.current) inputRef.current.focus();
                  }, 10);
                }}
              >
                <span className="text-[color:var(--primary)]">
                  + Saisir un type personnalisé
                </span>
              </div>

              {/* Types prédéfinis */}
              {customMode && searchTerm
                ? filteredTypes.map((type) => (
                    <div
                      key={type}
                      className="flex items-center px-3 py-2 hover:bg-[color:var(--muted)] rounded cursor-pointer"
                      onClick={() => {
                        onChange(type);
                        setCustomMode(false);
                        setOpen(false);
                      }}
                    >
                      <span>{type}</span>
                    </div>
                  ))
                : PREDEFINED_TASK_TYPES.map((type) => (
                    <div
                      key={type}
                      className="flex items-center justify-between px-3 py-2 hover:bg-[color:var(--muted)] rounded cursor-pointer"
                      onClick={() => {
                        onChange(type);
                        setOpen(false);
                      }}
                    >
                      <span>{type}</span>
                      {type === value && (
                        <Check
                          size={16}
                          className="text-[color:var(--primary)]"
                        />
                      )}
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TaskFormWithDocuments({
  task,
  users,
  onSave,
  onCancel,
}: TaskFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [documents, setDocuments] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const defaultColor = "#d9840d";

  const [formData, setFormData] = useState<
    Omit<Task, "id" | "assignedTo" | "createdAt" | "updatedAt">
  >({
    name: task?.name || "",
    description: task?.description || "",
    executantComment: task?.executantComment || "",
    done: task?.done || false,
    realizationDate: task?.realizationDate || null,
    status: task?.status || "pending",
    taskType: task?.taskType || "",
    color: task?.color || defaultColor,
    recurring: task?.recurring || false,
    period: task?.period || "weekly",
    endDate: task?.endDate || null,
    recurrenceReminderDate: task?.recurrenceReminderDate || null,
    assignedToId: task?.assignedToId || "",
  });

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, color: e.target.value }));
  };

  // Gestion des documents
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      addDocuments(newFiles);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      addDocuments(newFiles);
    }
  };

  const addDocuments = (files: File[]) => {
    // Vérifier le type de fichier
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    const filteredFiles = files.filter((file) => {
      if (!allowedTypes.includes(file.type)) {
        toast.error(
          `Le type de fichier ${file.type} n'est pas pris en charge.`
        );
        return false;
      }

      // Vérifier la taille (max 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error(`Le fichier ${file.name} est trop volumineux (max 10MB).`);
        return false;
      }

      return true;
    });

    if (filteredFiles.length > 0) {
      setDocuments((prev) => [...prev, ...filteredFiles]);
    }
  };

  const removeDocument = (index: number) => {
    setDocuments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError("Le nom de la tâche est requis");
      return;
    }

    try {
      setIsLoading(true);

      // Construire l'objet de tâche complet
      const taskData: Task = {
        ...formData,
        id: task?.id,
        realizationDate: formData.realizationDate
          ? new Date(formData.realizationDate as unknown as string)
          : null,
        endDate:
          formData.recurring && formData.endDate
            ? new Date(formData.endDate as unknown as string)
            : null,
      };

      await onSave(taskData, documents.length > 0 ? documents : undefined);
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
      setFormError("Une erreur est survenue lors de la sauvegarde");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full max-w-3xl mx-auto bg-[color:var(--card)] rounded-lg overflow-hidden shadow-lg border border-[color:var(--border)]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-between items-center bg-[color:var(--muted)] px-3 sm:px-6 py-3 sm:py-4 border-b border-[color:var(--border)]">
        <h2 className="text-base sm:text-xl font-semibold text-[color:var(--foreground)]">
          {task?.id ? "Modifier la tâche" : "Nouvelle tâche"}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <form
        onSubmit={handleSubmit}
        className="p-3 sm:p-6 overflow-y-auto max-h-[calc(100vh-8rem)] sm:max-h-none"
      >
        {formError && (
          <div className="mb-4 flex items-center gap-2 p-2 sm:p-3 bg-[color:var(--destructive-background)] border border-[color:var(--destructive-border)] rounded-lg text-[color:var(--destructive-foreground)] text-xs sm:text-sm">
            <AlertCircle size={14} className="sm:w-4 sm:h-4" />
            <span>{formError}</span>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
            >
              Nom de la tâche *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Saisir le nom de la tâche"
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              required
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description || ""}
              onChange={handleChange}
              placeholder="Description détaillée (optionnelle)"
              className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <div>
              <label
                htmlFor="status"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Statut
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="pending">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="completed">Terminée</option>
                <option value="cancelled">Annulée</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="taskType"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Type de tâche
              </label>
              <TaskTypeSelect
                value={formData.taskType}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, taskType: value }))
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6">
            <div>
              <label
                htmlFor="realizationDate"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Date de réalisation prévue
              </label>
              <div className="relative">
                <input
                  type="date"
                  id="realizationDate"
                  name="realizationDate"
                  value={
                    formData.realizationDate
                      ? new Date(formData.realizationDate as unknown as string)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={handleChange}
                  className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
                />
                <Calendar
                  size={14}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] pointer-events-none sm:w-4 sm:h-4"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="assignedToId"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Attribuer à
              </label>
              <select
                id="assignedToId"
                name="assignedToId"
                value={formData.assignedToId || ""}
                onChange={handleChange}
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
              >
                <option value="">Non assignée</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-6 items-end">
            <div>
              <label
                htmlFor="color"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Couleur
              </label>
              <div className="flex items-center gap-2 sm:gap-3">
                <input
                  type="color"
                  id="color"
                  name="color"
                  value={formData.color || defaultColor}
                  onChange={handleColorChange}
                  className="w-10 h-10 sm:w-12 sm:h-12 p-1 border-0 rounded-md cursor-pointer"
                />
                <div
                  className="w-10 h-6 sm:w-12 sm:h-8 rounded border border-[color:var(--border)]"
                  style={{ backgroundColor: formData.color || defaultColor }}
                />
              </div>
            </div>
          </div>

          {/* Nouvelle section récurrence améliorée */}
          <div className="space-y-4">
            {/* Section récurrence avec description explicative */}
            <div className="flex items-center">
              <input
                type="checkbox"
                name="recurring"
                id="recurring"
                checked={formData.recurring}
                onChange={handleCheckboxChange}
                className="w-5 h-5 text-[color:var(--primary)] rounded focus:ring-[color:var(--ring)]"
              />
              <label htmlFor="recurring" className="ml-3 text-sm font-medium">
                Tâche récurrente
              </label>
            </div>

            {formData.recurring && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 mb-4">
                  Les tâches récurrentes sont automatiquement recréées selon la
                  périodicité définie, jusqu&apos;à la date de fin optionnelle.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Périodicité
                      <span className="ml-1 text-xs text-blue-600 font-normal">
                        À quelle fréquence cette tâche doit-elle se répéter ?
                      </span>
                    </label>
                    <select
                      name="period"
                      value={formData.period || "weekly"}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
                    >
                      <option value="daily">Quotidienne</option>
                      <option value="weekly">Hebdomadaire</option>
                      <option value="monthly">Mensuelle</option>
                      <option value="quarterly">Trimestrielle</option>
                      <option value="yearly">Annuelle</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Date de fin
                      <span className="ml-1 text-xs text-blue-600 font-normal">
                        (Optionnelle) Quand arrêter de recréer cette tâche ?
                      </span>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={
                        formData.endDate
                          ? new Date(formData.endDate as unknown as string)
                              .toISOString()
                              .split("T")[0]
                          : ""
                      }
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)]"
                    />
                  </div>

                  {/* Section notifications pour les tâches trimestrielles et annuelles */}
                  {(formData.period === "quarterly" ||
                    formData.period === "yearly") && (
                    <div className="border-t border-blue-200 pt-4 mt-4">
                      <div className="flex items-start">
                        <input
                          type="checkbox"
                          id="enableAdvanceNotification"
                          checked={!!formData.recurrenceReminderDate}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              recurrenceReminderDate:
                                e.target.checked && formData.realizationDate
                                  ? new Date(
                                      new Date(
                                        formData.realizationDate as unknown as string
                                      ).getTime() -
                                        10 * 24 * 60 * 60 * 1000
                                    )
                                  : null,
                            });
                          }}
                          className="w-4 h-4 mt-1 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <div className="ml-2">
                          <label
                            htmlFor="enableAdvanceNotification"
                            className="text-sm font-medium"
                          >
                            Notification anticipée
                          </label>
                          <p className="text-xs text-blue-700">
                            Recevoir une notification 10 jours avant
                            l&apos;échéance (Recommandé pour les tâches peu
                            fréquentes)
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {task?.id && (
            <div>
              <label
                htmlFor="executantComment"
                className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]"
              >
                Commentaire d&apos;exécution
              </label>
              <textarea
                id="executantComment"
                name="executantComment"
                value={formData.executantComment || ""}
                onChange={handleChange}
                placeholder="Commentaires sur l'exécution de la tâche"
                className="w-full px-3 py-2 sm:px-4 sm:py-2.5 text-sm rounded-lg border border-[color:var(--border)] focus:ring-2 focus:ring-[color:var(--ring)] focus:border-transparent bg-[color:var(--background)] text-[color:var(--foreground)]"
                rows={2}
              />
            </div>
          )}

          {/* Section pour l'upload de documents */}
          <div>
            <label className="block text-xs sm:text-sm font-medium mb-1 sm:mb-2 text-[color:var(--foreground)]">
              Documents
            </label>
            <div
              className={`border-2 border-dashed rounded-lg p-3 sm:p-4 text-center transition-colors ${
                isDragging
                  ? "border-blue-500 bg-blue-50 bg-opacity-30"
                  : "border-[color:var(--border)]"
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileChange}
                className="hidden"
                accept=".pdf,image/*"
              />

              <div className="flex flex-col items-center justify-center py-2 sm:py-4">
                <Paperclip className="h-8 w-8 sm:h-10 sm:w-10 text-[color:var(--muted-foreground)] mb-2" />
                <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)] mb-2">
                  Glissez-déposez des fichiers ici, ou
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Sélectionnez des fichiers
                </button>
                <p className="text-[10px] sm:text-xs text-[color:var(--muted-foreground)] mt-2">
                  PDF, JPG, PNG, GIF (max. 10MB)
                </p>
              </div>
            </div>

            {/* Liste des fichiers à uploader */}
            {documents.length > 0 && (
              <div className="mt-3 sm:mt-4 space-y-2">
                <h4 className="text-xs sm:text-sm font-medium">
                  Fichiers à télécharger:
                </h4>
                <div className="max-h-32 sm:max-h-40 overflow-y-auto pr-2">
                  {documents.map((file, index) => (
                    <div
                      key={`${file.name}-${index}`}
                      className="flex items-center justify-between p-2 bg-[color:var(--background)] border rounded mb-2"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {file.type.startsWith("image/") ? (
                          <ImageIcon
                            size={14}
                            className="text-blue-500 sm:w-4 sm:h-4"
                          />
                        ) : (
                          <FileText
                            size={14}
                            className="text-red-500 sm:w-4 sm:h-4"
                          />
                        )}
                        <span className="text-xs sm:text-sm truncate max-w-[180px] sm:max-w-[250px]">
                          {file.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeDocument(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X size={14} className="sm:w-4 sm:h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 sm:gap-3 pt-4 border-t border-[color:var(--border)]">
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 sm:px-4 sm:py-2.5 border border-[color:var(--border)] rounded-lg text-xs sm:text-sm font-medium hover:bg-[color:var(--muted)] transition-colors text-[color:var(--foreground)]"
              disabled={isLoading}
            >
              Annuler
            </button>

            <button
              type="submit"
              disabled={isLoading}
              className="px-3 py-2 sm:px-4 sm:py-2.5 bg-[color:var(--primary)] hover:bg-opacity-90 text-[color:var(--primary-foreground)] rounded-lg text-xs sm:text-sm font-medium transition-colors disabled:opacity-50"
            >
              {isLoading
                ? task?.id
                  ? "Mise à jour..."
                  : "Création..."
                : task?.id
                  ? "Mettre à jour"
                  : "Créer la tâche"}
            </button>
          </div>
        </div>
      </form>
    </motion.div>
  );
}

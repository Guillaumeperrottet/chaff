"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from "@hello-pangea/dnd";

import { toast } from "sonner";
import TaskFormMobileOptimized from "./TaskFormMobileOptimized";
import AccessControl from "@/app/components/AccessControl";
import TaskForm from "./task-form";
import ArchiveCompletedButton from "./ArchiveCompletedButton";
import {
  Calendar,
  User,
  Filter,
  Search,
  Plus,
  Clock,
  CheckCircle2,
  CircleOff,
  LayoutList,
  X,
  Tag,
  MoreHorizontal,
  Edit,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  RefreshCcw,
  Archive,
} from "lucide-react";

type User = {
  id: string;
  name: string;
  email: string;
};

type Task = {
  id: string;
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
  assignedTo: User | null;
  createdAt: Date;
  updatedAt: Date;
  archived?: boolean;
};

// Type pour la direction de tri
type SortDirection = "asc" | "desc" | null;

export default function ModernTasksPage({
  initialTasks,
  users,
  articleId,
  articleTitle,
  objetId,
  sectorId,
}: {
  initialTasks: Task[];
  users: User[];
  articleId: string;
  articleTitle: string;
  articleDescription: string | null;
  objetId: string;
  sectorId: string;
}) {
  const [tasks, setTasks] = useState<Task[]>(
    initialTasks.filter((task) => !task.archived)
  );
  const [filteredTasks, setFilteredTasks] = useState<Task[]>(initialTasks);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [taskMenuOpen, setTaskMenuOpen] = useState<string | null>(null);
  const [isMobileView, setIsMobileView] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string[]>([]);
  const [filterAssignee, setFilterAssignee] = useState<string | null>(null);
  const [filterTaskType, setFilterTaskType] = useState<string | null>(null);
  const [filterRecurring, setFilterRecurring] = useState<boolean | null>(null);
  const [useOptimizedForm, setUseOptimizedForm] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // État pour gérer le tri par date
  const [sortDirection, setSortDirection] = useState<
    Record<string, SortDirection>
  >({
    pending: null,
    in_progress: null,
    completed: null,
    cancelled: null,
  });

  // Fonction pour archiver ou désarchiver les tâches terminées
  const handleBulkArchiveCompleted = () => {
    // Rafraîchir la liste des tâches après l'archivage
    setTasks((prev) => prev.filter((task) => task.status !== "completed"));
  };

  // Detect mobile view
  useEffect(() => {
    const checkMobile = () => {
      const isMobile = window.innerWidth < 768;
      setUseOptimizedForm(isMobile);
      setIsMobileView(isMobile);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Fonction pour trier les tâches
  const sortTasksByDate = (
    tasks: Task[],
    status: string,
    direction: SortDirection
  ): Task[] => {
    if (!direction) return tasks;

    return [...tasks].sort((a, b) => {
      // Priorité aux dates de réalisation
      const dateA = a.realizationDate
        ? new Date(a.realizationDate).getTime()
        : new Date(a.createdAt).getTime();
      const dateB = b.realizationDate
        ? new Date(b.realizationDate).getTime()
        : new Date(b.createdAt).getTime();

      return direction === "asc" ? dateA - dateB : dateB - dateA;
    });
  };

  // Toggle the sort direction for a specific status
  const toggleSort = (status: string) => {
    setSortDirection((prev) => ({
      ...prev,
      [status]:
        prev[status] === null ? "desc" : prev[status] === "desc" ? "asc" : null,
    }));
  };

  // Group tasks by status for column display, with sorting applied
  const taskColumns = useMemo(() => {
    const columns = {
      pending: filteredTasks.filter((task) => task.status === "pending"),
      in_progress: filteredTasks.filter(
        (task) => task.status === "in_progress"
      ),
      completed: filteredTasks.filter((task) => task.status === "completed"),
      cancelled: filteredTasks.filter((task) => task.status === "cancelled"),
    };

    // Apply sorting to each column if direction is set
    return {
      pending: sortTasksByDate(
        columns.pending,
        "pending",
        sortDirection.pending
      ),
      in_progress: sortTasksByDate(
        columns.in_progress,
        "in_progress",
        sortDirection.in_progress
      ),
      completed: sortTasksByDate(
        columns.completed,
        "completed",
        sortDirection.completed
      ),
      cancelled: sortTasksByDate(
        columns.cancelled,
        "cancelled",
        sortDirection.cancelled
      ),
    };
  }, [filteredTasks, sortDirection]);

  // Apply filters to tasks
  useEffect(() => {
    let result = [...tasks];

    result = result.filter((task) => !task.archived);

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (task) =>
          task.name.toLowerCase().includes(query) ||
          (task.description?.toLowerCase() || "").includes(query) ||
          (task.taskType?.toLowerCase() || "").includes(query) ||
          (task.assignedTo?.name.toLowerCase() || "").includes(query)
      );
    }

    if (filterStatus.length > 0) {
      result = result.filter((task) => filterStatus.includes(task.status));
    }

    if (filterAssignee) {
      result = result.filter((task) => task.assignedToId === filterAssignee);
    }

    if (filterTaskType) {
      result = result.filter((task) => task.taskType === filterTaskType);
    }

    // Filtre pour les tâches récurrentes
    if (filterRecurring !== null) {
      result = result.filter((task) => task.recurring === filterRecurring);
    }

    setFilteredTasks(result);
  }, [
    tasks,
    searchQuery,
    filterStatus,
    filterAssignee,
    filterTaskType,
    filterRecurring,
  ]);

  // Get unique task types for filter dropdown
  const uniqueTaskTypes = useMemo(() => {
    const types = tasks
      .map((task) => task.taskType)
      .filter((type): type is string => type !== null && type !== "");

    return [...new Set(types)];
  }, [tasks]);

  // Render the sort button with appropriate icon
  const renderSortButton = (status: string) => {
    let icon;
    switch (sortDirection[status]) {
      case "asc":
        icon = <ArrowUp size={12} />;
        break;
      case "desc":
        icon = <ArrowDown size={12} />;
        break;
      default:
        icon = <ArrowUpDown size={12} />;
    }

    return (
      <button
        onClick={() => toggleSort(status)}
        className="ml-1 p-1 rounded-full hover:bg-[color:var(--muted)] focus:outline-none"
        title={
          sortDirection[status]
            ? sortDirection[status] === "asc"
              ? "Tri croissant"
              : "Tri décroissant"
            : "Trier par date"
        }
      >
        {icon}
      </button>
    );
  };

  // Handle drag and drop between columns
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;

    if (
      destination.droppableId === source.droppableId &&
      destination.index === source.index
    ) {
      return;
    }

    // Find the task that was dragged
    const task = tasks.find((t) => t.id === draggableId);
    if (!task) return;

    // Create a new task with updated status
    const updatedTask = {
      ...task,
      status: destination.droppableId,
      done: destination.droppableId === "completed",
    };

    // Optimistically update the UI
    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? updatedTask : t))
    );

    try {
      // Update on the server
      const response = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: destination.droppableId,
          done: destination.droppableId === "completed",
        }),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour du statut");

      toast.success(
        `Tâche déplacée vers ${getStatusName(destination.droppableId)}`
      );
    } catch {
      // Revert the change if it fails
      setTasks((prev) => prev.map((t) => (t.id === draggableId ? task : t)));
      toast.error("Échec de la mise à jour du statut");
    }
  };

  const getStatusName = (status: string) => {
    switch (status) {
      case "pending":
        return "À faire";
      case "in_progress":
        return "En cours";
      case "completed":
        return "Terminé";
      case "cancelled":
        return "Annulé";
      default:
        return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950 dark:border-amber-900 dark:text-amber-400";
      case "in_progress":
        return "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950 dark:border-blue-900 dark:text-blue-400";
      case "completed":
        return "bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-950 dark:border-emerald-900 dark:text-emerald-400";
      case "cancelled":
        return "bg-red-50 border-red-200 text-red-700 dark:bg-red-950 dark:border-red-900 dark:text-red-400";
      default:
        return "bg-[color:var(--muted)] border-[color:var(--border)] text-[color:var(--foreground)]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400" />;
      case "in_progress":
        return <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />;
      case "completed":
        return (
          <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
        );
      case "cancelled":
        return <CircleOff className="w-4 h-4 text-red-500 dark:text-red-400" />;
      default:
        return (
          <Clock className="w-4 h-4 text-[color:var(--muted-foreground)]" />
        );
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString();
  };

  const handleTaskClick = (taskId: string) => {
    window.location.href = `/dashboard/objet/${objetId}/secteur/${sectorId}/article/${articleId}/task/${taskId}`;
  };

  const handleTaskMenuToggle = (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setTaskMenuOpen(taskMenuOpen === taskId ? null : taskId);
  };

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    // Find the task
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Create a new task with updated status
    const updatedTask = {
      ...task,
      status: newStatus,
      done: newStatus === "completed",
    };

    // Optimistically update the UI
    setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));

    try {
      // Update on the server
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          done: newStatus === "completed",
        }),
      });

      if (!response.ok) throw new Error("Échec de la mise à jour du statut");

      toast.success(`Tâche déplacée vers ${getStatusName(newStatus)}`);
    } catch {
      // Revert the change if it fails
      setTasks((prev) => prev.map((t) => (t.id === taskId ? task : t)));
      toast.error("Échec de la mise à jour du statut");
    } finally {
      setTaskMenuOpen(null);
    }
  };

  const handleEditTask = (taskId: string) => {
    setSelectedTaskId(taskId);
    setShowAddForm(true);
    setTaskMenuOpen(null);
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    // Optimistically remove from UI
    const taskToDelete = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setTaskMenuOpen(null);

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Échec de la suppression");

      toast.success("Tâche supprimée avec succès");
    } catch {
      // Restore the task if delete fails
      if (taskToDelete) {
        setTasks((prev) => [...prev, taskToDelete]);
      }
      toast.error("Échec de la suppression de la tâche");
    }
  };

  const handleNewTask = () => {
    setSelectedTaskId(null);
    setShowAddForm(true);
  };

  // Define FormTask type to match what TaskForm expects
  type FormTask = Omit<
    Task,
    "id" | "assignedTo" | "createdAt" | "updatedAt"
  > & { id?: string };

  const handleTaskSave = async (
    updatedTask: Task | FormTask,
    documents?: File[]
  ) => {
    try {
      const isNewTask =
        !updatedTask.id || !tasks.some((t) => t.id === updatedTask.id);

      if (isNewTask) {
        const response = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...updatedTask,
            articleId,
            archived: false, // s'assurer que toutes les nouvelles tâches ne sont pas archivées
          }),
        });

        if (!response.ok) throw new Error("Erreur lors de la création");

        const newTask = await response.json();
        setTasks((prev) => [newTask, ...prev]);
        toast.success("Tâche créée avec succès");

        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(newTask.id, documents);
        }
      } else {
        const taskId = updatedTask.id as string;
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
        });

        if (!response.ok) throw new Error("Erreur lors de la mise à jour");

        const updated = await response.json();
        setTasks((prev) =>
          prev.map((t) => (t.id === updated.id ? updated : t))
        );
        toast.success("Tâche mise à jour avec succès");

        if (documents && documents.length > 0) {
          await uploadDocumentsForTask(updated.id, documents);
        }
      }

      setShowAddForm(false);
      setSelectedTaskId(null);
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Une erreur est survenue"
      );
    }
  };

  const uploadDocumentsForTask = async (taskId: string, documents: File[]) => {
    try {
      const uploadPromises = documents.map(async (document) => {
        const formData = new FormData();
        formData.append("file", document);

        const response = await fetch(`/api/tasks/${taskId}/documents`, {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(
            error.error || `Erreur lors du téléchargement de ${document.name}`
          );
        }

        return response.json();
      });

      await Promise.all(uploadPromises);
      toast.success(`${documents.length} document(s) ajouté(s) à la tâche`);
    } catch (error) {
      console.error("Erreur lors du téléchargement des documents:", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Erreur lors de l'ajout des documents"
      );
    }
  };

  const resetFilters = () => {
    setSearchQuery("");
    setFilterStatus([]);
    setFilterAssignee(null);
    setFilterTaskType(null);
    setFilterRecurring(null);
    if (searchInputRef.current) {
      searchInputRef.current.value = "";
    }
  };

  const getSelectedTask = () => {
    if (!selectedTaskId) return undefined;
    return tasks.find((task) => task.id === selectedTaskId) || undefined;
  };

  const [hoveredColumn, setHoveredColumn] = useState<string | null>(null);

  return (
    <div className="flex flex-col h-screen bg-[color:var(--background)]">
      {/* Main content area with integrated filter area */}
      <div
        ref={contentRef}
        className="flex-1 overflow-hidden flex flex-col md:flex-row"
      >
        <AnimatePresence mode="wait">
          {showAddForm ? (
            useOptimizedForm ? (
              <TaskFormMobileOptimized
                task={getSelectedTask()}
                users={users}
                articleId={articleId}
                onSave={handleTaskSave}
                onCancel={() => {
                  setShowAddForm(false);
                  setSelectedTaskId(null);
                }}
              />
            ) : (
              <motion.div
                key="add-form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 overflow-auto p-4"
              >
                <TaskForm
                  task={getSelectedTask()}
                  users={users}
                  articleId={articleId}
                  onSave={handleTaskSave}
                  onCancel={() => {
                    setShowAddForm(false);
                    setSelectedTaskId(null);
                  }}
                />
              </motion.div>
            )
          ) : (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex-1 flex flex-col">
                {/* Compact header with title, search and actions */}
                <div className="bg-[color:var(--card)] border-b border-[color:var(--border)] p-2 flex justify-between items-center gap-2">
                  <div className="font-medium truncate text-sm md:text-base text-[color:var(--foreground)]">
                    {articleTitle}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative w-40 md:w-52">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)] w-3.5 h-3.5" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Rechercher des tâches..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-2 py-1 text-xs border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-[color:var(--muted-foreground)]"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`p-1 rounded-md ${
                        showFilters
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                      }`}
                    >
                      <Filter className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleNewTask}
                      className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] p-1 rounded-md shadow-sm hover:opacity-90"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Filter panel (expandable) */}
                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="bg-[color:var(--card)] border-b border-[color:var(--border)] overflow-hidden"
                    >
                      <div className="p-3 space-y-3">
                        {/* Status filter */}
                        <div>
                          <label className="block text-xs font-medium text-[color:var(--foreground)] mb-1">
                            Statut
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              "pending",
                              "in_progress",
                              "completed",
                              "cancelled",
                            ].map((status) => (
                              <button
                                key={status}
                                onClick={() => {
                                  setFilterStatus((prev) =>
                                    prev.includes(status)
                                      ? prev.filter((s) => s !== status)
                                      : [...prev, status]
                                  );
                                }}
                                className={`px-2 py-0.5 text-xs rounded-full border ${
                                  filterStatus.includes(status)
                                    ? getStatusColor(status)
                                    : "border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                                }`}
                              >
                                {getStatusName(status)}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          {/* Assignee filter */}
                          <div>
                            <label className="block text-xs font-medium text-[color:var(--foreground)] mb-1">
                              Assigné à
                            </label>
                            <select
                              value={filterAssignee || ""}
                              onChange={(e) =>
                                setFilterAssignee(e.target.value || null)
                              }
                              className="w-full px-2 py-1 text-xs border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                            >
                              <option value="">Tous les assignés</option>
                              {users.map((user) => (
                                <option key={user.id} value={user.id}>
                                  {user.name}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Task type filter if types exist */}
                          {uniqueTaskTypes.length > 0 && (
                            <div>
                              <label className="block text-xs font-medium text-[color:var(--foreground)] mb-1">
                                Type de tâche
                              </label>
                              <select
                                value={filterTaskType || ""}
                                onChange={(e) =>
                                  setFilterTaskType(e.target.value || null)
                                }
                                className="w-full px-2 py-1 text-xs border border-[color:var(--border)] rounded-md focus:outline-none focus:ring-1 focus:ring-[color:var(--ring)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                              >
                                <option value="">Tous les types</option>
                                {uniqueTaskTypes.map((type) => (
                                  <option key={type} value={type}>
                                    {type}
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                        </div>

                        {/* Filtre pour les tâches récurrentes */}
                        <div>
                          <label className="block text-xs font-medium text-[color:var(--foreground)] mb-1">
                            Type de récurrence
                          </label>
                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => setFilterRecurring(null)}
                              className={`px-2 py-0.5 text-xs rounded-full border ${
                                filterRecurring === null
                                  ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] border-[color:var(--primary)]"
                                  : "border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                              }`}
                            >
                              Toutes
                            </button>
                            <button
                              onClick={() => setFilterRecurring(true)}
                              className={`px-2 py-0.5 text-xs rounded-full border ${
                                filterRecurring === true
                                  ? "bg-blue-500 text-white border-blue-500 dark:bg-blue-700 dark:border-blue-700"
                                  : "border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                              }`}
                            >
                              Récurrentes
                            </button>
                            <button
                              onClick={() => setFilterRecurring(false)}
                              className={`px-2 py-0.5 text-xs rounded-full border ${
                                filterRecurring === false
                                  ? "bg-purple-500 text-white border-purple-500 dark:bg-purple-700 dark:border-purple-700"
                                  : "border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                              }`}
                            >
                              Ponctuelles
                            </button>
                          </div>
                        </div>

                        {/* Reset filters button */}
                        <div className="flex justify-end">
                          <button
                            onClick={resetFilters}
                            className="px-2 py-1 text-xs bg-[color:var(--muted)] text-[color:var(--foreground)] rounded hover:bg-[color:var(--muted)] hover:opacity-80"
                          >
                            Réinitialiser les filtres
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Task columns */}
                <div className="flex-1 flex overflow-x-auto md:space-x-2 pb-1 pt-1 px-1">
                  {/* Render each status column */}
                  {["pending", "in_progress", "completed", "cancelled"].map(
                    (status) => (
                      <div
                        key={status}
                        className="flex-1 min-w-[250px] md:min-w-0"
                      >
                        <div
                          className={`rounded-t-md px-2 py-1.5 ${getStatusColor(status)}`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              {getStatusIcon(status)}
                              <h3 className="font-medium text-xs">
                                {getStatusName(status)}
                              </h3>
                              {/* Bouton de tri par date */}
                              {renderSortButton(status)}
                              {/* Ajouter le bouton d'archive uniquement pour les tâches terminées */}
                              {status === "completed" && (
                                <ArchiveCompletedButton
                                  completedTasks={taskColumns.completed}
                                  onArchiveCompleted={
                                    handleBulkArchiveCompleted
                                  }
                                />
                              )}
                            </div>
                            <span className="text-xs px-1.5 py-0.5 bg-[color:var(--background)] bg-opacity-70 rounded-full">
                              {
                                taskColumns[status as keyof typeof taskColumns]
                                  .length
                              }
                            </span>
                          </div>
                        </div>

                        <Droppable droppableId={status}>
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`bg-[color:var(--card)] rounded-b-md p-1 shadow-sm border border-t-0 border-[color:var(--border)] h-[calc(100vh-110px)] overflow-y-auto ${
                                snapshot.isDraggingOver
                                  ? "bg-[color:var(--muted)]"
                                  : ""
                              }`}
                              onMouseEnter={() => setHoveredColumn(status)}
                              onMouseLeave={() => setHoveredColumn(null)}
                            >
                              {taskColumns[status as keyof typeof taskColumns]
                                .length === 0 ? (
                                <div className="text-center py-2 text-[color:var(--muted-foreground)] text-xs">
                                  {status === "pending"
                                    ? "Aucune tâche pour le moment. Ajoutez-en une !"
                                    : `Aucune tâche ${getStatusName(status).toLowerCase()}`}
                                </div>
                              ) : (
                                taskColumns[
                                  status as keyof typeof taskColumns
                                ].map((task, index) => (
                                  <Draggable
                                    key={task.id}
                                    draggableId={task.id}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        className={`relative p-2 mb-1 bg-[color:var(--background)] border border-[color:var(--border)] rounded-md shadow-sm ${
                                          snapshot.isDragging ? "shadow-md" : ""
                                        }`}
                                        style={{
                                          ...provided.draggableProps.style,
                                          borderLeftWidth: "3px",
                                          borderLeftColor:
                                            task.color || "#d9840d",
                                        }}
                                        onClick={() => handleTaskClick(task.id)}
                                      >
                                        {/* Indicateur de tâche récurrente en haut à droite */}
                                        {task.recurring && (
                                          <div className="absolute top-1 right-1 bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 rounded-full px-1.5 py-0.5 text-[9px] flex items-center gap-0.5">
                                            <RefreshCcw size={8} />
                                            <span>
                                              {task.period === "daily" &&
                                                "Quotidienne"}
                                              {task.period === "weekly" &&
                                                "Hebdo"}
                                              {task.period === "monthly" &&
                                                "Mensuelle"}
                                              {task.period === "quarterly" &&
                                                "Trim."}
                                              {task.period === "yearly" &&
                                                "Annuelle"}
                                            </span>
                                          </div>
                                        )}

                                        <div className="flex justify-between items-start mb-1">
                                          <h4 className="font-medium text-xs text-[color:var(--foreground)]">
                                            {task.name}
                                          </h4>
                                          <div className="relative">
                                            <button
                                              onClick={(e) =>
                                                handleTaskMenuToggle(task.id, e)
                                              }
                                              className="text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] p-0.5"
                                            >
                                              <MoreHorizontal className="w-3 h-3" />
                                            </button>

                                            {/* Dropdown menu */}
                                            {taskMenuOpen === task.id && (
                                              <div className="absolute right-0 z-10 mt-1 bg-[color:var(--card)] border border-[color:var(--border)] rounded-md shadow-lg w-36">
                                                <ul className="py-1 text-xs">
                                                  <li>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleEditTask(task.id);
                                                      }}
                                                      className="w-full text-left px-3 py-1 hover:bg-[color:var(--muted)] text-[color:var(--foreground)] flex items-center gap-2"
                                                    >
                                                      <Edit className="w-3 h-3" />
                                                      Modifier
                                                    </button>
                                                  </li>
                                                  {status !== "completed" && (
                                                    <li>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleTaskStatusChange(
                                                            task.id,
                                                            "completed"
                                                          );
                                                        }}
                                                        className="w-full text-left px-3 py-1 hover:bg-[color:var(--muted)] flex items-center gap-2 text-emerald-600 dark:text-emerald-400 relative group"
                                                      >
                                                        <CheckCircle2 className="w-3 h-3" />
                                                        <span>Terminer</span>
                                                        {task.recurring && (
                                                          <div className="tooltip-wrapper">
                                                            <div className="absolute invisible group-hover:visible w-48 bg-gray-800 text-white dark:bg-black text-[9px] rounded px-2 py-1 bottom-full left-0 mb-1 z-10">
                                                              Cette tâche
                                                              récurrente sera
                                                              automatiquement
                                                              recréée pour la
                                                              prochaine période.
                                                            </div>
                                                          </div>
                                                        )}
                                                      </button>
                                                    </li>
                                                  )}
                                                  {status === "completed" && (
                                                    <li>
                                                      <button
                                                        onClick={(e) => {
                                                          e.stopPropagation();
                                                          handleTaskStatusChange(
                                                            task.id,
                                                            "pending"
                                                          );
                                                        }}
                                                        className="w-full text-left px-3 py-1 hover:bg-[color:var(--muted)] text-[color:var(--foreground)] flex items-center gap-2"
                                                      >
                                                        <Clock className="w-3 h-3" />
                                                        Rouvrir
                                                      </button>
                                                    </li>
                                                  )}
                                                  {/* Nouvel élément: Option d'archivage pour les tâches terminées */}
                                                  {status === "completed" &&
                                                    !task.archived && (
                                                      <li>
                                                        <button
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            // Appeler l'API d'archivage
                                                            fetch(
                                                              `/api/tasks/${task.id}/archive`,
                                                              {
                                                                method: "POST",
                                                                headers: {
                                                                  "Content-Type":
                                                                    "application/json",
                                                                },
                                                                body: JSON.stringify(
                                                                  {
                                                                    archive:
                                                                      true,
                                                                  }
                                                                ),
                                                              }
                                                            )
                                                              .then(
                                                                (response) => {
                                                                  if (
                                                                    !response.ok
                                                                  )
                                                                    throw new Error(
                                                                      "Erreur lors de l'archivage"
                                                                    );
                                                                  return response.json();
                                                                }
                                                              )
                                                              .then(() => {
                                                                // Mettre à jour l'état local ou recharger les tâches
                                                                setTasks(
                                                                  (prev) =>
                                                                    prev.filter(
                                                                      (t) =>
                                                                        t.id !==
                                                                        task.id
                                                                    )
                                                                );
                                                                toast.success(
                                                                  "Tâche archivée avec succès"
                                                                );
                                                                setTaskMenuOpen(
                                                                  null
                                                                );
                                                              })
                                                              .catch(
                                                                (error) => {
                                                                  console.error(
                                                                    "Erreur:",
                                                                    error
                                                                  );
                                                                  toast.error(
                                                                    "Erreur lors de l'archivage de la tâche"
                                                                  );
                                                                }
                                                              );
                                                          }}
                                                          className="w-full text-left px-3 py-1 hover:bg-[color:var(--muted)] text-amber-600 flex items-center gap-2"
                                                        >
                                                          <Archive className="w-3 h-3" />
                                                          Archiver
                                                        </button>
                                                      </li>
                                                    )}
                                                  <li>
                                                    <button
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteTask(
                                                          task.id
                                                        );
                                                      }}
                                                      className="w-full text-left px-3 py-1 hover:bg-[color:var(--muted)] text-red-600 dark:text-red-400 flex items-center gap-2"
                                                    >
                                                      <Trash2 className="w-3 h-3" />
                                                      Supprimer
                                                    </button>
                                                  </li>
                                                </ul>
                                              </div>
                                            )}
                                          </div>
                                        </div>

                                        {task.description && (
                                          <p className="text-[10px] text-[color:var(--muted-foreground)] line-clamp-1 mb-1">
                                            {task.description}
                                          </p>
                                        )}

                                        <div className="flex flex-wrap gap-1">
                                          {task.realizationDate &&
                                            !task.recurring && (
                                              <span className="flex items-center gap-0.5 text-[10px] bg-[color:var(--muted)] px-1 py-0.5 rounded text-[color:var(--foreground)]">
                                                <Calendar className="w-2 h-2 text-[color:var(--muted-foreground)]" />
                                                <span>
                                                  {formatDate(
                                                    task.realizationDate
                                                  )}
                                                </span>
                                              </span>
                                            )}

                                          {task.assignedTo && (
                                            <span className="flex items-center gap-0.5 text-[10px] bg-[color:var(--muted)] px-1 py-0.5 rounded text-[color:var(--foreground)]">
                                              <User className="w-2 h-2 text-[color:var(--muted-foreground)]" />
                                              <span className="truncate max-w-[80px]">
                                                {task.assignedTo.name}
                                              </span>
                                            </span>
                                          )}

                                          {task.taskType && (
                                            <span className="flex items-center gap-0.5 text-[10px] bg-[color:var(--muted)] px-1 py-0.5 rounded text-[color:var(--foreground)]">
                                              <Tag className="w-2 h-2 text-[color:var(--muted-foreground)]" />
                                              <span>{task.taskType}</span>
                                            </span>
                                          )}

                                          {task.recurring && (
                                            <span className="flex items-center gap-0.5 text-[10px] bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-1 py-0.5 rounded">
                                              <Clock className="w-2 h-2" />
                                              <span>Récurrente</span>
                                            </span>
                                          )}
                                        </div>

                                        {/* Affichage amélioré pour les dates de récurrence */}
                                        {task.recurring &&
                                          task.realizationDate && (
                                            <div className="mt-1 flex items-center gap-0.5 text-[10px] bg-blue-50 dark:bg-blue-900 px-1 py-0.5 rounded text-blue-700 dark:text-blue-300">
                                              <Calendar className="w-2 h-2" />
                                              <span>
                                                Échéance:{" "}
                                                {formatDate(
                                                  task.realizationDate
                                                )}
                                              </span>
                                              {task.endDate && (
                                                <span className="ml-1">
                                                  (jusqu&apos;au{" "}
                                                  {formatDate(task.endDate)})
                                                </span>
                                              )}
                                            </div>
                                          )}
                                      </div>
                                    )}
                                  </Draggable>
                                ))
                              )}
                              {provided.placeholder}

                              {/* Add task button at bottom of pending column */}
                              {(hoveredColumn === status ||
                                status === "pending") && (
                                <AccessControl
                                  entityType="article"
                                  entityId={articleId}
                                  requiredLevel="write"
                                  fallback={
                                    <button
                                      className="w-full text-[color:var(--muted-foreground)] bg-[color:var(--muted)] bg-opacity-40 p-2 rounded mt-2 opacity-50 cursor-not-allowed text-xs flex items-center justify-center gap-1"
                                      onClick={() =>
                                        toast.info(
                                          "Vous n'avez pas les droits pour créer des tâches"
                                        )
                                      }
                                    >
                                      <Plus size={16} />
                                      <span>Ajouter une tâche</span>
                                    </button>
                                  }
                                >
                                  <button
                                    onClick={handleNewTask}
                                    className="w-full text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] bg-[color:var(--muted)] hover:bg-opacity-70 bg-opacity-40 p-2 rounded mt-2 text-xs flex items-center justify-center gap-1"
                                  >
                                    <Plus size={16} />
                                    <span>Ajouter une tâche</span>
                                  </button>
                                </AccessControl>
                              )}
                            </div>
                          )}
                        </Droppable>
                      </div>
                    )
                  )}
                </div>
              </div>
            </DragDropContext>
          )}
        </AnimatePresence>
      </div>

      {/* Empty state when no tasks and no filters */}
      {filteredTasks.length === 0 && !showAddForm && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[color:var(--background)] bg-opacity-90 z-10 p-4">
          {searchQuery ||
          filterStatus.length > 0 ||
          filterAssignee ||
          filterTaskType ||
          filterRecurring !== null ? (
            <div className="text-center max-w-sm">
              <div className="w-10 h-10 rounded-full bg-[color:var(--muted)] flex items-center justify-center mx-auto mb-3">
                <Filter className="w-5 h-5 text-[color:var(--muted-foreground)]" />
              </div>
              <h2 className="text-lg font-medium mb-2 text-[color:var(--foreground)]">
                Aucune tâche correspondante
              </h2>
              <p className="text-sm text-[color:var(--muted-foreground)] mb-4">
                Essayez d&apos;ajuster vos filtres pour trouver ce que vous
                recherchez.
              </p>
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg shadow hover:opacity-90"
              >
                Réinitialiser tous les filtres
              </button>
            </div>
          ) : (
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 rounded-full bg-[color:var(--muted)] flex items-center justify-center mx-auto mb-4">
                <LayoutList className="w-7 h-7 text-[color:var(--muted-foreground)]" />
              </div>
              <h2 className="text-xl font-medium mb-2 text-[color:var(--foreground)]">
                Aucune tâche pour le moment
              </h2>
              <p className="text-sm text-[color:var(--muted-foreground)] mb-6">
                Commencez par créer votre première tâche pour cet article.
              </p>
              <button
                onClick={handleNewTask}
                className="px-5 py-2 bg-[color:var(--primary)] text-[color:var(--primary-foreground)] rounded-lg shadow-sm hover:opacity-90 flex items-center gap-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Créer une première tâche</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating add button for mobile view */}
      {!showAddForm && !isMobileView && (
        <div className="md:hidden fixed bottom-5 right-5 z-10">
          <button
            onClick={handleNewTask}
            className="bg-[color:var(--primary)] text-[color:var(--primary-foreground)] w-12 h-12 rounded-full shadow-lg flex items-center justify-center hover:opacity-90"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      )}
    </div>
  );
}

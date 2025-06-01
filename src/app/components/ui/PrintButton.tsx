"use client";

import { Printer } from "lucide-react";
import { useState, useCallback } from "react";

type Task = {
  id: string;
  name: string;
  description: string | null;
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
  article: {
    id: string;
    title: string;
    sector: {
      id: string;
      name: string;
      object: {
        id: string;
        nom: string;
      };
    };
  };
  assignedTo: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
  updatedAt: Date;
};

interface PrintButtonProps {
  tasks: Task[];
  filteredTasks: Task[];
  objectName: string;
  searchTerm: string;
  statusFilter: string;
  articleFilter: string;
  availableArticles: Array<{
    id: string;
    title: string;
    sectorName: string;
  }>;
  isMobile: boolean;
  thisWeekEnd: Date;
}

const formatDate = (date: Date | null): string => {
  if (!date) return "";
  return date.toLocaleDateString();
};

const PrintButton: React.FC<PrintButtonProps> = ({
  filteredTasks,
  objectName,
  searchTerm,
  statusFilter,
  articleFilter,
  availableArticles,
  isMobile,
  thisWeekEnd,
}) => {
  const [isPrinting, setIsPrinting] = useState(false);

  // Fonction utilitaire pour générer le HTML d'une tâche
  const getTaskHtml = (task: Task) => {
    const statusLabels = {
      pending: "À faire",
      in_progress: "En cours",
      completed: "Terminée",
      cancelled: "Annulée",
    };

    const statusClass = `status-${task.status}`;
    const statusLabel =
      statusLabels[task.status as keyof typeof statusLabels] || task.status;

    return `
      <div class="task ${statusClass}">
        <div class="task-header">
          <div>${task.name}</div>
          <div class="task-status">${statusLabel}</div>
        </div>
        ${task.description ? `<div>${task.description}</div>` : ""}
        <div class="task-details">
          <div>
            ${
              task.realizationDate
                ? `Date: ${formatDate(task.realizationDate)} • `
                : ""
            }
            Secteur: ${task.article.sector.name}
          </div>
          <div>
            ${task.assignedTo ? `Assigné à: ${task.assignedTo.name}` : ""}
          </div>
        </div>
        <div class="article-info">
          Article: ${task.article.title}
        </div>
      </div>
    `;
  };

  const handlePrint = useCallback(() => {
    // Éviter les clics multiples
    if (isPrinting) return;
    setIsPrinting(true);

    // Retour haptique sur mobile
    if ("vibrate" in navigator && isMobile) {
      navigator.vibrate(10);
    }

    // Créer une fenêtre d'impression
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      alert("Veuillez autoriser les fenêtres popup pour imprimer.");
      setIsPrinting(false);
      return;
    }

    // Diviser les tâches entre cette semaine et à venir
    const thisWeekTasksForPrint: Task[] = [];
    const upcomingTasksForPrint: Task[] = [];

    filteredTasks.forEach((task) => {
      if (!task.realizationDate) {
        thisWeekTasksForPrint.push(task);
        return;
      }
      const taskDate = new Date(task.realizationDate);
      taskDate.setHours(0, 0, 0, 0);
      if (taskDate <= thisWeekEnd) thisWeekTasksForPrint.push(task);
      else upcomingTasksForPrint.push(task);
    });

    // Créer le contenu HTML à imprimer
    let printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>PlanniKeeper - Liste des tâches</title>
        <style>
          body {
            font-family: system-ui, -apple-system, sans-serif;
            line-height: 1.5;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 10px;
          }
          .logo {
            font-size: 24px;
            font-weight: bold;
          }
          .date {
            color: #666;
          }
          h2 {
            border-bottom: 1px solid #eee;
            padding-bottom: 5px;
            margin-top: 30px;
          }
          .task {
            padding: 10px;
            margin-bottom: 15px;
            border: 1px solid #ddd;
            border-radius: 8px;
            page-break-inside: avoid;
          }
          .task-header {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
            margin-bottom: 5px;
          }
          .task-status {
            font-size: 12px;
            padding: 2px 8px;
            border-radius: 12px;
            background-color: #f3f3f3;
          }
          .task-details {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            margin-top: 8px;
            color: #666;
          }
          .status-pending { background-color: #fff7e6; border-color: #ffd591; }
          .status-in_progress { background-color: #e6f7ff; border-color: #91d5ff; }
          .status-completed { background-color: #f6ffed; border-color: #b7eb8f; }
          .status-cancelled { background-color: #fff1f0; border-color: #ffa39e; }
          .article-info {
            font-size: 11px;
            color: #888;
            margin-top: 5px;
            padding-top: 5px;
            border-top: 1px dotted #eee;
          }
          @media print {
            body { 
              font-size: 12px; 
              padding: 10px;
            }
          }
          .no-tasks {
            text-align: center;
            color: #888;
            padding: 20px;
            border: 1px dashed #ddd;
            border-radius: 8px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 11px;
            color: #888;
            padding-top: 10px;
            border-top: 1px solid #eee;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">PlanniKeeper - Liste des tâches</div>
          <div class="date">Imprimé le ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
        </div>
        
        <p><strong>Objet :</strong> ${objectName}</p>
    `;

    // Ajouter les filtres actifs
    if (searchTerm || statusFilter !== "all" || articleFilter !== "all") {
      printContent += "<p><strong>Filtres appliqués:</strong> ";

      if (searchTerm) {
        printContent += `Recherche: "${searchTerm}" | `;
      }

      if (statusFilter !== "all") {
        const statusLabels = {
          pending: "À faire",
          in_progress: "En cours",
          completed: "Terminées",
          cancelled: "Annulées",
        };
        printContent += `Statut: ${
          statusLabels[statusFilter as keyof typeof statusLabels] ||
          statusFilter
        } | `;
      }

      if (articleFilter !== "all") {
        const article = availableArticles.find((a) => a.id === articleFilter);
        if (article) {
          printContent += `Article: ${article.title} (${article.sectorName})`;
        }
      }

      printContent = printContent.replace(/ \| $/, ""); // Enlever le dernier séparateur si présent
      printContent += "</p>";
    }

    // Générer le contenu pour les tâches de cette semaine
    printContent += `<h2>Cette semaine (${thisWeekTasksForPrint.length})</h2>`;

    if (thisWeekTasksForPrint.length === 0) {
      printContent += `<div class="no-tasks">Aucune tâche pour cette semaine</div>`;
    } else {
      thisWeekTasksForPrint.forEach((task) => {
        printContent += getTaskHtml(task);
      });
    }

    // Générer le contenu pour les tâches à venir
    printContent += `<h2>À venir (${upcomingTasksForPrint.length})</h2>`;

    if (upcomingTasksForPrint.length === 0) {
      printContent += `<div class="no-tasks">Aucune tâche à venir</div>`;
    } else {
      upcomingTasksForPrint.forEach((task) => {
        printContent += getTaskHtml(task);
      });
    }

    // Ajouter un pied de page
    printContent += `
        <div class="footer">
          Généré par PlanniKeeper - www.plannikeeper.ch
        </div>
      </body>
      </html>
    `;

    // Écrire dans la fenêtre d'impression
    printWindow.document.open();
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Lancer l'impression après chargement de la page
    printWindow.onload = () => {
      printWindow.print();
      // Réinitialiser l'état
      setIsPrinting(false);
    };

    // Sécurité: réinitialiser l'état si la fenêtre est fermée sans imprimer
    printWindow.onafterprint = () => {
      setIsPrinting(false);
    };

    // Fallback si onload ne se déclenche pas
    setTimeout(() => {
      setIsPrinting(false);
    }, 5000);
  }, [
    isPrinting,
    filteredTasks,
    objectName,
    searchTerm,
    statusFilter,
    articleFilter,
    availableArticles,
    isMobile,
    thisWeekEnd,
  ]);

  return (
    <button
      onClick={handlePrint}
      className="ml-2 p-2 rounded-full hover:bg-[color:var(--muted)]"
      aria-label="Imprimer les tâches"
      title="Imprimer les tâches"
      disabled={isPrinting}
    >
      <Printer
        size={20}
        className={`text-[color:var(--foreground)] ${
          isPrinting ? "opacity-50" : ""
        }`}
      />
    </button>
  );
};

export default PrintButton;

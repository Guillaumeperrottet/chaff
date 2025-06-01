"use client";

import { useState, useEffect, useCallback } from "react";
import { File, Trash2, FileText, Image, AlertCircle, Eye } from "lucide-react";
import { toast } from "sonner";
import DocumentPreview from "./DocumentPreview";

interface Document {
  id: string;
  name: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  createdAt: string;
}

interface DocumentsListProps {
  taskId: string;
  onDocumentsChange?: () => void;
}

export default function DocumentsList({
  taskId,
  onDocumentsChange,
}: DocumentsListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);
  const [currentDocumentIndex, setCurrentDocumentIndex] = useState<number>(0);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await fetch(`/api/tasks/${taskId}/documents`);
      if (!response.ok) {
        throw new Error("Erreur lors du chargement des documents");
      }
      const data: Document[] = await response.json(); // typage explicite
      setDocuments(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erreur inattendue");
    } finally {
      setIsLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    if (taskId) {
      loadDocuments();
    }
  }, [taskId, loadDocuments]);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + " bytes";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith("image/")) {
      return (
        <Image
          size={18}
          className="text-[color:var(--info-foreground)]"
          aria-label="Image file"
        />
      );
    } else if (fileType === "application/pdf") {
      return (
        <FileText
          size={18}
          className="text-[color:var(--destructive-foreground)]"
          aria-label="PDF file"
        />
      );
    } else {
      return (
        <File
          size={18}
          className="text-[color:var(--muted-foreground)]"
          aria-label="Generic file"
        />
      );
    }
  };

  const handleDelete = async (documentId: string) => {
    // window.confirm pour éviter erreur SSR
    if (
      typeof window !== "undefined" &&
      !window.confirm("Êtes-vous sûr de vouloir supprimer ce document ?")
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du document");
      }

      setDocuments((prevDocs) =>
        prevDocs.filter((doc) => doc.id !== documentId)
      );
      toast.success("Document supprimé avec succès");

      if (onDocumentsChange) {
        onDocumentsChange();
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Erreur lors de la suppression du document"
      );
    }
  };

  const openPreview = (document: Document, index: number) => {
    setPreviewDocument(document);
    setCurrentDocumentIndex(index);
  };

  const closePreview = () => {
    setPreviewDocument(null);
  };

  if (isLoading) {
    return (
      <div className="text-center py-3">
        <div className="animate-spin w-5 h-5 sm:w-6 sm:h-6 border-2 border-[color:var(--primary)] border-t-transparent rounded-full mx-auto mb-2"></div>
        <p className="text-xs sm:text-sm text-[color:var(--muted-foreground)]">
          Chargement des documents...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-3 text-[color:var(--destructive)] flex items-center justify-center gap-2">
        <AlertCircle size={14} />
        <span className="text-xs sm:text-sm">{error}</span>
      </div>
    );
  }

  if (!documents || documents.length === 0) {
    return (
      <div className="text-center py-3 text-[color:var(--muted-foreground)]">
        <p className="text-xs sm:text-sm">
          Aucun document attaché à cette tâche
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2" data-document-list>
      {documents.map((doc, index) => (
        <div
          key={doc.id}
          className="flex items-center justify-between p-2 sm:p-3 bg-[color:var(--background)] rounded-lg border border-[color:var(--border)] shadow-sm hover:bg-[color:var(--muted)]/50 transition-colors"
        >
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            {getFileIcon(doc.fileType)}
            <div className="flex-1 min-w-0">
              <div
                className="block text-xs sm:text-sm font-medium hover:underline truncate cursor-pointer text-[color:var(--foreground)]"
                onClick={() => openPreview(doc, index)}
              >
                {doc.name}
              </div>
              <div className="text-[10px] sm:text-xs text-[color:var(--muted-foreground)]">
                {formatFileSize(doc.fileSize)} •{" "}
                {new Date(doc.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => openPreview(doc, index)}
              className="p-1 hover:text-[color:var(--info-foreground)] transition-colors"
              title="Prévisualiser"
            >
              <Eye size={14} className="sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => handleDelete(doc.id)}
              className="p-1 hover:text-[color:var(--destructive)] transition-colors"
              title="Supprimer"
            >
              <Trash2 size={14} className="sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Composant de prévisualisation */}
      {previewDocument && (
        <DocumentPreview
          document={previewDocument}
          onClose={closePreview}
          documents={documents}
          currentIndex={currentDocumentIndex}
          onNavigate={(index) => {
            setCurrentDocumentIndex(index);
            setPreviewDocument(documents[index]);
          }}
        />
      )}
    </div>
  );
}

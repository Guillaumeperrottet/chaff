"use client";

import { CalendarIcon, ListIcon } from "lucide-react";

export enum ViewMode {
  LIST = "list",
  CALENDAR = "calendar",
}

interface ViewModeToggleProps {
  currentMode: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export default function ViewModeToggle({
  currentMode,
  onChange,
}: ViewModeToggleProps) {
  return (
    <div className="flex items-center border border-[color:var(--border)] rounded-full p-0.5 bg-[color:var(--background)]">
      <button
        onClick={() => onChange(ViewMode.LIST)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
          currentMode === ViewMode.LIST
            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
            : "hover:bg-[color:var(--muted)]"
        }`}
      >
        <ListIcon size={14} />
        <span className="hidden sm:inline">Liste</span>
      </button>

      <button
        onClick={() => onChange(ViewMode.CALENDAR)}
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm transition-colors ${
          currentMode === ViewMode.CALENDAR
            ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
            : "hover:bg-[color:var(--muted)]"
        }`}
      >
        <CalendarIcon size={14} />
        <span className="hidden sm:inline">Calendrier</span>
      </button>
    </div>
  );
}

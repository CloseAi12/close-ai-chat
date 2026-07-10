"use client";

import { useState } from "react";
import { Conversation } from "@/lib/types";
import {
  Plus,
  MessageSquare,
  Pencil,
  Trash2,
  X,
  Check,
  Sparkles,
} from "lucide-react";

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  open: boolean;
  onClose: () => void;
  onSelect: (id: string) => void;
  onNew: () => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

export default function Sidebar({
  conversations,
  activeId,
  open,
  onClose,
  onSelect,
  onNew,
  onRename,
  onDelete,
}: SidebarProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftTitle, setDraftTitle] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  function startRename(id: string, currentTitle: string) {
    setEditingId(id);
    setDraftTitle(currentTitle);
  }

  function commitRename(id: string) {
    const trimmed = draftTitle.trim();
    if (trimmed) onRename(id, trimmed);
    setEditingId(null);
  }

  const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex-shrink-0 flex flex-col
          bg-surface-light dark:bg-surface-dark border-r border-line-light dark:border-line-dark
          transition-transform duration-200 ease-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2 font-display font-extrabold text-[15px]">
            <span className="w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center">
              <Sparkles size={13} />
            </span>
            Close AI
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-line-light dark:hover:bg-line-dark"
            aria-label="Close sidebar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-3">
          <button
            onClick={onNew}
            className="w-full flex items-center gap-2 justify-center rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium py-2.5 transition-colors"
          >
            <Plus size={16} /> New chat
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
          {sorted.length === 0 && (
            <p className="text-xs text-muted-light dark:text-muted-dark px-3 py-4 text-center">
              Koi conversation nahi hai abhi. "New chat" se shuru karein.
            </p>
          )}
          {sorted.map((c) => {
            const isActive = c.id === activeId;
            const isEditing = editingId === c.id;
            const isConfirming = confirmDeleteId === c.id;

            return (
              <div
                key={c.id}
                className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 cursor-pointer text-sm
                  ${isActive ? "bg-brand-50 dark:bg-brand-700/20 text-brand-700 dark:text-brand-200" : "hover:bg-line-light dark:hover:bg-line-dark"}`}
                onClick={() => !isEditing && onSelect(c.id)}
              >
                <MessageSquare size={15} className="flex-shrink-0 opacity-70" />

                {isEditing ? (
                  <input
                    autoFocus
                    value={draftTitle}
                    onChange={(e) => setDraftTitle(e.target.value)}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(c.id);
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    className="flex-1 min-w-0 bg-transparent border-b border-brand-500 outline-none text-sm py-0.5"
                  />
                ) : (
                  <span className="flex-1 min-w-0 truncate py-1">{c.title}</span>
                )}

                <div
                  className={`flex items-center gap-0.5 flex-shrink-0 ${
                    isEditing || isConfirming ? "" : "opacity-0 group-hover:opacity-100"
                  } transition-opacity`}
                >
                  {isEditing ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        commitRename(c.id);
                      }}
                      className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-black/20"
                      aria-label="Save name"
                    >
                      <Check size={14} />
                    </button>
                  ) : isConfirming ? (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(c.id);
                          setConfirmDeleteId(null);
                        }}
                        className="text-[11px] px-1.5 py-0.5 rounded-md bg-red-500 text-white"
                      >
                        Delete
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(null);
                        }}
                        className="text-[11px] px-1.5 py-0.5 rounded-md hover:bg-line-light dark:hover:bg-line-dark"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startRename(c.id, c.title);
                        }}
                        className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-black/20"
                        aria-label="Rename conversation"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteId(c.id);
                        }}
                        className="p-1 rounded-md hover:bg-white/50 dark:hover:bg-black/20"
                        aria-label="Delete conversation"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

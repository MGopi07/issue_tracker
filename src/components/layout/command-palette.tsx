"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  PlusCircle,
  LayoutDashboard,
  AlertCircle,
  BookOpen,
  FolderKanban,
  Users,
  Settings,
  X,
  ArrowRight,
} from "lucide-react";

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const navigate = useCallback(
    (url: string) => {
      onClose();
      setQuery("");
      router.push(url);
    },
    [onClose, router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Trigger open
          const event = new CustomEvent("open-command-palette");
          window.dispatchEvent(event);
        }
      }
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, group: "Navigation" },
    { label: "Report New Technical Issue", href: "/issues/create", icon: PlusCircle, group: "Actions" },
    { label: "All Issues", href: "/issues", icon: AlertCircle, group: "Navigation" },
    { label: "Technical Knowledge Base", href: "/knowledge-base", icon: BookOpen, group: "Technical" },
    { label: "Projects Directory", href: "/projects", icon: FolderKanban, group: "Management" },
    { label: "Team & Departments", href: "/team", icon: Users, group: "Management" },
    { label: "System Settings", href: "/settings", icon: Settings, group: "Administration" },
  ];

  const filteredLinks = query.trim()
    ? quickLinks.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : quickLinks;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-100">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search issues, documentation, or jump to page..."
            className="w-full text-sm text-slate-800 placeholder-slate-400 bg-transparent focus:outline-none"
            autoFocus
          />
          <button
            onClick={onClose}
            className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {filteredLinks.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching pages or commands found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            filteredLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.href}
                  onClick={() => navigate(item.href)}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left text-sm text-slate-700 hover:bg-slate-100 hover:text-indigo-600 transition-colors group"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                    <span className="font-medium">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-slate-400 group-hover:text-indigo-600">
                    <span>{item.group}</span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate using arrows or click</span>
          <div className="flex items-center gap-1.5">
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono text-[10px]">
              ESC
            </kbd>
            <span>to close</span>
          </div>
        </div>
      </div>
    </div>
  );
}

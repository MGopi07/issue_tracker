"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  issues: "Issues",
  create: "New Issue",
  "my-issues": "My Reported Issues",
  "assigned-to-me": "Assigned to Me",
  "knowledge-base": "Knowledge Base",
  projects: "Projects",
  team: "Team & Departments",
  reports: "RCA & Analytics",
  settings: "Settings",
  edit: "Edit",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length === 0 || pathname === "/dashboard") {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
        <Home className="w-3.5 h-3.5 text-slate-400" />
        <span>/</span>
        <span className="text-slate-900 font-semibold">Dashboard</span>
      </div>
    );
  }

  let accumulatedPath = "";

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 text-slate-500 hover:text-slate-900 transition-colors"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>

      {segments.map((segment, index) => {
        accumulatedPath += `/${segment}`;
        const isLast = index === segments.length - 1;
        const label = ROUTE_LABELS[segment] || segment.toUpperCase();

        return (
          <div key={accumulatedPath} className="flex items-center gap-1.5">
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="text-slate-900 font-semibold truncate max-w-[200px]" title={label}>
                {label}
              </span>
            ) : (
              <Link
                href={accumulatedPath}
                className="hover:text-slate-900 transition-colors truncate max-w-[150px]"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}

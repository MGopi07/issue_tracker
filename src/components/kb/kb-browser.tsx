"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  BookOpen,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Building2,
  FolderKanban,
  CheckCircle,
  AlertTriangle,
  GitBranch,
  Database,
  Rocket,
} from "lucide-react";

export interface KbItem {
  id: string;
  issueNumber: string;
  title: string;
  description: string;
  kbSummary?: string | null;
  department: { name: string; code: string };
  category: { name: string; code: string };
  project: { name: string; code: string };
  resolution?: {
    rootCause: string;
    permanentSolution: string;
    workaround?: string | null;
    filesChanged?: string | null;
    databaseChanges?: string | null;
    deploymentSteps?: string | null;
    resolver: { name: string };
    verifier?: { name: string } | null;
    verifiedAt?: string | Date | null;
  } | null;
  tags: { tag: { id: string; name: string } }[];
}

interface DepartmentFilter {
  id: string;
  name: string;
  code: string;
}

interface KbBrowserProps {
  initialIssues: KbItem[];
  departments: DepartmentFilter[];
}

export function KbBrowser({ initialIssues, departments }: KbBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<string>("ALL");
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  // Filter in-memory for instant feedback
  const filtered = initialIssues.filter((item) => {
    // Department filter
    if (selectedDeptId !== "ALL") {
      const matchDept = departments.find((d) => d.id === selectedDeptId);
      if (matchDept && item.department.code !== matchDept.code) return false;
    }

    // Keyword filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const inTitle = item.title.toLowerCase().includes(q);
      const inDesc = item.description.toLowerCase().includes(q);
      const inNum = item.issueNumber.toLowerCase().includes(q);
      const inRootCause = item.resolution?.rootCause.toLowerCase().includes(q) || false;
      const inPermSol = item.resolution?.permanentSolution.toLowerCase().includes(q) || false;
      const inWorkaround = item.resolution?.workaround?.toLowerCase().includes(q) || false;
      const inSummary = item.kbSummary?.toLowerCase().includes(q) || false;

      return (
        inTitle ||
        inDesc ||
        inNum ||
        inRootCause ||
        inPermSol ||
        inWorkaround ||
        inSummary
      );
    }

    return true;
  });

  const toggleExpand = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search verified solutions by keyword, exception message, stack trace, or technology..."
              className="w-full pl-10 pr-4 py-2.5 text-xs text-slate-800 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              <option value="ALL">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick filter pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          <span className="text-slate-400 font-semibold text-[11px] mr-1">
            Quick Topics:
          </span>
          {["Hydration", "Prisma", "Docker", "Memory Leak", "Redis", "CORS", "Next.js", "PostgreSQL"].map(
            (topic) => (
              <button
                key={topic}
                onClick={() => setSearchTerm(topic)}
                className={`px-2.5 py-0.5 rounded-lg text-[11px] font-medium border transition-colors ${
                  searchTerm === topic
                    ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                    : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {topic}
              </button>
            )
          )}
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="text-[11px] text-rose-600 font-medium hover:underline ml-2"
            >
              Clear Search
            </button>
          )}
        </div>
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span>
          Showing <strong>{filtered.length}</strong> verified knowledge base articles
        </span>
      </div>

      {/* Articles Grid / List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <BookOpen className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">
            No matching solutions found
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search keywords or department filter. You can also review open investigations in the issue queue.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((item) => {
            const isExpanded = expandedCardId === item.id;
            return (
              <div
                key={item.id}
                className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {item.issueNumber}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <Sparkles className="w-3 h-3 text-emerald-600" />
                        <span>Verified Solution</span>
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" />
                        {item.department.name}
                      </span>
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1">
                        <FolderKanban className="w-3 h-3 text-slate-400" />
                        {item.project.name}
                      </span>
                    </div>

                    <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                      {item.title}
                    </h2>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => toggleExpand(item.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                    >
                      <span>{isExpanded ? "Collapse Details" : "Read Full Solution"}</span>
                      {isExpanded ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <Link
                      href={`/issues/${item.id}`}
                      className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                      title="Open full issue record"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Executive Summary / Root Cause Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Confirmed Root Cause
                    </span>
                    <p className="text-slate-800 line-clamp-3 leading-relaxed">
                      {item.resolution?.rootCause || "No root cause documented."}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-emerald-50/40 border border-emerald-200/80 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      Permanent Solution Summary
                    </span>
                    <p className="text-slate-900 line-clamp-3 leading-relaxed font-medium">
                      {item.kbSummary ||
                        item.resolution?.permanentSolution ||
                        "No permanent solution documented."}
                    </p>
                  </div>
                </div>

                {/* Expanded Details Section */}
                {isExpanded && item.resolution && (
                  <div className="pt-3 border-t border-slate-100 space-y-4 text-xs animate-in fade-in">
                    {/* Workaround if exists */}
                    {item.resolution.workaround && (
                      <div className="p-3.5 rounded-xl bg-amber-50/50 border border-amber-200 text-amber-900 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-amber-600" />
                          Emergency Workaround
                        </span>
                        <p className="text-xs text-amber-900 whitespace-pre-wrap">
                          {item.resolution.workaround}
                        </p>
                      </div>
                    )}

                    {/* Files & DB Changes */}
                    {(item.resolution.filesChanged ||
                      item.resolution.databaseChanges ||
                      item.resolution.deploymentSteps) && (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {item.resolution.filesChanged && (
                          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block flex items-center gap-1">
                              <GitBranch className="w-3 h-3" />
                              Files Changed
                            </span>
                            <pre className="font-mono text-[10px] text-emerald-400 whitespace-pre-wrap overflow-x-auto">
                              {item.resolution.filesChanged}
                            </pre>
                          </div>
                        )}

                        {item.resolution.databaseChanges && (
                          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                              <Database className="w-3 h-3" />
                              DB Changes
                            </span>
                            <pre className="font-mono text-[10px] text-amber-300 whitespace-pre-wrap overflow-x-auto">
                              {item.resolution.databaseChanges}
                            </pre>
                          </div>
                        )}

                        {item.resolution.deploymentSteps && (
                          <div className="p-3 bg-slate-900 text-slate-200 rounded-xl space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block flex items-center gap-1">
                              <Rocket className="w-3 h-3" />
                              Deployment
                            </span>
                            <pre className="font-mono text-[10px] text-sky-300 whitespace-pre-wrap overflow-x-auto">
                              {item.resolution.deploymentSteps}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Resolution Metadata / Credits */}
                    <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>
                        Resolved by <strong>{item.resolution.resolver.name}</strong>
                      </span>

                      {item.resolution.verifier && (
                        <span className="flex items-center gap-1 text-emerald-700 font-medium">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          Verified by {item.resolution.verifier.name} on{" "}
                          {item.resolution.verifiedAt
                            ? new Date(item.resolution.verifiedAt).toLocaleDateString()
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

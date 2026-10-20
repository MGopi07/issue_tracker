"use client";

import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { StatusBadge } from "./status-badge";
import { PriorityBadge } from "./priority-badge";
import { DeleteIssueButton } from "./delete-issue-button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

interface IssueItem {
  id: string;
  issueNumber: string;
  title: string;
  status: string;
  priority: string;
  createdAt: Date | string;
  project: { id: string; name: string; code: string };
  department: { id: string; name: string; code: string };
  category: { id: string; name: string };
  creator: { id: string; name: string; email: string; avatarUrl: string | null };
  assignee: { id: string; name: string; email: string; avatarUrl: string | null } | null;
}

interface IssueTableProps {
  issues: IssueItem[];
  total: number;
  page: number;
  totalPages: number;
  projects: { id: string; name: string; code: string }[];
  departments: { id: string; name: string; code: string }[];
  currentUserId?: string;
  currentUserRole?: string;
}

export function IssueTable({
  issues,
  total,
  page,
  totalPages,
  projects,
  departments,
  currentUserId,
  currentUserRole,
}: IssueTableProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentSearch = searchParams.get("search") || "";
  const currentProject = searchParams.get("projectId") || "";
  const currentDept = searchParams.get("departmentId") || "";
  const currentStatus = searchParams.get("status") || "";
  const currentPriority = searchParams.get("priority") || "";

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1"); // reset to page 1 on filter change
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = (formData.get("q") as string) || "";
    updateFilters("search", q);
  };

  const setPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="space-y-4">
      {/* Filter and Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Keyword Search */}
          <form onSubmit={handleSearch} className="relative flex-1 min-w-[280px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              name="q"
              defaultValue={currentSearch}
              placeholder="Search by issue ID (ISS-...), title, error logs..."
              className="w-full pl-9 pr-3 py-2 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </form>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Project Filter */}
            <select
              value={currentProject}
              onChange={(e) => updateFilters("projectId", e.target.value)}
              className="px-2.5 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>

            {/* Department Filter */}
            <select
              value={currentDept}
              onChange={(e) => updateFilters("departmentId", e.target.value)}
              className="px-2.5 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={currentStatus}
              onChange={(e) => updateFilters("status", e.target.value)}
              className="px-2.5 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="TRIAGED">Triaged</option>
              <option value="ASSIGNED">Assigned</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="FIX_READY">Fix Ready</option>
              <option value="IN_VERIFICATION">In Verification</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
              <option value="REOPENED">Reopened</option>
            </select>

            {/* Priority Filter */}
            <select
              value={currentPriority}
              onChange={(e) => updateFilters("priority", e.target.value)}
              className="px-2.5 py-2 text-xs text-slate-700 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">All Priorities</option>
              <option value="URGENT">Urgent (P0)</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Issues Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {issues.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-800">No matching issues found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Try adjusting your search criteria or clearing filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">ID & Priority</th>
                  <th className="px-4 py-3">Issue Title & Scope</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Reported</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {issues.map((issue) => (
                  <tr
                    key={issue.id}
                    className="hover:bg-slate-50/80 transition-colors group"
                  >
                    {/* ID & Priority */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <Link
                          href={`/issues/${issue.id}`}
                          className="font-mono font-bold text-xs text-indigo-600 group-hover:underline"
                        >
                          {issue.issueNumber}
                        </Link>
                        <PriorityBadge priority={issue.priority} />
                      </div>
                    </td>

                    {/* Title & Category */}
                    <td className="px-4 py-3.5 max-w-md">
                      <Link
                        href={`/issues/${issue.id}`}
                        className="block font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 text-xs"
                      >
                        {issue.title}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-500">
                        <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200/80">
                          {issue.department.code}
                        </span>
                        <span>•</span>
                        <span className="truncate">{issue.category.name}</span>
                      </div>
                    </td>

                    {/* Project */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-semibold text-slate-800">
                        [{issue.project.code}]
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <StatusBadge status={issue.status} />
                    </td>

                    {/* Assignee */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {issue.assignee ? (
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 font-bold flex items-center justify-center text-[10px]">
                            {issue.assignee.name.charAt(0)}
                          </div>
                          <span className="text-slate-800 text-xs">
                            {issue.assignee.name}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs italic">
                          Unassigned
                        </span>
                      )}
                    </td>

                    {/* Created Date */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-slate-400 text-[11px]">
                      {new Date(issue.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/issues/${issue.id}`}
                          title="Open Issue Cockpit"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        {(currentUserRole === "ADMIN" ||
                          currentUserRole === "SUPER_ADMIN" ||
                          (currentUserId && issue.creator.id === currentUserId)) && (
                          <DeleteIssueButton
                            issueId={issue.id}
                            issueNumber={issue.issueNumber}
                            variant="icon"
                          />
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-4 py-3 bg-slate-50/60 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <div>
            Showing <span className="font-semibold text-slate-700">{issues.length}</span> of{" "}
            <span className="font-semibold text-slate-700">{total}</span> total issues
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

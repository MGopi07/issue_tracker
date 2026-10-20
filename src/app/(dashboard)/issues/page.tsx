import { requireAuth } from "@/lib/rbac";
import { getIssuesAction } from "@/actions/issues";
import { getProjectsAction } from "@/actions/projects";
import { getDepartmentsWithCategoriesAction } from "@/actions/departments";
import { IssueTable } from "@/components/issues/issue-table";
import Link from "next/link";
import { Plus } from "lucide-react";

interface IssuesPageProps {
  searchParams: {
    search?: string;
    projectId?: string;
    departmentId?: string;
    categoryId?: string;
    status?: string;
    priority?: string;
    assigneeId?: string;
    page?: string;
  };
}

export default async function IssuesPage({ searchParams }: IssuesPageProps) {
  const user = await requireAuth();

  const page = parseInt(searchParams.page || "1", 10) || 1;

  const [issuesData, projects, departments] = await Promise.all([
    getIssuesAction({
      search: searchParams.search,
      projectId: searchParams.projectId,
      departmentId: searchParams.departmentId,
      categoryId: searchParams.categoryId,
      status: searchParams.status,
      priority: searchParams.priority,
      assigneeId: searchParams.assigneeId,
      page,
      pageSize: 15,
    }),
    getProjectsAction(),
    getDepartmentsWithCategoriesAction(),
  ]);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Issue Tracking Queue</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Filter, triage, assign, and inspect reported technical bugs across all projects.
          </p>
        </div>
        <Link
          href="/issues/create"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Report Issue</span>
        </Link>
      </div>

      {/* Main Issue Table with Server-side Filtering and Pagination */}
      <IssueTable
        issues={issuesData.issues}
        total={issuesData.total}
        page={issuesData.page}
        totalPages={issuesData.totalPages}
        projects={projects.map((p) => ({ id: p.id, name: p.name, code: p.code }))}
        departments={departments.map((d) => ({ id: d.id, name: d.name, code: d.code }))}
        currentUserId={user.id}
        currentUserRole={user.role}
      />
    </div>
  );
}

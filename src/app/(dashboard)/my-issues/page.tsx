import { requireAuth } from "@/lib/rbac";
import { getIssuesAction } from "@/actions/issues";
import { getProjectsAction } from "@/actions/projects";
import { getDepartmentsWithCategoriesAction } from "@/actions/departments";
import { IssueTable } from "@/components/issues/issue-table";
import Link from "next/link";
import { Plus, UserCheck } from "lucide-react";

interface MyIssuesPageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function MyIssuesPage({ searchParams }: MyIssuesPageProps) {
  const user = await requireAuth();
  const page = parseInt(searchParams.page || "1", 10) || 1;

  const [issuesData, projects, departments] = await Promise.all([
    getIssuesAction({
      createdById: user.id,
      search: searchParams.search,
      page,
      pageSize: 15,
    }),
    getProjectsAction(),
    getDepartmentsWithCategoriesAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-indigo-600" />
            <span>My Reported Issues</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Technical issues reported by you ({user.email}).
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

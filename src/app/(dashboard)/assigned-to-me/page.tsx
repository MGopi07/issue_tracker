import { requireAuth } from "@/lib/rbac";
import { getIssuesAction } from "@/actions/issues";
import { getProjectsAction } from "@/actions/projects";
import { getDepartmentsWithCategoriesAction } from "@/actions/departments";
import { IssueTable } from "@/components/issues/issue-table";
import { Inbox } from "lucide-react";

interface AssignedToMePageProps {
  searchParams: {
    page?: string;
    search?: string;
  };
}

export default async function AssignedToMePage({ searchParams }: AssignedToMePageProps) {
  const user = await requireAuth();
  const page = parseInt(searchParams.page || "1", 10) || 1;

  const [issuesData, projects, departments] = await Promise.all([
    getIssuesAction({
      assigneeId: user.id,
      search: searchParams.search,
      page,
      pageSize: 15,
    }),
    getProjectsAction(),
    getDepartmentsWithCategoriesAction(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Inbox className="w-5 h-5 text-indigo-600" />
          <span>Assigned to Me</span>
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Issues actively assigned to your engineering queue.
        </p>
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

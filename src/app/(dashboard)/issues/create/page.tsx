import { requireAuth } from "@/lib/rbac";
import { getDepartmentsWithCategoriesAction, getTeamMembersAction } from "@/actions/departments";
import { getProjectsAction } from "@/actions/projects";
import { CreateIssueForm } from "@/components/issues/create-issue-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CreateIssuePage() {
  await requireAuth();

  const [departments, projects, teamMembers] = await Promise.all([
    getDepartmentsWithCategoriesAction(),
    getProjectsAction(),
    getTeamMembersAction(),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back button & Title */}
      <div>
        <Link
          href="/issues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Issue Queue</span>
        </Link>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Report Technical Issue
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Submit complete technical diagnostic parameters to enable reproduction and preserve institutional knowledge.
        </p>
      </div>

      <CreateIssueForm
        departments={departments}
        projects={projects.map((p) => ({ id: p.id, name: p.name, code: p.code }))}
        teamMembers={teamMembers}
      />
    </div>
  );
}

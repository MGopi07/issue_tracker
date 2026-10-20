import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/rbac";
import { getIssueByIdAction } from "@/actions/issues";
import { getTeamMembersAction } from "@/actions/departments";
import { EditIssueForm } from "@/components/issues/edit-issue-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface EditIssuePageProps {
  params: {
    id: string;
  };
}

export default async function EditIssuePage({ params }: EditIssuePageProps) {
  await requireAuth();

  const [issue, teamMembers] = await Promise.all([
    getIssueByIdAction(params.id),
    getTeamMembersAction(),
  ]);

  if (!issue) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <Link
          href={`/issues/${issue.id}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Issue Details</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
            {issue.issueNumber}
          </span>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Edit Issue Parameters
          </h1>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Update technical reproduction context, priority, environment, or assignment.
        </p>
      </div>

      <EditIssueForm
        issue={{
          id: issue.id,
          issueNumber: issue.issueNumber,
          title: issue.title,
          description: issue.description,
          priority: issue.priority,
          environment: issue.environment,
          expectedBehavior: issue.expectedBehavior,
          actualBehavior: issue.actualBehavior,
          reproSteps: issue.reproSteps,
          errorMessages: issue.errorMessages,
          affectedUrl: issue.affectedUrl,
          gitBranch: issue.gitBranch,
          gitPullRequest: issue.gitPullRequest,
          gitCommitSha: issue.gitCommitSha,
          assigneeId: issue.assigneeId,
          version: issue.version,
        }}
        teamMembers={teamMembers}
      />
    </div>
  );
}

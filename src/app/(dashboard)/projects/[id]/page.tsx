import { notFound } from "next/navigation";
import { requireAuth } from "@/lib/rbac";
import { getProjectByIdAction } from "@/actions/projects";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Users,
  Plus,
} from "lucide-react";

interface ProjectDetailPageProps {
  params: {
    id: string;
  };
}

export default async function ProjectDetailPage({ params }: ProjectDetailPageProps) {
  await requireAuth();
  const project = await getProjectByIdAction(params.id);

  if (!project) {
    notFound();
  }

  const totalIssues = project._count.issues;
  const openIssues = project.issues.filter(
    (i) => i.status === "OPEN" || i.status === "IN_PROGRESS" || i.status === "BLOCKED"
  ).length;
  const resolvedIssues = project.issues.filter(
    (i) => i.status === "RESOLVED" || i.status === "VERIFIED" || i.status === "CLOSED"
  ).length;

  const resolutionRate =
    totalIssues > 0 ? Math.round((resolvedIssues / totalIssues) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Back button and Header banner */}
      <div>
        <Link
          href="/projects"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Projects</span>
        </Link>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-xs text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {project.code}
              </span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                {project.status}
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                {project.projectType}
              </span>
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {project.name}
            </h1>

            {project.description && (
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                {project.description}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {project.projectUrl && (
              <a
                href={project.projectUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
              >
                <span>Live Site</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            <Link
              href={`/issues/create`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Report Issue</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Total Issues
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalIssues}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Logged across all teams
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Active Defect Load
          </span>
          <div className="text-2xl font-bold text-amber-600 mt-2">
            {openIssues}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            In triage or investigation
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Resolved & Verified
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {resolvedIssues}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Landed permanent fixes
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Resolution Rate
          </span>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {resolutionRate}%
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Fix velocity ratio
          </span>
        </div>
      </div>

      {/* Two Column Layout: Issues Table & Members */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Project Issues List */}
        <div className="lg:col-span-2 p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Project Issues ({project.issues.length})
              </h2>
              <p className="text-xs text-slate-500">
                Issues and defects tracking under this project code
              </p>
            </div>

            <Link
              href={`/issues?projectId=${project.id}`}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Filter in Queue
            </Link>
          </div>

          {project.issues.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No issues tracked for this project yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="pb-3 pl-2">Issue</th>
                    <th className="pb-3">Title</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Priority</th>
                    <th className="pb-3">Assignee</th>
                    <th className="pb-3 text-right pr-2">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {project.issues.map((issue) => (
                    <tr key={issue.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-indigo-600">
                        <Link href={`/issues/${issue.id}`} className="hover:underline">
                          {issue.issueNumber}
                        </Link>
                      </td>
                      <td className="py-3 font-semibold text-slate-800 max-w-xs truncate">
                        <Link href={`/issues/${issue.id}`} className="hover:text-indigo-600">
                          {issue.title}
                        </Link>
                      </td>
                      <td className="py-3">
                        <StatusBadge status={issue.status} />
                      </td>
                      <td className="py-3">
                        <PriorityBadge priority={issue.priority} />
                      </td>
                      <td className="py-3 text-slate-600">
                        {issue.assignee ? issue.assignee.name : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-3 text-right pr-2 font-mono text-slate-400 text-[11px]">
                        {new Date(issue.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Project Context & Team Members */}
        <div className="space-y-6">
          {/* Manager & Governance Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5 text-xs">
            <h3 className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">
              Project Governance
            </h3>

            <div className="space-y-3">
              <div>
                <span className="text-slate-500 block text-[11px]">Project Manager</span>
                <span className="font-bold text-slate-800 text-sm">
                  {project.manager.name}
                </span>
                <span className="text-slate-400 text-[11px] block font-mono">
                  {project.manager.email}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="text-slate-500 block text-[11px]">Created</span>
                <span className="text-slate-700 font-mono text-[11px]">
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Members List */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold uppercase tracking-wider text-slate-500 text-[11px]">
                Project Members ({project.members.length})
              </h3>
            </div>

            <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {project.members.map((m) => (
                <div key={m.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">
                      {m.user.name}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {m.user.role.replace(/_/g, " ")}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                    {m.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

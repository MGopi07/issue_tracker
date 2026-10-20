import { notFound } from "next/navigation";
import { requireAuth, Permissions } from "@/lib/rbac";
import { getIssueByIdAction } from "@/actions/issues";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import { InvestigationJournal } from "@/components/issues/investigation-journal";
import { ResolutionSection } from "@/components/issues/resolution-section";
import { StatusTransitionBar } from "@/components/issues/status-transition-bar";
import { CommentsTimeline } from "@/components/issues/comments-timeline";
import { AttachmentsSection } from "@/components/issues/attachments-section";
import { RelationsSection } from "@/components/issues/relations-section";
import { DeleteIssueButton } from "@/components/issues/delete-issue-button";
import Link from "next/link";
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  Terminal,
  Building2,
  FolderKanban,
  Tags,
  FileCode,
  Sparkles,
} from "lucide-react";

interface IssueDetailPageProps {
  params: {
    id: string;
  };
}

export default async function IssueDetailPage({ params }: IssueDetailPageProps) {
  const currentUser = await requireAuth();
  const issue = await getIssueByIdAction(params.id);

  if (!issue) {
    notFound();
  }

  // Deduplicate and normalize outgoing & incoming relations
  const relationMap = new Map<string, { id: string; type: string; targetIssue: typeof issue.outgoingRelations[0]["targetIssue"] }>();
  issue.outgoingRelations.forEach((r) => {
    relationMap.set(`${r.type}-${r.targetIssue.id}`, { id: r.id, type: r.type, targetIssue: r.targetIssue });
  });
  issue.incomingRelations.forEach((r) => {
    const key = `${r.type}-${r.sourceIssue.id}`;
    if (!relationMap.has(key)) {
      relationMap.set(key, { id: r.id, type: r.type, targetIssue: r.sourceIssue });
    }
  });
  const relations = Array.from(relationMap.values());

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Back navigation and Header banner */}
      <div>
        <Link
          href="/issues"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Issue Queue</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono font-bold text-sm text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-lg border border-indigo-100">
                {issue.issueNumber}
              </span>
              <StatusBadge status={issue.status} />
              <PriorityBadge priority={issue.priority} />
              <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-semibold border border-slate-200">
                {issue.environment || "Production"}
              </span>
              {issue.isKnowledgeBase && (
                <span className="inline-flex items-center gap-1 text-xs px-2.5 py-0.5 rounded-md bg-amber-50 text-amber-800 font-bold border border-amber-200">
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Knowledge Base Article</span>
                </span>
              )}
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {issue.title}
            </h1>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={`/issues/${issue.id}/edit`}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Edit Issue Details
            </Link>
            {Permissions.canDeleteIssue(currentUser, issue.createdById) && (
              <DeleteIssueButton issueId={issue.id} issueNumber={issue.issueNumber} />
            )}
          </div>
        </div>
      </div>

      {/* Lifecycle Transition Bar */}
      <StatusTransitionBar
        issueId={issue.id}
        currentStatus={issue.status}
        userRole={currentUser.role}
        hasResolution={!!issue.resolution}
      />

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Diagnostics, Investigation, Resolution, Comments */}
        <div className="lg:col-span-2 space-y-6">
          {/* Detailed Description */}
          <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Description & Context
            </h2>
            <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-wrap">
              {issue.description}
            </div>
          </div>

          {/* Technical Diagnostics & Reproduction Parameters */}
          {(issue.expectedBehavior || issue.actualBehavior || issue.reproSteps) && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                <span>Technical Diagnostics & Reproduction</span>
              </h2>

              {issue.expectedBehavior && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    Expected Behavior
                  </span>
                  <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {issue.expectedBehavior}
                  </p>
                </div>
              )}

              {issue.actualBehavior && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    Actual Behavior
                  </span>
                  <p className="text-xs text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100">
                    {issue.actualBehavior}
                  </p>
                </div>
              )}

              {issue.reproSteps && (
                <div className="space-y-1">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tight">
                    Steps to Reproduce
                  </span>
                  <pre className="text-xs font-mono text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-wrap">
                    {issue.reproSteps}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Raw Error Messages & Stack Traces */}
          {issue.errorMessages && (
            <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-rose-600" />
                <span>Error Messages & Stack Trace</span>
              </h2>
              <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed border border-slate-800">
                {issue.errorMessages}
              </pre>
            </div>
          )}

          {/* Interactive Diagnostic Investigation Journal */}
          <InvestigationJournal
            issueId={issue.id}
            investigations={issue.investigations}
          />

          {/* Technical Resolution & QA Verification Section */}
          <ResolutionSection
            issueId={issue.id}
            resolution={issue.resolution}
            userRole={currentUser.role}
          />

          {/* Issue Dependencies, Blockers & Duplicate Links (Phase 10) */}
          <RelationsSection
            issueId={issue.id}
            relations={relations}
          />

          {/* Secure Diagnostic Attachments (Phase 9) */}
          <AttachmentsSection
            issueId={issue.id}
            attachments={issue.attachments}
            currentUserId={currentUser.id}
            userRole={currentUser.role}
          />

          {/* Unified Comments & Audit Activity Stream */}
          <CommentsTimeline
            issueId={issue.id}
            comments={issue.comments}
            activityLogs={issue.activityLogs}
          />
        </div>

        {/* Right Column: Scopes, Assignee, Metadata */}
        <div className="space-y-6">
          {/* Issue Scope Card */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Issue Context
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <FolderKanban className="w-3.5 h-3.5 text-slate-400" />
                  Project
                </span>
                <span className="font-semibold text-slate-800">
                  [{issue.project.code}] {issue.project.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Department
                </span>
                <span className="font-semibold text-slate-800">
                  {issue.department.name} ({issue.department.code})
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Category</span>
                <span className="font-semibold text-slate-800">
                  {issue.category.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Reported By</span>
                <span className="font-semibold text-slate-800">
                  {issue.creator.name}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500">Assignee</span>
                <span className="font-semibold text-slate-800">
                  {issue.assignee ? issue.assignee.name : "Unassigned"}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-100">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  Created
                </span>
                <span className="text-slate-600 font-mono text-[11px]">
                  {new Date(issue.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-500">Last Updated</span>
                <span className="text-slate-600 font-mono text-[11px]">
                  {new Date(issue.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Source Control & Links Card */}
          {(issue.affectedUrl || issue.gitBranch || issue.gitPullRequest || issue.gitCommitSha) && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Source Control
              </h3>

              <div className="space-y-2 text-xs">
                {issue.affectedUrl && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Affected URL
                    </span>
                    <a
                      href={issue.affectedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 truncate"
                    >
                      <span className="truncate">{issue.affectedUrl}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}

                {issue.gitBranch && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Git Branch
                    </span>
                    <span className="font-mono text-slate-800 text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {issue.gitBranch}
                    </span>
                  </div>
                )}

                {issue.gitPullRequest && (
                  <div>
                    <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                      Pull Request
                    </span>
                    <a
                      href={issue.gitPullRequest}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 hover:underline flex items-center gap-1 font-mono text-[11px]"
                    >
                      <span>PR Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {issue.tags.length > 0 && (
            <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Tags className="w-3.5 h-3.5 text-slate-400" />
                <span>Tags</span>
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {issue.tags.map((t) => (
                  <span
                    key={t.tag.id}
                    className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium border border-slate-200"
                  >
                    #{t.tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

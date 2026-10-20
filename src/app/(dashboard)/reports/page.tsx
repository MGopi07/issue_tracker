import { requireAuth } from "@/lib/rbac";
import { getRcaReportsAction } from "@/actions/reports";
import Link from "next/link";
import {
  BarChart3,
  ExternalLink,
} from "lucide-react";

export default async function ReportsPage() {
  await requireAuth();
  const { resolvedIssues, departmentMetrics } = await getRcaReportsAction();

  const totalResolved = resolvedIssues.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                RCA & Technical Incident Reports
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Root Cause Analyses, Mean Time to Resolution (MTTR), and regression prevention records.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Documented RCAs
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {totalResolved}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            With verified root cause models
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            QA Verified Rate
          </span>
          <div className="text-2xl font-bold text-emerald-600 mt-2">
            {totalResolved > 0
              ? `${Math.round(
                  (resolvedIssues.filter((i) => i.resolution?.verificationPassed).length /
                    totalResolved) *
                    100
                )}%`
              : "0%"}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Passed rigorous QA sign-off
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Knowledge Base Yield
          </span>
          <div className="text-2xl font-bold text-indigo-600 mt-2">
            {resolvedIssues.filter((i) => i.isKnowledgeBase).length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Promoted to team KB articles
          </span>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
            Departments Active
          </span>
          <div className="text-2xl font-bold text-slate-900 mt-2">
            {departmentMetrics.length}
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Tracking MTTR and quality
          </span>
        </div>
      </div>

      {/* Department Quality & Resolution Rate Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Department Performance & MTTR Summary
          </h2>
          <p className="text-xs text-slate-500">
            Resolution velocity and defect mitigation by specialized technical team
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="pb-3 pl-2">Department</th>
                <th className="pb-3 text-center">Total Issues</th>
                <th className="pb-3 text-center">Resolved</th>
                <th className="pb-3">Resolution Rate</th>
                <th className="pb-3 text-right pr-2">Avg Resolution Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {departmentMetrics.map((dept) => (
                <tr key={dept.code} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 pl-2 font-semibold text-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                        {dept.code}
                      </span>
                      <span>{dept.name}</span>
                    </div>
                  </td>
                  <td className="py-3 text-center font-mono font-medium text-slate-700">
                    {dept.totalIssues}
                  </td>
                  <td className="py-3 text-center font-mono font-bold text-emerald-600">
                    {dept.resolvedCount}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center gap-2 max-w-xs">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-600 rounded-full transition-all"
                          style={{ width: `${dept.resolutionRate}%` }}
                        />
                      </div>
                      <span className="font-mono text-[11px] font-bold text-slate-700 w-8">
                        {dept.resolutionRate}%
                      </span>
                    </div>
                  </td>
                  <td className="py-3 text-right pr-2 font-mono text-slate-600 text-[11px]">
                    {dept.avgResolutionHours > 0
                      ? `${dept.avgResolutionHours}h`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Post-Mortem & RCA Log */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Root Cause Analysis (RCA) Archive ({resolvedIssues.length})
          </h2>
          <p className="text-xs text-slate-500">
            Permanent resolutions, files changed, and regression prevention strategies
          </p>
        </div>

        {resolvedIssues.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
            No resolved issues with RCA documentation yet.
          </div>
        ) : (
          <div className="space-y-4">
            {resolvedIssues.map((issue) => (
              <div
                key={issue.id}
                className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/80 space-y-3 text-xs"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/60">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                      {issue.issueNumber}
                    </span>
                    <strong className="text-slate-900 text-sm">{issue.title}</strong>
                    <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded bg-white border border-slate-200">
                      [{issue.project.code}] {issue.department.name}
                    </span>
                  </div>

                  <Link
                    href={`/issues/${issue.id}`}
                    className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 text-[11px] shrink-0"
                  >
                    <span>View Issue</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-slate-200/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Root Cause
                    </span>
                    <p className="text-slate-800 leading-relaxed">
                      {issue.resolution?.rootCause}
                    </p>
                  </div>

                  <div className="p-3 bg-emerald-50/40 rounded-xl border border-emerald-200/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
                      Permanent Solution
                    </span>
                    <p className="text-slate-900 leading-relaxed font-medium">
                      {issue.resolution?.permanentSolution}
                    </p>
                  </div>
                </div>

                {issue.resolution?.regressionPrevention && (
                  <div className="text-[11px] text-slate-700 bg-white p-2.5 rounded-lg border border-slate-200/60">
                    <span className="font-bold text-indigo-600">Regression Prevention: </span>
                    {issue.resolution.regressionPrevention}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

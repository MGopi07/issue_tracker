import { requireAuth } from "@/lib/rbac";
import { getDashboardMetricsAction } from "@/actions/dashboard";
import { DashboardCharts } from "@/components/dashboard/dashboard-charts";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  BookOpen,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  AlertTriangle,
} from "lucide-react";

export default async function DashboardPage() {
  const user = await requireAuth();
  const metrics = await getDashboardMetricsAction();

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl shadow-slate-900/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              Role: {user.role.replace("_", " ")}
            </span>
            {user.departments.length > 0 && (
              <span className="text-xs text-slate-400">
                • {user.departments.map((d) => d.name).join(", ")}
              </span>
            )}
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
            Welcome back, {user.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            TechIssue Hub engineering CRM is actively tracking {metrics.totalIssues} issues across web, backend, DevOps, and mobile services.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/issues/create"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Report Technical Issue</span>
          </Link>
          <Link
            href="/knowledge-base"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all"
          >
            <BookOpen className="w-4 h-4" />
            <span>Knowledge Base ({metrics.kbArticlesCount})</span>
          </Link>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Open</span>
            <div className="p-1.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.openCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Awaiting triage & assignment</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">In Progress</span>
            <div className="p-1.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.inProgressCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Active diagnostic investigations</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Awaiting QA</span>
            <div className="p-1.5 rounded-xl bg-sky-50 text-sky-600 border border-sky-100">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.awaitingQaCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Fix submitted, pending verification</span>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Verified / Closed</span>
            <div className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">{metrics.resolvedClosedCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span>Permanent solutions landed</span>
          </div>
        </div>
      </div>

      {/* Critical / High Alerts Banner if any */}
      {metrics.criticalUrgentCount > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between text-xs text-rose-900">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-600 text-white rounded-xl">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <strong className="font-bold">
                {metrics.criticalUrgentCount} High-Severity Defect(s) Active
              </strong>
              <p className="text-rose-700 text-[11px]">
                Immediate attention required for critical or urgent blockers in production.
              </p>
            </div>
          </div>

          <Link
            href="/issues?priority=CRITICAL"
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold transition-colors shrink-0"
          >
            View Critical Issues
          </Link>
        </div>
      )}

      {/* Analytics Charts */}
      <DashboardCharts
        byDepartment={metrics.byDepartment}
        byPriority={metrics.byPriority}
      />

      {/* Recent Issues Table */}
      <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Recently Reported Issues
            </h2>
            <p className="text-xs text-slate-500">
              Latest items logged into the engineering issue queue
            </p>
          </div>

          <Link
            href="/issues"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>View All Issues</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {metrics.recentIssues.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
            No issues recorded yet. Click &quot;Report Technical Issue&quot; to log your first ticket.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Issue</th>
                  <th className="pb-3">Title</th>
                  <th className="pb-3">Project</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Priority</th>
                  <th className="pb-3">Assignee</th>
                  <th className="pb-3 text-right pr-2">Reported</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {metrics.recentIssues.map((issue) => (
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
                    <td className="py-3 text-slate-600">{issue.projectName}</td>
                    <td className="py-3">
                      <StatusBadge status={issue.status} />
                    </td>
                    <td className="py-3">
                      <PriorityBadge priority={issue.priority} />
                    </td>
                    <td className="py-3 text-slate-600">
                      {issue.assigneeName || (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </td>
                    <td className="py-3 text-right pr-2 text-slate-400 font-mono text-[11px]">
                      {new Date(issue.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

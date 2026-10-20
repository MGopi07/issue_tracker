import { IssueStatus } from "@/types";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  let badgeStyle = "bg-slate-100 text-slate-700 border-slate-200";
  let label = status.replace("_", " ");

  switch (status) {
    case IssueStatus.OPEN:
      badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
      break;
    case IssueStatus.TRIAGED:
      badgeStyle = "bg-blue-50 text-blue-700 border-blue-200";
      break;
    case IssueStatus.ASSIGNED:
      badgeStyle = "bg-cyan-50 text-cyan-700 border-cyan-200";
      break;
    case IssueStatus.IN_PROGRESS:
      badgeStyle = "bg-indigo-50 text-indigo-700 border-indigo-200 font-semibold";
      break;
    case IssueStatus.BLOCKED:
      badgeStyle = "bg-rose-50 text-rose-700 border-rose-200 font-semibold";
      break;
    case IssueStatus.FIX_READY:
      badgeStyle = "bg-amber-50 text-amber-700 border-amber-200 font-semibold";
      label = "Fix Ready";
      break;
    case IssueStatus.IN_VERIFICATION:
      badgeStyle = "bg-purple-50 text-purple-700 border-purple-200 font-semibold";
      label = "In Verification";
      break;
    case IssueStatus.RESOLVED:
      badgeStyle = "bg-emerald-50 text-emerald-700 border-emerald-300 font-bold";
      break;
    case IssueStatus.CLOSED:
      badgeStyle = "bg-slate-200 text-slate-800 border-slate-300";
      break;
    case IssueStatus.REOPENED:
      badgeStyle = "bg-orange-50 text-orange-700 border-orange-300 font-semibold";
      break;
  }

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] border font-medium uppercase tracking-tight shrink-0 ${badgeStyle} ${className}`}
    >
      {label}
    </span>
  );
}

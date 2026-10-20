import { Priority } from "@/types";
import { AlertCircle, AlertTriangle, ArrowDown, Flame, ShieldAlert } from "lucide-react";

interface PriorityBadgeProps {
  priority: string;
  showIcon?: boolean;
}

export function PriorityBadge({ priority, showIcon = true }: PriorityBadgeProps) {
  let color = "text-slate-600 bg-slate-50 border-slate-200";
  let Icon = ArrowDown;

  switch (priority) {
    case Priority.URGENT:
      color = "text-rose-700 bg-rose-50 border-rose-300 font-bold";
      Icon = Flame;
      break;
    case Priority.CRITICAL:
      color = "text-red-700 bg-red-50 border-red-200 font-bold";
      Icon = ShieldAlert;
      break;
    case Priority.HIGH:
      color = "text-amber-700 bg-amber-50 border-amber-200 font-semibold";
      Icon = AlertTriangle;
      break;
    case Priority.MEDIUM:
      color = "text-indigo-700 bg-indigo-50 border-indigo-200";
      Icon = AlertCircle;
      break;
    case Priority.LOW:
      color = "text-slate-600 bg-slate-100 border-slate-200";
      Icon = ArrowDown;
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] border uppercase tracking-wider font-medium shrink-0 ${color}`}
    >
      {showIcon && <Icon className="w-3 h-3 shrink-0" />}
      <span>{priority}</span>
    </span>
  );
}

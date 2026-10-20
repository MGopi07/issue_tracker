"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { transitionIssueStatusAction } from "@/actions/lifecycle";
import { StatusBadge } from "@/components/issues/status-badge";
import { IssueStatus } from "@/types";
import {
  Play,
  Ban,
  CheckCircle2,
  RotateCcw,
  Copy,
  ChevronRight,
} from "lucide-react";

interface StatusTransitionBarProps {
  issueId: string;
  currentStatus: string;
  userRole?: string;
  hasResolution?: boolean;
}

function SubmitTransitionButton({
  label,
  icon: Icon,
  colorClass,
}: {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all disabled:opacity-50 ${colorClass}`}
    >
      <Icon className="w-3.5 h-3.5" />
      <span>{pending ? "Updating..." : label}</span>
    </button>
  );
}

export function StatusTransitionBar({
  issueId,
  currentStatus,
  hasResolution,
}: StatusTransitionBarProps) {
  const [selectedNextStatus, setSelectedNextStatus] = useState<string | null>(null);
  const [state, formAction] = useFormState(transitionIssueStatusAction, null);

  if (state?.success && selectedNextStatus) {
    setSelectedNextStatus(null);
  }

  return (
    <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Lifecycle State:
          </span>
          <StatusBadge status={currentStatus} />
        </div>

        {/* Action button quick transitions based on current status */}
        <div className="flex flex-wrap items-center gap-1.5">
          {(currentStatus === IssueStatus.OPEN || currentStatus === IssueStatus.ASSIGNED) && (
            <>
              <button
                type="button"
                onClick={() => setSelectedNextStatus(IssueStatus.IN_PROGRESS)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Start Investigation</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedNextStatus(IssueStatus.BLOCKED)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Mark Blocked</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedNextStatus(IssueStatus.DUPLICATE)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate</span>
              </button>
            </>
          )}

          {currentStatus === IssueStatus.IN_PROGRESS && (
            <>
              <a
                href="#resolution-section"
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors shadow-2xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Submit Fix & Mark Resolved</span>
              </a>
              <button
                type="button"
                onClick={() => setSelectedNextStatus(IssueStatus.BLOCKED)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <Ban className="w-3.5 h-3.5" />
                <span>Mark Blocked</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedNextStatus(IssueStatus.OPEN)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Return to Open</span>
              </button>
            </>
          )}

          {currentStatus === IssueStatus.BLOCKED && (
            <button
              type="button"
              onClick={() => setSelectedNextStatus(IssueStatus.IN_PROGRESS)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              <span>Resume Investigation</span>
            </button>
          )}

          {(currentStatus === IssueStatus.RESOLVED || currentStatus === IssueStatus.VERIFIED) && (
            <>
              <button
                type="button"
                onClick={() => setSelectedNextStatus(IssueStatus.CLOSED)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-300 bg-slate-900 text-white hover:bg-slate-800 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Close Issue</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedNextStatus(IssueStatus.REOPENED)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reopen</span>
              </button>
            </>
          )}

          {currentStatus === IssueStatus.CLOSED && (
            <button
              type="button"
              onClick={() => setSelectedNextStatus(IssueStatus.REOPENED)}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-xl border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reopen Issue</span>
            </button>
          )}
        </div>
      </div>

      {/* Confirmation form with comment */}
      {selectedNextStatus && (
        <form
          action={formAction}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 animate-in fade-in"
        >
          <input type="hidden" name="issueId" value={issueId} />
          <input type="hidden" name="nextStatus" value={selectedNextStatus} />

          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <span>Transition Status:</span>
              <StatusBadge status={currentStatus} />
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <StatusBadge status={selectedNextStatus} />
            </span>

            <button
              type="button"
              onClick={() => setSelectedNextStatus(null)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          {state?.error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {state.error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Transition Reason / Audit Note
            </label>
            <input
              type="text"
              name="comment"
              placeholder={`Reason for moving issue to ${selectedNextStatus}...`}
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedNextStatus(null)}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>

            <SubmitTransitionButton
              label={`Confirm -> ${selectedNextStatus}`}
              icon={CheckCircle2}
              colorClass="bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
            />
          </div>
        </form>
      )}
    </div>
  );
}

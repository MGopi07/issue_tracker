"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { addIssueRelationAction, removeIssueRelationAction } from "@/actions/relations";
import { StatusBadge } from "@/components/issues/status-badge";
import { PriorityBadge } from "@/components/issues/priority-badge";
import { RelationType } from "@/types";
import {
  Link2,
  Plus,
  X,
  AlertOctagon,
  Copy,
  ArrowRight,
  Trash2,
  Layers,
} from "lucide-react";

interface RelatedIssueItem {
  id: string;
  type: string;
  targetIssue: {
    id: string;
    issueNumber: string;
    title: string;
    status: string;
    priority: string;
  };
}

interface RelationsSectionProps {
  issueId: string;
  relations: RelatedIssueItem[];
}

function SubmitLinkButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm disabled:opacity-50"
    >
      <Link2 className="w-3.5 h-3.5" />
      <span>{pending ? "Linking..." : "Establish Link"}</span>
    </button>
  );
}

export function RelationsSection({ issueId, relations }: RelationsSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useFormState(addIssueRelationAction, null);

  if (state?.success && isOpen) {
    setIsOpen(false);
  }

  const handleUnlink = async (relationId: string) => {
    if (confirm("Are you sure you want to remove this issue link?")) {
      await removeIssueRelationAction(relationId);
    }
  };

  // Group relations
  const blockedBy = relations.filter((r) => r.type === RelationType.IS_BLOCKED_BY);
  const blocks = relations.filter((r) => r.type === RelationType.BLOCKS);
  const duplicates = relations.filter(
    (r) => r.type === RelationType.DUPLICATES || r.type === RelationType.IS_DUPLICATED_BY
  );
  const related = relations.filter((r) => r.type === RelationType.RELATES_TO);

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Dependencies & Linked Issues ({relations.length})
          </h2>
        </div>

        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Link Issue</span>
          </button>
        )}
      </div>

      {/* Link Form Drawer */}
      {isOpen && (
        <form
          action={formAction}
          className="p-5 rounded-2xl bg-indigo-50/20 border border-indigo-100 space-y-3"
        >
          <input type="hidden" name="sourceIssueId" value={issueId} />

          <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
            <span className="text-xs font-bold text-slate-800">
              Link Dependency or Related Ticket
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {state?.error && (
            <div className="p-2.5 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {state.error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                Relation Type
              </label>
              <select
                name="type"
                defaultValue={RelationType.IS_BLOCKED_BY}
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              >
                <option value={RelationType.IS_BLOCKED_BY}>Is Blocked By (Dependency)</option>
                <option value={RelationType.BLOCKS}>Blocks (Dependent)</option>
                <option value={RelationType.DUPLICATES}>Duplicates</option>
                <option value={RelationType.IS_DUPLICATED_BY}>Is Duplicated By</option>
                <option value={RelationType.RELATES_TO}>Relates To</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                Target Issue Number or ID <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="targetIdentifier"
                required
                placeholder="e.g. ISS-2026-0002"
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
            >
              Cancel
            </button>
            <SubmitLinkButton />
          </div>
        </form>
      )}

      {/* Relations Groups */}
      {relations.length === 0 ? (
        <div className="p-6 text-center bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-400">
          No blockers, dependencies, or related tickets linked yet.
        </div>
      ) : (
        <div className="space-y-3.5 text-xs">
          {/* Active Blockers */}
          {blockedBy.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1">
                <AlertOctagon className="w-3.5 h-3.5" />
                <span>Blocked By ({blockedBy.length})</span>
              </span>
              <div className="space-y-1.5">
                {blockedBy.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-rose-50/50 border border-rose-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-mono font-bold text-rose-700 bg-rose-100/80 px-2 py-0.5 rounded text-[11px] shrink-0 hover:underline"
                      >
                        {r.targetIssue.issueNumber}
                      </Link>
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-semibold text-slate-800 hover:text-rose-700 truncate"
                      >
                        {r.targetIssue.title}
                      </Link>
                      <StatusBadge status={r.targetIssue.status} />
                      <PriorityBadge priority={r.targetIssue.priority} />
                    </div>

                    <button
                      onClick={() => handleUnlink(r.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-100/50 transition-colors"
                      title="Unlink"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Blocks (This issue blocks others) */}
          {blocks.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 flex items-center gap-1">
                <ArrowRight className="w-3.5 h-3.5" />
                <span>Blocks ({blocks.length})</span>
              </span>
              <div className="space-y-1.5">
                {blocks.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-amber-50/40 border border-amber-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-mono font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded text-[11px] shrink-0 hover:underline"
                      >
                        {r.targetIssue.issueNumber}
                      </Link>
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-semibold text-slate-800 hover:text-amber-800 truncate"
                      >
                        {r.targetIssue.title}
                      </Link>
                      <StatusBadge status={r.targetIssue.status} />
                    </div>

                    <button
                      onClick={() => handleUnlink(r.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Unlink"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duplicates */}
          {duplicates.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate Links ({duplicates.length})</span>
              </span>
              <div className="space-y-1.5">
                {duplicates.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[10px] font-mono text-slate-500 font-semibold uppercase">
                        {r.type.replace(/_/g, " ")}:
                      </span>
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] shrink-0 hover:underline"
                      >
                        {r.targetIssue.issueNumber}
                      </Link>
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-semibold text-slate-800 hover:text-indigo-600 truncate"
                      >
                        {r.targetIssue.title}
                      </Link>
                      <StatusBadge status={r.targetIssue.status} />
                    </div>

                    <button
                      onClick={() => handleUnlink(r.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Unlink"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Related Tickets */}
          {related.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" />
                <span>Related Issues ({related.length})</span>
              </span>
              <div className="space-y-1.5">
                {related.map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded text-[11px] shrink-0 hover:underline"
                      >
                        {r.targetIssue.issueNumber}
                      </Link>
                      <Link
                        href={`/issues/${r.targetIssue.id}`}
                        className="font-semibold text-slate-800 hover:text-indigo-600 truncate"
                      >
                        {r.targetIssue.title}
                      </Link>
                      <StatusBadge status={r.targetIssue.status} />
                    </div>

                    <button
                      onClick={() => handleUnlink(r.id)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Unlink"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

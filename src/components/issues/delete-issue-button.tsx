"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteIssueAction } from "@/actions/issues";
import { Trash2, AlertTriangle, Loader2, X } from "lucide-react";

interface DeleteIssueButtonProps {
  issueId: string;
  issueNumber: string;
  variant?: "button" | "icon";
}

export function DeleteIssueButton({
  issueId,
  issueNumber,
  variant = "button",
}: DeleteIssueButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      const res = await deleteIssueAction(issueId);
      if (res.success) {
        setShowConfirm(false);
        router.push("/issues");
        router.refresh();
      } else {
        setError(res.error || "Failed to delete issue.");
      }
    } catch {
      setError("An unexpected error occurred while deleting the issue.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {variant === "icon" ? (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          title="Delete Issue"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors shadow-2xs"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Delete Issue</span>
        </button>
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in text-left whitespace-normal">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 text-left whitespace-normal">
            <div className="px-6 py-5 bg-gradient-to-r from-rose-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/30 flex items-center justify-center text-rose-300">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight text-white">Delete Technical Issue</h3>
                  <p className="text-[11px] text-slate-300">
                    Permanent deletion confirmation
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs text-left whitespace-normal">
              <p className="text-slate-700 leading-relaxed text-left whitespace-normal">
                Are you sure you want to permanently delete issue{" "}
                <span className="font-mono font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 inline-block">
                  {issueNumber}
                </span>
                ?
              </p>

              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-3 text-left whitespace-normal">
                <div className="w-6 h-6 rounded-lg bg-amber-100/80 border border-amber-300/50 flex items-center justify-center shrink-0 mt-0.5 text-amber-700">
                  <AlertTriangle className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-0.5 text-left whitespace-normal">
                  <span className="font-bold text-amber-950 block text-left">Warning:</span>
                  <p className="leading-relaxed text-amber-800 text-left whitespace-normal">
                    This will permanently erase all diagnostic logs, reproduction parameters,
                    resolution records, and attachments. This action cannot be undone.
                  </p>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold text-left whitespace-normal">
                  {error}
                </div>
              )}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 transition-all"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Issue...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

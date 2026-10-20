"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { createInvestigationAction } from "@/actions/investigations";
import {
  History,
  Plus,
  X,
  Stethoscope,
  Terminal,
  AlertTriangle,
  CheckCircle2,
  Wrench,
  Search,
  BookOpen,
} from "lucide-react";

interface InvestigationEntry {
  id: string;
  observation: string;
  hypothesis?: string | null;
  diagnosticSteps?: string | null;
  toolsUsed?: string | null;
  findings: string;
  failedAttempts?: string | null;
  evidence?: string | null;
  conclusion?: string | null;
  createdAt: string | Date;
  investigator: {
    id: string;
    name: string;
    role?: string;
  };
}

interface InvestigationJournalProps {
  issueId: string;
  investigations: InvestigationEntry[];
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm disabled:opacity-50"
    >
      <Stethoscope className="w-3.5 h-3.5" />
      <span>{pending ? "Recording Entry..." : "Save Diagnostic Entry"}</span>
    </button>
  );
}

export function InvestigationJournal({
  issueId,
  investigations,
}: InvestigationJournalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [state, formAction] = useFormState(createInvestigationAction, null);

  // Close form on success
  if (state?.success && isOpen) {
    setIsOpen(false);
  }

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Investigation & Diagnostic Journal ({investigations.length})
          </h2>
        </div>

        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Diagnostic Entry</span>
          </button>
        )}
      </div>

      {/* Add Entry Form Modal/Drawer */}
      {isOpen && (
        <form
          action={formAction}
          className="p-5 rounded-2xl bg-indigo-50/30 border border-indigo-100/80 space-y-4 transition-all"
        >
          <div className="flex items-center justify-between border-b border-indigo-100 pb-3">
            <div className="flex items-center gap-2">
              <Stethoscope className="w-4 h-4 text-indigo-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight">
                New Technical Diagnostic Finding
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <input type="hidden" name="issueId" value={issueId} />

          {state?.error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {state.error}
            </div>
          )}

          <div className="space-y-3">
            {/* Observation */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                Observed Symptom / Behavior <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                name="observation"
                required
                placeholder="e.g. Memory spike occurs specifically during PDF generation requests"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            {/* Hypothesis & Tools in 2 Cols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                  Working Hypothesis
                </label>
                <input
                  type="text"
                  name="hypothesis"
                  placeholder="e.g. Unclosed Puppeteer browser instances in worker pool"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                  Tools & Instrumentation Used
                </label>
                <input
                  type="text"
                  name="toolsUsed"
                  placeholder="e.g. Chrome DevTools Heap Profiler, Datadog APM, pprof"
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                />
              </div>
            </div>

            {/* Diagnostic Steps & Findings */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                Diagnostic Steps Taken
              </label>
              <textarea
                name="diagnosticSteps"
                rows={2}
                placeholder="1. Replayed 50 concurrent PDF exports in staging&#10;2. Captured memory snapshots at 10s intervals"
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                Detailed Findings & Evidence <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="findings"
                required
                rows={3}
                placeholder="Found 14 orphan Chromium processes retaining 1.2GB resident memory after timeout."
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>

            {/* Failed Attempts / Dead Ends to Avoid */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-amber-700 mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" />
                <span>Failed Attempts & Dead Ends (Crucial for Knowledge Base)</span>
              </label>
              <textarea
                name="failedAttempts"
                rows={2}
                placeholder="Attempted increasing V8 max-old-space-size to 4096MB; did not resolve the issue, simply postponed the OOM crash."
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-amber-200 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-amber-50/20 text-slate-800"
              />
            </div>

            {/* Conclusion / Next Steps */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
                Diagnostic Conclusion / Recommended Fix Path
              </label>
              <input
                type="text"
                name="conclusion"
                placeholder="e.g. Implement browser pool lifecycle manager with explicit process.kill on request cleanup"
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100">
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              Cancel
            </button>
            <SubmitButton />
          </div>
        </form>
      )}

      {/* Investigation List */}
      {investigations.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
          <Search className="w-6 h-6 text-slate-300 mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            No diagnostic investigation logs recorded yet.
          </p>
          <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
            Log technical findings, tools used, and dead ends so teammates can understand the root cause and avoid duplicate effort.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {investigations.map((inv, idx) => (
            <div
              key={inv.id}
              className="p-5 rounded-2xl bg-slate-50/70 border border-slate-200/90 space-y-3.5 text-xs transition-shadow hover:shadow-xs"
            >
              {/* Header with investigator & timestamp */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                    LOG #{investigations.length - idx}
                  </span>
                  <span className="font-semibold text-slate-800">
                    {inv.investigator.name}
                  </span>
                  {inv.investigator.role && (
                    <span className="text-[10px] text-slate-400 uppercase font-mono">
                      ({inv.investigator.role})
                    </span>
                  )}
                </div>
                <span className="text-slate-400 text-[11px] font-mono">
                  {new Date(inv.createdAt).toLocaleString()}
                </span>
              </div>

              {/* Observation & Hypothesis */}
              <div className="space-y-2">
                <div className="text-slate-900 font-medium">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                    Observation
                  </span>
                  {inv.observation}
                </div>

                {inv.hypothesis && (
                  <div className="text-slate-700 bg-white p-3 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block mb-0.5 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" />
                      Hypothesis
                    </span>
                    {inv.hypothesis}
                  </div>
                )}
              </div>

              {/* Tools & Diagnostic Steps */}
              {(inv.toolsUsed || inv.diagnosticSteps) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  {inv.toolsUsed && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                        <Wrench className="w-3 h-3 text-slate-500" />
                        Tools Used
                      </span>
                      <span className="font-mono text-slate-700 text-[11px]">
                        {inv.toolsUsed}
                      </span>
                    </div>
                  )}

                  {inv.diagnosticSteps && (
                    <div className="bg-white p-3 rounded-xl border border-slate-200/60">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                        <Terminal className="w-3 h-3 text-slate-500" />
                        Diagnostic Steps
                      </span>
                      <p className="text-slate-700 whitespace-pre-wrap">
                        {inv.diagnosticSteps}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Findings */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Findings & Diagnosis
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {inv.findings}
                </p>
              </div>

              {/* Failed Attempts & Dead Ends */}
              {inv.failedAttempts && (
                <div className="bg-amber-50/60 p-3 rounded-xl border border-amber-200/80 space-y-1 text-amber-900">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Failed Attempts / Dead Ends (Do Not Repeat)
                  </span>
                  <p className="text-xs text-amber-800 whitespace-pre-wrap">
                    {inv.failedAttempts}
                  </p>
                </div>
              )}

              {/* Conclusion */}
              {inv.conclusion && (
                <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200/80 space-y-1 text-emerald-950">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Conclusion
                  </span>
                  <p className="text-xs text-emerald-900 font-medium">
                    {inv.conclusion}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

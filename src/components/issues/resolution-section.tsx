"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { submitResolutionAction, verifyResolutionAction } from "@/actions/resolutions";
import {
  CheckCircle,
  FileCheck2,
  ShieldCheck,
  AlertCircle,
  GitBranch,
  Database,
  Rocket,
  ShieldAlert,
  Sparkles,
  BookCheck,
} from "lucide-react";

interface ResolutionData {
  id: string;
  rootCause: string;
  permanentSolution: string;
  workaround?: string | null;
  filesChanged?: string | null;
  configChanges?: string | null;
  databaseChanges?: string | null;
  deploymentSteps?: string | null;
  regressionPrevention?: string | null;
  verificationChecklist?: string | null;
  metricsBeforeAfter?: string | null;
  finalSummary?: string | null;
  resolver: {
    id: string;
    name: string;
    role?: string;
  };
  verifier?: {
    id: string;
    name: string;
    role?: string;
  } | null;
  verifiedAt?: string | Date | null;
  verificationPassed?: boolean | null;
  verificationNotes?: string | null;
}

interface ResolutionSectionProps {
  issueId: string;
  resolution: ResolutionData | null;
  userRole?: string;
}

function SubmitResolutionButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-sm disabled:opacity-50"
    >
      <CheckCircle className="w-3.5 h-3.5" />
      <span>{pending ? "Submitting Resolution..." : "Submit Verified Fix"}</span>
    </button>
  );
}

function VerifyButton({ passed }: { passed: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      name="passed"
      value={passed ? "true" : "false"}
      disabled={pending}
      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white transition-all shadow-sm disabled:opacity-50 ${
        passed
          ? "bg-emerald-600 hover:bg-emerald-700"
          : "bg-rose-600 hover:bg-rose-700"
      }`}
    >
      {passed ? (
        <ShieldCheck className="w-3.5 h-3.5" />
      ) : (
        <AlertCircle className="w-3.5 h-3.5" />
      )}
      <span>
        {pending
          ? "Processing..."
          : passed
          ? "Approve & Mark Verified"
          : "Reject & Request Fix"}
      </span>
    </button>
  );
}

export function ResolutionSection({
  issueId,
  resolution,
  userRole,
}: ResolutionSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showVerifyForm, setShowVerifyForm] = useState(false);

  const [resState, submitResolution] = useFormState(submitResolutionAction, null);
  const [verifyState, submitVerification] = useFormState(verifyResolutionAction, null);

  if (resState?.success && isEditing) {
    setIsEditing(false);
  }

  if (verifyState?.success && showVerifyForm) {
    setShowVerifyForm(false);
  }

  // Can verify if QA, PM, Admin, or DevOps
  const canVerify =
    userRole === "QA_ENGINEER" ||
    userRole === "PROJECT_MANAGER" ||
    userRole === "ADMIN" ||
    userRole === "SUPER_ADMIN" ||
    userRole === "DEVOPS";

  return (
    <div id="resolution-section" className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-6 scroll-mt-24">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Technical Resolution & Fix Documentation
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {resolution && !isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors"
            >
              Update Resolution
            </button>
          )}

          {resolution && canVerify && !showVerifyForm && (
            <button
              onClick={() => setShowVerifyForm(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors flex items-center gap-1.5"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>QA Verification Sign-off</span>
            </button>
          )}
        </div>
      </div>

      {/* Verification Banner if already signed off */}
      {resolution && resolution.verificationPassed !== null && resolution.verificationPassed !== undefined && (
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            resolution.verificationPassed
              ? "bg-emerald-50/70 border-emerald-200 text-emerald-950"
              : "bg-rose-50/70 border-rose-200 text-rose-950"
          }`}
        >
          {resolution.verificationPassed ? (
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          )}

          <div className="space-y-1 text-xs">
            <div className="font-bold flex items-center gap-2">
              <span>
                {resolution.verificationPassed
                  ? "QA Verification PASSED"
                  : "QA Verification REJECTED"}
              </span>
              {resolution.verifier && (
                <span className="font-normal text-slate-500">
                  by {resolution.verifier.name} on{" "}
                  {resolution.verifiedAt
                    ? new Date(resolution.verifiedAt).toLocaleDateString()
                    : ""}
                </span>
              )}
            </div>
            {resolution.verificationNotes && (
              <p className="text-slate-700">{resolution.verificationNotes}</p>
            )}
          </div>
        </div>
      )}

      {/* QA Verification Form Modal/Drawer */}
      {showVerifyForm && (
        <form
          action={submitVerification}
          className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>QA Verification Sign-off & Audit</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowVerifyForm(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Cancel
            </button>
          </div>

          <input type="hidden" name="issueId" value={issueId} />

          {verifyState?.error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {verifyState.error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-600 mb-1">
              Verification Test Results & Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              name="notes"
              required
              rows={3}
              placeholder="e.g. Verified in staging environment build #482. Ran automated test suite and manual regression test on edge case. All 15 check items passed."
              className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 p-3 bg-white rounded-xl border border-slate-200">
            <input
              type="checkbox"
              id="promoteToKb"
              name="promoteToKb"
              value="true"
              defaultChecked
              className="rounded text-indigo-600 focus:ring-indigo-500"
            />
            <label
              htmlFor="promoteToKb"
              className="text-xs text-slate-700 font-medium cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>
                Promote this verified fix into the Company Technical Knowledge Base
              </span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <VerifyButton passed={false} />
            <VerifyButton passed={true} />
          </div>
        </form>
      )}

      {/* Resolution Details Display or Form */}
      {(!resolution || isEditing) ? (
        <form
          action={submitResolution}
          className="space-y-4 p-5 rounded-2xl bg-emerald-50/20 border border-emerald-100"
        >
          <input type="hidden" name="issueId" value={issueId} />

          {resState?.error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {resState.error}
            </div>
          )}

          <div className="space-y-3">
            {/* Root Cause Analysis */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1">
                Root Cause Analysis (Why did this fail?) <span className="text-rose-500">*</span>
              </label>
              <textarea
                name="rootCause"
                required
                defaultValue={resolution?.rootCause}
                rows={3}
                placeholder="Explain the underlying technical mechanism that created this defect..."
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>

            {/* Permanent Solution & Workaround in 2 cols */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1">
                  Permanent Solution <span className="text-rose-500">*</span>
                </label>
                <textarea
                  name="permanentSolution"
                  required
                  defaultValue={resolution?.permanentSolution}
                  rows={3}
                  placeholder="Describe the permanent code / architectural architectural fix applied..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1">
                  Immediate Workaround (if applicable)
                </label>
                <textarea
                  name="workaround"
                  defaultValue={resolution?.workaround || ""}
                  rows={3}
                  placeholder="Temporary mitigation steps while waiting for full deployment..."
                  className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Files Changed & Database Changes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1 flex items-center gap-1">
                  <GitBranch className="w-3 h-3 text-slate-500" />
                  <span>Files Changed / PR Commits</span>
                </label>
                <textarea
                  name="filesChanged"
                  defaultValue={resolution?.filesChanged || ""}
                  rows={2}
                  placeholder="src/services/pdf-worker.ts&#10;src/utils/browser-pool.ts"
                  className="w-full font-mono text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1 flex items-center gap-1">
                  <Database className="w-3 h-3 text-slate-500" />
                  <span>Database / Migration Changes</span>
                </label>
                <textarea
                  name="databaseChanges"
                  defaultValue={resolution?.databaseChanges || ""}
                  rows={2}
                  placeholder="Added partial index on issues(assignee_id) where status != 'CLOSED'"
                  className="w-full font-mono text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Deployment Steps & Regression Prevention */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1 flex items-center gap-1">
                  <Rocket className="w-3 h-3 text-slate-500" />
                  <span>Deployment / Rollout Steps</span>
                </label>
                <textarea
                  name="deploymentSteps"
                  defaultValue={resolution?.deploymentSteps || ""}
                  rows={2}
                  placeholder="1. Run npx prisma migrate deploy&#10;2. Restart worker daemon pool"
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-slate-500" />
                  <span>Regression Prevention Strategy</span>
                </label>
                <textarea
                  name="regressionPrevention"
                  defaultValue={resolution?.regressionPrevention || ""}
                  rows={2}
                  placeholder="Added e2e test suite simulating 100 concurrent workers with memory leak assertions."
                  className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
                />
              </div>
            </div>

            {/* Verification Checklist */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-tight text-slate-700 mb-1 flex items-center gap-1">
                <BookCheck className="w-3 h-3 text-slate-500" />
                <span>Verification Checklist for QA</span>
              </label>
              <textarea
                name="verificationChecklist"
                defaultValue={resolution?.verificationChecklist || ""}
                rows={2}
                placeholder="[ ] Verify process count terminates after request&#10;[ ] Check memory usage remains below 250MB under load"
                className="w-full text-xs px-3.5 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 bg-white"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            {isEditing && (
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600"
              >
                Cancel
              </button>
            )}
            <SubmitResolutionButton />
          </div>
        </form>
      ) : (
        <div className="space-y-5 text-xs">
          {/* Resolver info */}
          <div className="flex items-center justify-between text-slate-500 text-[11px] pb-2 border-b border-slate-100">
            <span>
              Documented by <strong className="text-slate-800">{resolution.resolver.name}</strong>
              {resolution.resolver.role && ` (${resolution.resolver.role})`}
            </span>
          </div>

          {/* Root Cause & Permanent Solution */}
          <div className="space-y-3">
            <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Root Cause Analysis
              </span>
              <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                {resolution.rootCause}
              </p>
            </div>

            <div className="p-4 bg-emerald-50/40 rounded-xl border border-emerald-200/80 space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                Permanent Solution
              </span>
              <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                {resolution.permanentSolution}
              </p>
            </div>

            {resolution.workaround && (
              <div className="p-4 bg-amber-50/40 rounded-xl border border-amber-200/80 space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
                  Workaround / Temporary Mitigation
                </span>
                <p className="text-slate-800 whitespace-pre-wrap leading-relaxed">
                  {resolution.workaround}
                </p>
              </div>
            )}
          </div>

          {/* Code, Database, and Deployment specifics */}
          {(resolution.filesChanged || resolution.databaseChanges || resolution.deploymentSteps) && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {resolution.filesChanged && (
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 block flex items-center gap-1">
                    <GitBranch className="w-3 h-3" />
                    Files Changed
                  </span>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap overflow-x-auto text-emerald-400">
                    {resolution.filesChanged}
                  </pre>
                </div>
              )}

              {resolution.databaseChanges && (
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block flex items-center gap-1">
                    <Database className="w-3 h-3" />
                    Database Changes
                  </span>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap overflow-x-auto text-amber-300">
                    {resolution.databaseChanges}
                  </pre>
                </div>
              )}

              {resolution.deploymentSteps && (
                <div className="p-3.5 bg-slate-900 text-slate-200 rounded-xl space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400 block flex items-center gap-1">
                    <Rocket className="w-3 h-3" />
                    Deployment Steps
                  </span>
                  <pre className="font-mono text-[11px] whitespace-pre-wrap overflow-x-auto text-sky-300">
                    {resolution.deploymentSteps}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Regression Prevention & QA Checklist */}
          {(resolution.regressionPrevention || resolution.verificationChecklist) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {resolution.regressionPrevention && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                    <ShieldAlert className="w-3 h-3 text-indigo-600" />
                    Regression Prevention
                  </span>
                  <p className="text-slate-800 whitespace-pre-wrap">
                    {resolution.regressionPrevention}
                  </p>
                </div>
              )}

              {resolution.verificationChecklist && (
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block flex items-center gap-1">
                    <BookCheck className="w-3 h-3 text-emerald-600" />
                    QA Verification Checklist
                  </span>
                  <p className="text-slate-800 whitespace-pre-wrap font-mono text-[11px]">
                    {resolution.verificationChecklist}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

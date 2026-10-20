"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateIssueAction } from "@/actions/issues";
import { Priority } from "@/types";
import {
  AlertCircle,
  Loader2,
  Save,
  Terminal,
} from "lucide-react";

interface EditIssueFormProps {
  issue: {
    id: string;
    issueNumber: string;
    title: string;
    description: string;
    priority: string;
    environment: string | null;
    expectedBehavior: string | null;
    actualBehavior: string | null;
    reproSteps: string | null;
    errorMessages: string | null;
    affectedUrl: string | null;
    gitBranch: string | null;
    gitPullRequest: string | null;
    gitCommitSha: string | null;
    assigneeId: string | null;
    version: number;
  };
  teamMembers: { id: string; name: string; role: string }[];
}

export function EditIssueForm({ issue, teamMembers }: EditIssueFormProps) {
  const router = useRouter();

  const [title, setTitle] = useState(issue.title);
  const [description, setDescription] = useState(issue.description);
  const [priority, setPriority] = useState(issue.priority);
  const [environment, setEnvironment] = useState(issue.environment || "Production");
  const [assigneeId, setAssigneeId] = useState(issue.assigneeId || "");
  const [expectedBehavior, setExpectedBehavior] = useState(issue.expectedBehavior || "");
  const [actualBehavior, setActualBehavior] = useState(issue.actualBehavior || "");
  const [reproSteps, setReproSteps] = useState(issue.reproSteps || "");
  const [errorMessages, setErrorMessages] = useState(issue.errorMessages || "");
  const [affectedUrl, setAffectedUrl] = useState(issue.affectedUrl || "");
  const [gitBranch, setGitBranch] = useState(issue.gitBranch || "");
  const [gitPullRequest, setGitPullRequest] = useState(issue.gitPullRequest || "");
  const [gitCommitSha, setGitCommitSha] = useState(issue.gitCommitSha || "");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("id", issue.id);
      formData.set("version", String(issue.version));
      formData.set("title", title);
      formData.set("description", description);
      formData.set("priority", priority);
      formData.set("environment", environment);
      formData.set("assigneeId", assigneeId);
      formData.set("expectedBehavior", expectedBehavior);
      formData.set("actualBehavior", actualBehavior);
      formData.set("reproSteps", reproSteps);
      formData.set("errorMessages", errorMessages);
      formData.set("affectedUrl", affectedUrl);
      formData.set("gitBranch", gitBranch);
      formData.set("gitPullRequest", gitPullRequest);
      formData.set("gitCommitSha", gitCommitSha);

      const res = await updateIssueAction(null, formData);
      if (res?.success) {
        router.push(`/issues/${issue.id}`);
        router.refresh();
      } else {
        setError(res?.error || "Failed to update issue.");
      }
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Update Failed</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Main Parameters */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Issue Title <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Priority
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 font-semibold"
            >
              <option value={Priority.LOW}>Low</option>
              <option value={Priority.MEDIUM}>Medium</option>
              <option value={Priority.HIGH}>High</option>
              <option value={Priority.CRITICAL}>Critical</option>
              <option value={Priority.URGENT}>Urgent (P0)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Environment
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="Production">Production (Live)</option>
              <option value="Staging">Staging / UAT</option>
              <option value="Preview">Preview Deployment</option>
              <option value="CI/CD">CI/CD Pipeline</option>
              <option value="Local">Local Development</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignee
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Diagnostics */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span>Diagnostic Parameters</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Expected Behavior
            </label>
            <textarea
              rows={3}
              value={expectedBehavior}
              onChange={(e) => setExpectedBehavior(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Actual Behavior
            </label>
            <textarea
              rows={3}
              value={actualBehavior}
              onChange={(e) => setActualBehavior(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Steps to Reproduce
          </label>
          <textarea
            rows={3}
            value={reproSteps}
            onChange={(e) => setReproSteps(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Error Messages & Stack Trace
          </label>
          <textarea
            rows={4}
            value={errorMessages}
            onChange={(e) => setErrorMessages(e.target.value)}
            className="w-full px-3 py-2 text-xs font-mono bg-slate-900 text-emerald-400 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Affected URL
            </label>
            <input
              type="text"
              value={affectedUrl}
              onChange={(e) => setAffectedUrl(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Git Branch
            </label>
            <input
              type="text"
              value={gitBranch}
              onChange={(e) => setGitBranch(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Pull Request URL
            </label>
            <input
              type="text"
              value={gitPullRequest}
              onChange={(e) => setGitPullRequest(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Commit SHA
            </label>
            <input
              type="text"
              value={gitCommitSha}
              onChange={(e) => setGitCommitSha(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving Changes...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Save & Update Issue</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}

"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createIssueAction } from "@/actions/issues";
import { findSimilarIssuesAction, SimilarIssueResult } from "@/actions/duplicate";
import { Priority } from "@/types";
import {
  AlertCircle,
  Loader2,
  Send,
  FolderKanban,
  Terminal,
  Sparkles,
  ExternalLink,
  Lightbulb,
  CheckCircle2,
  X,
  HelpCircle,
  ArrowRight,
} from "lucide-react";

interface DepartmentWithCategories {
  id: string;
  name: string;
  code: string;
  categories: { id: string; name: string; code: string }[];
}

interface ProjectOption {
  id: string;
  name: string;
  code: string;
}

interface TeamMemberOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CreateIssueFormProps {
  departments: DepartmentWithCategories[];
  projects: ProjectOption[];
  teamMembers: TeamMemberOption[];
}

export function CreateIssueForm({
  departments,
  projects,
  teamMembers,
}: CreateIssueFormProps) {
  const router = useRouter();

  const [selectedDeptId, setSelectedDeptId] = useState<string>(
    departments[0]?.id || ""
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>(
    projects[0]?.id || ""
  );
  const [priority, setPriority] = useState<string>(Priority.MEDIUM);
  const [environment, setEnvironment] = useState<string>("Production");
  const [assigneeId, setAssigneeId] = useState<string>("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [expectedBehavior, setExpectedBehavior] = useState("");
  const [actualBehavior, setActualBehavior] = useState("");
  const [reproSteps, setReproSteps] = useState("");
  const [errorMessages, setErrorMessages] = useState("");
  const [affectedUrl, setAffectedUrl] = useState("");
  const [gitBranch, setGitBranch] = useState("");
  const [gitPullRequest, setGitPullRequest] = useState("");
  const [gitCommitSha, setGitCommitSha] = useState("");
  const [tags, setTags] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [createdIssue, setCreatedIssue] = useState<{
    id: string;
    issueNumber: string;
  } | null>(null);

  // Duplicate detection state
  const [similarIssues, setSimilarIssues] = useState<SimilarIssueResult[]>([]);
  const [isSearchingDuplicates, setIsSearchingDuplicates] = useState(false);

  // Real-time debounced duplicate detection
  useEffect(() => {
    if (!title || title.trim().length < 3) {
      setSimilarIssues([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingDuplicates(true);
      try {
        const results = await findSimilarIssuesAction(title, selectedProjectId);
        setSimilarIssues(results);
      } catch (err) {
        console.error("Duplicate search error:", err);
      } finally {
        setIsSearchingDuplicates(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [title, selectedProjectId]);

  // Dynamic categories based on chosen department
  const availableCategories = useMemo(() => {
    const dept = departments.find((d) => d.id === selectedDeptId);
    return dept ? dept.categories : [];
  }, [departments, selectedDeptId]);

  // Reset category if not in available list
  const handleDepartmentChange = (deptId: string) => {
    setSelectedDeptId(deptId);
    const dept = departments.find((d) => d.id === deptId);
    if (dept && dept.categories.length > 0) {
      setSelectedCategoryId(dept.categories[0].id);
    } else {
      setSelectedCategoryId("");
    }
  };

  const handleOpenConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim() || title.trim().length < 4) {
      setError("Issue title is required and must be at least 4 characters long.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError("Issue description is required and must be at least 10 characters long.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedProjectId) {
      setError("Please select an engineering project.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (!selectedDeptId) {
      setError("Please select an engineering department.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setShowConfirmModal(true);
  };

  const handleConfirmedSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.set("title", title);
      formData.set("description", description);
      formData.set("projectId", selectedProjectId);
      formData.set("departmentId", selectedDeptId);
      formData.set("categoryId", selectedCategoryId || availableCategories[0]?.id || "");
      formData.set("priority", priority);
      formData.set("environment", environment);
      formData.set("expectedBehavior", expectedBehavior);
      formData.set("actualBehavior", actualBehavior);
      formData.set("reproSteps", reproSteps);
      formData.set("errorMessages", errorMessages);
      formData.set("affectedUrl", affectedUrl);
      formData.set("gitBranch", gitBranch);
      formData.set("gitPullRequest", gitPullRequest);
      formData.set("gitCommitSha", gitCommitSha);
      formData.set("assigneeId", assigneeId);
      formData.set("tags", tags);

      const res = await createIssueAction(null, formData);

      if (res?.success && res.data) {
        setShowConfirmModal(false);
        setCreatedIssue({
          id: res.data.id,
          issueNumber: res.data.issueNumber,
        });
        setTimeout(() => {
          router.push(`/issues/${res.data.id}`);
          router.refresh();
        }, 1600);
      } else {
        setShowConfirmModal(false);
        setError(res?.error || "Failed to submit issue. Please check all required fields.");
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } catch {
      setShowConfirmModal(false);
      setError("An unexpected error occurred while reporting the issue.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const currentDepartment = departments.find((d) => d.id === selectedDeptId);
  const currentCategory = availableCategories.find(
    (c) => c.id === (selectedCategoryId || availableCategories[0]?.id)
  );
  const currentAssignee = teamMembers.find((m) => m.id === assigneeId);

  return (
    <form onSubmit={handleOpenConfirm} className="space-y-6">
      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-700 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Submission Error</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Primary Scope: Project, Department & Category */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-indigo-600" />
          <span>Project & Engineering Scope</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Project */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Project <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  [{p.code}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Department <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedDeptId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          {/* Category (Dynamic based on Department) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Category <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCategoryId || (availableCategories[0]?.id ?? "")}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              {availableCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Issue Details: Title, Description, Priority, Assignee */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-indigo-600" />
          <span>Issue Summary & Priority</span>
        </h2>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span>
              Issue Title / Summary <span className="text-rose-500">*</span>
            </span>
            {isSearchingDuplicates && (
              <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-normal">
                <Loader2 className="w-3 h-3 animate-spin" />
                Scanning existing issues & knowledge base...
              </span>
            )}
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Next.js hydration mismatch on /checkout when cart session refreshes"
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-medium"
          />

          {/* Real-time duplicate & knowledge base suggestion banner */}
          {similarIssues.length > 0 && (
            <div className="mt-3 p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 space-y-2.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Potential Related or Duplicate Issues Found ({similarIssues.length})
                </span>
              </div>
              <p className="text-[11px] text-amber-800">
                A verified solution or active investigation may already exist. Review these before creating a duplicate ticket:
              </p>

              <div className="space-y-2 pt-1">
                {similarIssues.map((sim) => (
                  <div
                    key={sim.id}
                    className="p-2.5 bg-white rounded-lg border border-amber-200/60 text-xs flex flex-col gap-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[10px] text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                          {sim.issueNumber}
                        </span>
                        <span className="font-semibold text-slate-800 truncate max-w-sm">
                          {sim.title}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded font-medium bg-slate-100 text-slate-600">
                          {sim.status}
                        </span>
                      </div>

                      <a
                        href={`/issues/${sim.id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {sim.resolutionSummary && (
                      <div className="text-[11px] text-emerald-800 bg-emerald-50/70 p-2 rounded border border-emerald-100 flex items-start gap-1.5">
                        <Sparkles className="w-3 h-3 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <strong className="text-emerald-900">Verified Fix Available:</strong>{" "}
                          <span className="line-clamp-2">{sim.resolutionSummary}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Detailed Description <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the failure mode, affected users, impact on business operations, and relevant context..."
            className="w-full px-3.5 py-2.5 text-xs text-slate-900 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Priority */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Priority Level <span className="text-rose-500">*</span>
            </label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 font-semibold"
            >
              <option value={Priority.LOW}>Low — Minor cosmetic or non-blocking</option>
              <option value={Priority.MEDIUM}>Medium — Standard defect / work-around exists</option>
              <option value={Priority.HIGH}>High — Degraded user experience / urgent fix</option>
              <option value={Priority.CRITICAL}>Critical — Core flow broken, severe impact</option>
              <option value={Priority.URGENT}>Urgent (P0) — Production outage / security vulnerability</option>
            </select>
          </div>

          {/* Environment */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Environment
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              <option value="Production">Production (Live)</option>
              <option value="Staging">Staging / UAT</option>
              <option value="Preview">Preview Deployment</option>
              <option value="CI/CD">CI/CD Pipeline</option>
              <option value="Local">Local Development</option>
            </select>
          </div>

          {/* Primary Assignee */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Assignee (Optional)
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2 text-xs text-slate-800 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            >
              <option value="">Unassigned (Queue for Triage)</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name} ({m.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Technical Diagnostics Section */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span>Technical Reproduction & Diagnostics</span>
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
              placeholder="What should have happened according to specifications..."
              className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
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
              placeholder="What actually occurred, including UI glitches or unexpected state..."
              className="w-full px-3 py-2 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Step-by-Step Instructions to Reproduce
          </label>
          <textarea
            rows={3}
            value={reproSteps}
            onChange={(e) => setReproSteps(e.target.value)}
            placeholder={"1. Navigate to /checkout\n2. Add item to cart with coupon code DISCOUNT2026\n3. Click Proceed to Payment"}
            className="w-full px-3 py-2 text-xs font-mono text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
            Error Messages, Stack Traces & Console Logs
          </label>
          <textarea
            rows={4}
            value={errorMessages}
            onChange={(e) => setErrorMessages(e.target.value)}
            placeholder="Paste raw error codes, uncaught exceptions, network response payloads, or stack traces..."
            className="w-full px-3 py-2 text-xs font-mono bg-slate-900 text-emerald-400 border border-slate-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
          />
        </div>

        {/* Source control context */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Affected URL
            </label>
            <input
              type="text"
              value={affectedUrl}
              onChange={(e) => setAffectedUrl(e.target.value)}
              placeholder="https://..."
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
              placeholder="feature/checkout-v2"
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 font-mono"
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
              placeholder="https://github.com/.../pull/123"
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 font-mono"
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
              placeholder="e.g. 7a3bf29"
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20 font-mono"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Tags (comma separated)
            </label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="hydration, nextjs, checkout"
              className="w-full px-2.5 py-1.5 text-xs text-slate-800 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
            />
          </div>
        </div>
      </div>

      {/* Form Submission Action Bar */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Generating Issue Record...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Submit & Create Issue</span>
            </>
          )}
        </button>
      </div>

      {/* Confirmation Popup Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="px-6 py-5 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm tracking-tight">Confirm Issue Submission</h3>
                  <p className="text-[11px] text-slate-300">
                    Verify parameters before broadcasting to the active queue.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Summary Overview */}
            <div className="p-6 space-y-4 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">
                  Issue Title
                </span>
                <p className="font-semibold text-slate-900 text-sm mt-0.5">{title}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-600 block">Project</span>
                  <span className="font-semibold text-slate-800">
                    {currentProject?.name} ({currentProject?.code})
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-600 block">Department</span>
                  <span className="font-semibold text-slate-800">
                    {currentDepartment?.name}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-600 block">Category</span>
                  <span className="font-semibold text-slate-800">
                    {currentCategory?.name || "General"}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-600 block">Priority</span>
                  <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-bold text-[10px] uppercase bg-indigo-100 text-indigo-800 border border-indigo-200">
                    {priority}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-600 block">Environment</span>
                  <span className="font-semibold text-slate-800">{environment}</span>
                </div>

                <div>
                  <span className="text-[10px] text-slate-600 block">Assignee</span>
                  <span className="font-semibold text-slate-800">
                    {currentAssignee ? currentAssignee.name : "Unassigned (Open Pool)"}
                  </span>
                </div>
              </div>

              <p className="text-[11px] text-slate-600 leading-relaxed">
                Submitting this issue will assign an immutable sequence ID (e.g.{" "}
                <span className="font-mono font-bold text-indigo-600">ISS-2026-####</span>)
                and initialize the technical diagnostic timeline.
              </p>
            </div>

            {/* Modal Footer Controls */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Back to Editing
              </button>

              <button
                type="button"
                onClick={handleConfirmedSubmit}
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-bold rounded-xl shadow-md shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Creating Issue Record...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Confirm & Submit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Notification Popup Modal */}
      {createdIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 p-6 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Issue Logged Successfully!
              </h3>
              <p className="text-xs text-slate-500">
                Assigned sequential identifier:
              </p>
              <div className="pt-1">
                <span className="font-mono text-base font-extrabold px-3 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {createdIssue.issueNumber}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600">
              Redirecting you to the diagnostic cockpit...
            </p>

            <button
              type="button"
              onClick={() => {
                router.push(`/issues/${createdIssue.id}`);
                router.refresh();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold shadow-md hover:bg-indigo-700 transition-all"
            >
              <span>Open Issue Cockpit Now</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

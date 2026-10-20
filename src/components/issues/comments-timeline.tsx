"use client";

import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { addCommentAction } from "@/actions/comments";
import {
  MessageSquare,
  Lock,
  Send,
  Activity,
} from "lucide-react";

interface CommentItem {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string | Date;
  author: {
    id: string;
    name: string;
    role?: string;
  };
}

interface ActivityLogItem {
  id: string;
  action: string;
  fromValue?: string | null;
  toValue?: string | null;
  comment?: string | null;
  createdAt: string | Date;
  actor: {
    id: string;
    name: string;
    role?: string;
  };
}

interface CommentsTimelineProps {
  issueId: string;
  comments: CommentItem[];
  activityLogs: ActivityLogItem[];
  currentUserRole?: string;
}

function SubmitCommentButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-sm disabled:opacity-50"
    >
      <Send className="w-3.5 h-3.5" />
      <span>{pending ? "Posting..." : "Send Comment"}</span>
    </button>
  );
}

export function CommentsTimeline({
  issueId,
  comments,
  activityLogs,
}: CommentsTimelineProps) {
  const [activeTab, setActiveTab] = useState<"all" | "comments" | "audit">("all");
  const [state, formAction] = useFormState(addCommentAction, null);

  // Combine comments and activity logs into a single sorted chronological stream
  const timelineEvents = [
    ...comments.map((c) => ({
      id: `comment-${c.id}`,
      type: "comment" as const,
      createdAt: new Date(c.createdAt).getTime(),
      dateStr: c.createdAt,
      data: c,
    })),
    ...activityLogs.map((a) => ({
      id: `activity-${a.id}`,
      type: "activity" as const,
      createdAt: new Date(a.createdAt).getTime(),
      dateStr: a.createdAt,
      data: a,
    })),
  ].sort((a, b) => a.createdAt - b.createdAt);

  const filteredEvents = timelineEvents.filter((e) => {
    if (activeTab === "comments") return e.type === "comment";
    if (activeTab === "audit") return e.type === "activity";
    return true;
  });

  return (
    <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-5">
      {/* Tab filter header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Discussion & Activity Stream ({timelineEvents.length})
          </h2>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "all"
                ? "bg-white text-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            All Activity
          </button>
          <button
            onClick={() => setActiveTab("comments")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "comments"
                ? "bg-white text-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Comments ({comments.length})
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === "audit"
                ? "bg-white text-slate-800 shadow-2xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Audit Log ({activityLogs.length})
          </button>
        </div>
      </div>

      {/* Feed list */}
      {filteredEvents.length === 0 ? (
        <div className="p-8 text-center bg-slate-50 rounded-xl text-xs text-slate-500">
          No discussion or audit records recorded yet.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => {
            if (event.type === "comment") {
              const c = event.data as CommentItem;
              return (
                <div
                  key={event.id}
                  className={`p-4 rounded-xl border text-xs space-y-2 transition-shadow ${
                    c.isInternal
                      ? "bg-amber-50/40 border-amber-200/80"
                      : "bg-slate-50/70 border-slate-200/80"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center">
                        {c.author.name.charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-800">
                        {c.author.name}
                      </span>
                      {c.author.role && (
                        <span className="text-[10px] text-slate-400 font-mono">
                          ({c.author.role})
                        </span>
                      )}
                      {c.isInternal && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Internal Team Note</span>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(c.createdAt).toLocaleDateString()} at{" "}
                      {new Date(c.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  <p className="text-slate-800 whitespace-pre-wrap leading-relaxed pl-8">
                    {c.content}
                  </p>
                </div>
              );
            } else {
              const a = event.data as ActivityLogItem;
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-3 pl-2 py-1 text-xs text-slate-600"
                >
                  <div className="mt-0.5 p-1 rounded-full bg-slate-100 border border-slate-200 text-slate-500 shrink-0">
                    <Activity className="w-3 h-3" />
                  </div>

                  <div className="flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                      <strong className="text-slate-800">{a.actor.name}</strong>
                      <span className="font-mono text-indigo-600 font-semibold px-1.5 py-0.2 bg-indigo-50 rounded">
                        {a.action}
                      </span>
                      {a.fromValue && a.toValue && (
                        <span className="text-slate-500 font-mono">
                          {a.fromValue} → <strong>{a.toValue}</strong>
                        </span>
                      )}
                      <span className="text-slate-400 ml-auto font-mono text-[10px]">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {a.comment && (
                      <p className="text-slate-700 text-xs italic pl-1">
                        &ldquo;{a.comment}&rdquo;
                      </p>
                    )}
                  </div>
                </div>
              );
            }
          })}
        </div>
      )}

      {/* New Comment Box */}
      <form
        action={formAction}
        className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3"
      >
        <input type="hidden" name="issueId" value={issueId} />

        {state?.error && (
          <div className="p-2 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {state.error}
          </div>
        )}

        <div>
          <textarea
            name="content"
            required
            rows={2}
            placeholder="Write a comment or investigation note..."
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isInternal"
              name="isInternal"
              value="true"
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            <label
              htmlFor="isInternal"
              className="text-xs text-slate-600 font-medium cursor-pointer flex items-center gap-1"
            >
              <Lock className="w-3 h-3 text-amber-600" />
              <span>Mark as Internal Team Note (Hidden from non-engineering)</span>
            </label>
          </div>

          <SubmitCommentButton />
        </div>
      </form>
    </div>
  );
}

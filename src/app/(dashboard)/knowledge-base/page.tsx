import { requireAuth } from "@/lib/rbac";
import { getKnowledgeBaseAction } from "@/actions/kb";
import { getDepartmentsWithCategoriesAction } from "@/actions/departments";
import { KbBrowser, KbItem } from "@/components/kb/kb-browser";
import { BookOpen } from "lucide-react";

export default async function KnowledgeBasePage() {
  await requireAuth();

  const [{ issues }, departments] = await Promise.all([
    getKnowledgeBaseAction({ pageSize: 50 }),
    getDepartmentsWithCategoriesAction(),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Technical Knowledge Base
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Corporate repository of verified bug resolutions, root cause analyses, and permanent fixes.
              </p>
            </div>
          </div>
        </div>
      </div>

      <KbBrowser
        initialIssues={issues as unknown as KbItem[]}
        departments={departments.map((d) => ({
          id: d.id,
          name: d.name,
          code: d.code,
        }))}
      />
    </div>
  );
}

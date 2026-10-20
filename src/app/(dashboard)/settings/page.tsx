import { requireAuth } from "@/lib/rbac";
import { ShieldAlert, CheckCircle, Database } from "lucide-react";

export default async function SettingsPage() {
  const user = await requireAuth();
  const isAdmin = user.role === "ADMIN";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">System Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Enterprise configuration, audit policies, and department category management.
        </p>
      </div>

      {!isAdmin ? (
        <div className="p-6 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Administrator Access Required</h3>
            <p className="text-xs text-amber-700 mt-1">
              You are signed in as <span className="font-semibold">{user.name}</span> with role{" "}
              <span className="font-semibold">{user.role}</span>. Modifying system categories and global audit policies is restricted to System Administrators.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Administrator Access Granted</span>
            </div>
            <p className="text-xs text-slate-500">
              You have global permissions to manage departments, custom issue categories, and audit retention policies.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
              <Database className="w-4 h-4 text-indigo-600" />
              <span>Database Engine & Environment</span>
            </div>
            <div className="text-xs space-y-1 text-slate-600">
              <div>
                <span className="font-semibold text-slate-700">App Name:</span> TechIssue Hub
              </div>
              <div>
                <span className="font-semibold text-slate-700">Environment:</span> {process.env.NODE_ENV || "development"}
              </div>
              <div>
                <span className="font-semibold text-slate-700">Upload Cap:</span> {process.env.MAX_UPLOAD_SIZE_MB || "25"} MB
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

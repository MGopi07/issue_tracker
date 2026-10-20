import { requireAuth } from "@/lib/rbac";
import { getTeamDirectoryAction } from "@/actions/team";
import {
  Users,
  Building2,
  Tag,
  Mail,
  Shield,
} from "lucide-react";

export default async function TeamPage() {
  await requireAuth();
  const { departments, users } = await getTeamDirectoryAction();

  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          Engineering Directory & Departments
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Specialized technical divisions, categories, and team member assignments.
        </p>
      </div>

      {/* Departments Grid */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Engineering Departments ({departments.length})
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {departments.map((dept) => (
            <div
              key={dept.id}
              className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-3.5 hover:border-slate-300 transition-all"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {dept.code}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900">{dept.name}</h3>
                  </div>
                  {dept.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {dept.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Department Categories */}
              <div className="space-y-1.5 pt-1 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block flex items-center gap-1">
                  <Tag className="w-3 h-3" />
                  Issue Categories ({dept.categories.length})
                </span>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                  {dept.categories.map((c) => (
                    <span
                      key={c.id}
                      className="px-2 py-0.5 rounded-md bg-slate-50 text-slate-700 text-[11px] font-medium border border-slate-200/80"
                    >
                      {c.name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Counts footer */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 font-medium">
                <span>{dept._count.users} Engineers</span>
                <span className="text-indigo-600 font-bold">
                  {dept._count.issues} Issues Tracked
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Members List */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-indigo-600" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Team Members ({users.length})
          </h2>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Engineer</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Departments</th>
                  <th className="pb-3 text-center">Active Issues</th>
                  <th className="pb-3 text-right pr-2">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 pl-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                          {u.name.charAt(0)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block">
                            {u.name}
                          </span>
                          <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Mail className="w-2.5 h-2.5" />
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                        <Shield className="w-3 h-3 text-slate-400" />
                        {u.role.replace("_", " ")}
                      </span>
                    </td>

                    <td className="py-3">
                      <div className="flex flex-wrap gap-1">
                        {u.departments.map((d) => (
                          <span
                            key={d.department.id}
                            className="px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                          >
                            {d.department.code}
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3 text-center">
                      <span className="font-mono font-bold text-slate-800 px-2 py-0.5 rounded-md bg-slate-100">
                        {u._count.assignedIssues}
                      </span>
                    </td>

                    <td className="py-3 text-right pr-2 text-slate-400 font-mono text-[11px]">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

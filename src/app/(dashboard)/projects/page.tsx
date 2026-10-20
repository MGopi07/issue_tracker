import { requireAuth, Permissions } from "@/lib/rbac";
import { getProjectsAction } from "@/actions/projects";
import { getTeamMembersAction } from "@/actions/departments";
import { CreateProjectDialog } from "@/components/projects/create-project-dialog";
import Link from "next/link";
import {
  Users,
  AlertCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";

export default async function ProjectsPage() {
  const user = await requireAuth();

  const [projects, teamMembers] = await Promise.all([
    getProjectsAction(),
    getTeamMembersAction(),
  ]);

  const canCreate = Permissions.canManageProjects(user);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Engineering Projects</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Active repositories, web portals, desktop tools, and infrastructure workspaces.
          </p>
        </div>

        {canCreate && (
          <CreateProjectDialog
            managers={teamMembers.map((m) => ({ id: m.id, name: m.name, email: m.email }))}
          />
        )}
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {projects.map((project) => (
          <div
            key={project.id}
            className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-200 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {project.code}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase bg-slate-100 text-slate-600">
                  {project.projectType}
                </span>
              </div>

              <div>
                <h3 className="font-bold text-sm text-slate-900 line-clamp-1">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                    {project.description}
                  </p>
                )}
              </div>

              {project.projectUrl && (
                <a
                  href={project.projectUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline"
                >
                  <span className="truncate max-w-[200px]">{project.projectUrl}</span>
                  <ExternalLink className="w-3 h-3 shrink-0" />
                </a>
              )}
            </div>

            {/* Bottom Metadata & Stats */}
            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex items-center justify-between text-slate-500">
                <span className="text-[11px]">Project Lead:</span>
                <span className="font-semibold text-slate-800">
                  {project.manager.name}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <AlertCircle className="w-3.5 h-3.5 text-indigo-600" />
                  <span>{project._count.issues} Issues</span>
                </div>

                <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  <span>{project.members.length} Members</span>
                </div>
              </div>

              <div className="pt-1">
                <Link
                  href={`/issues?projectId=${project.id}`}
                  className="w-full flex items-center justify-center gap-1 py-1.5 rounded-lg bg-slate-50 hover:bg-indigo-50 text-slate-700 hover:text-indigo-600 font-semibold text-xs border border-slate-200/60 transition-colors"
                >
                  <span>View Project Issues</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

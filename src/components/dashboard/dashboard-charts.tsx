"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardChartsProps {
  byDepartment: { name: string; code: string; count: number }[];
  byPriority: { priority: string; count: number }[];
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: "#94a3b8", // Slate
  MEDIUM: "#3b82f6", // Blue
  HIGH: "#f59e0b", // Amber
  CRITICAL: "#ef4444", // Red
  URGENT: "#dc2626", // Deep Red
};

export function DashboardCharts({
  byDepartment,
  byPriority,
}: DashboardChartsProps) {
  const deptData = byDepartment.map((d) => ({
    name: d.name.length > 12 ? `${d.name.slice(0, 10)}...` : d.name,
    fullName: d.name,
    code: d.code,
    count: d.count,
  }));

  const priorityData = byPriority.map((p) => ({
    name: p.priority,
    value: p.count,
    color: PRIORITY_COLORS[p.priority] || "#6366f1",
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Department Breakdown Bar Chart */}
      <div className="lg:col-span-2 p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">
              Issues by Engineering Department
            </h2>
            <p className="text-xs text-slate-500">
              Active volume distribution across specialized teams
            </p>
          </div>
        </div>

        <div className="h-64 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "#64748b" }}
                angle={-20}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fontSize: 11, fill: "#64748b" }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-2.5 rounded-xl shadow-lg border border-slate-800">
                        <p className="font-bold">{data.fullName}</p>
                        <p className="text-indigo-300">
                          Total Issues: <strong>{data.count}</strong>
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Priority Distribution Donut */}
      <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 tracking-tight">
            Severity Breakdown
          </h2>
          <p className="text-xs text-slate-500">
            Triage distribution by priority level
          </p>
        </div>

        <div className="h-48 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={priorityData}
                innerRadius={50}
                outerRadius={75}
                paddingAngle={4}
                dataKey="value"
              >
                {priorityData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-slate-900 text-white text-xs p-2 rounded-lg shadow-lg">
                        <span className="font-bold">{data.name}:</span> {data.value}
                      </div>
                    );
                  }
                  return null;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 border-t border-slate-100">
          {priorityData.map((p) => (
            <div key={p.name} className="flex items-center gap-1.5 text-xs text-slate-600">
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: p.color }}
              />
              <span className="text-[11px] font-medium">
                {p.name} ({p.value})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

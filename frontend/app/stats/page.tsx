"use client";

import { useEffect, useState } from "react";
import { Clock, ListChecks, Layers, CheckCircle2, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

function Meter({
  label,
  value,
  max,
  color,
}: {
  label: string;
  value: number;
  max: number;
  color: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-300">{label}</span>
        <span className="font-medium">{value}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  );
}

export default function StatsPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    api.get<DashboardStats>("/api/dashboard/stats").then(setStats).catch(() => {});
  }, []);

  const totalTasks = (stats?.pending_tasks ?? 0) + (stats?.completed_tasks ?? 0);
  const completionRate =
    totalTasks > 0 ? Math.round(((stats?.completed_tasks ?? 0) / totalTasks) * 100) : 0;

  return (
    <AppShell
      title="Estadísticas"
      subtitle="Tu progreso académico de un vistazo"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <div className="card p-5">
            <Clock size={18} className="mb-2 text-brand-500" />
            <p className="text-2xl font-semibold">{stats?.study_hours_total ?? 0}h</p>
            <p className="text-sm text-slate-500">Horas totales estudiadas</p>
          </div>
          <div className="card p-5">
            <TrendingUp size={18} className="mb-2 text-emerald-500" />
            <p className="text-2xl font-semibold">{stats?.study_hours_week ?? 0}h</p>
            <p className="text-sm text-slate-500">Esta semana</p>
          </div>
          <div className="card p-5">
            <ListChecks size={18} className="mb-2 text-amber-500" />
            <p className="text-2xl font-semibold">{stats?.quizzes_completed ?? 0}</p>
            <p className="text-sm text-slate-500">Cuestionarios generados</p>
          </div>
          <div className="card p-5">
            <Layers size={18} className="mb-2 text-pink-500" />
            <p className="text-2xl font-semibold">{stats?.flashcard_decks ?? 0}</p>
            <p className="text-sm text-slate-500">Mazos de flashcards</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-2">
              <CheckCircle2 size={18} className="text-emerald-500" />
              <h3 className="text-base font-semibold">Progreso de tareas</h3>
            </div>
            <div className="mb-4 flex items-center justify-center">
              <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `conic-gradient(#10B981 ${completionRate * 3.6}deg, transparent 0deg)`,
                  }}
                />
                <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-slate-900">
                  <span className="text-xl font-semibold">{completionRate}%</span>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <Meter
                label="Tareas completadas"
                value={stats?.completed_tasks ?? 0}
                max={totalTasks || 1}
                color="#10B981"
              />
              <Meter
                label="Tareas pendientes"
                value={stats?.pending_tasks ?? 0}
                max={totalTasks || 1}
                color="#F59E0B"
              />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-4 text-base font-semibold">Resumen general</h3>
            <div className="space-y-4">
              <Meter
                label="Materias activas"
                value={stats?.total_subjects ?? 0}
                max={Math.max(stats?.total_subjects ?? 1, 6)}
                color="#6366F1"
              />
              <Meter
                label="Horas de estudio esta semana (meta: 10h)"
                value={stats?.study_hours_week ?? 0}
                max={10}
                color="#0EA5E9"
              />
              <Meter
                label="Cuestionarios generados"
                value={stats?.quizzes_completed ?? 0}
                max={Math.max(stats?.quizzes_completed ?? 1, 10)}
                color="#F59E0B"
              />
              <Meter
                label="Mazos de flashcards"
                value={stats?.flashcard_decks ?? 0}
                max={Math.max(stats?.flashcard_decks ?? 1, 10)}
                color="#EC4899"
              />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="mb-4 text-base font-semibold">Actividad reciente</h3>
          {stats?.recent_activity?.length ? (
            <ul className="space-y-3">
              {stats.recent_activity.map((a, idx) => (
                <li key={idx} className="flex items-center gap-3 text-sm">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                  <span className="text-slate-600 dark:text-slate-300">
                    {a.type === "quiz" ? "Cuestionario:" : "Flashcards:"}
                  </span>
                  <span className="font-medium">{a.title}</span>
                  <span className="ml-auto text-xs text-slate-400">
                    {new Date(a.date).toLocaleDateString("es-CO")}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Aún no hay actividad registrada.</p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

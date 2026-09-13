"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  MessageSquare,
  ArrowRight,
  ListChecks,
  Layers,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import type { DashboardStats } from "@/lib/types";

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: any;
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <div className="card p-5">
      <div
        className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${accent}1A`, color: accent }}
      >
        <Icon size={20} />
      </div>
      <p className="text-2xl font-semibold tracking-tight">{value}</p>
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

const QUICK_LINKS = [
  { href: "/chat", label: "Preguntar al tutor IA", icon: MessageSquare },
  { href: "/quiz", label: "Generar un cuestionario", icon: ListChecks },
  { href: "/flashcards", label: "Crear flashcards", icon: Layers },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<DashboardStats>("/api/dashboard/stats")
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell
      title={`Hola, ${user?.full_name?.split(" ")[0] ?? "estudiante"} 👋`}
      subtitle="Este es el resumen de tu actividad académica"
    >
      {loading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard
              icon={BookOpen}
              label="Materias activas"
              value={stats?.total_subjects ?? 0}
              accent="#6366F1"
            />
            <StatCard
              icon={CheckCircle2}
              label="Tareas pendientes"
              value={stats?.pending_tasks ?? 0}
              accent="#F59E0B"
            />
            <StatCard
              icon={Clock}
              label="Horas esta semana"
              value={`${stats?.study_hours_week ?? 0}h`}
              accent="#10B981"
            />
            <StatCard
              icon={Layers}
              label="Mazos de flashcards"
              value={stats?.flashcard_decks ?? 0}
              accent="#EC4899"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Próximas tareas */}
            <div className="card p-6 lg:col-span-2">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold">Próximas tareas</h2>
                <Link
                  href="/planner"
                  className="flex items-center gap-1 text-sm font-medium text-brand-600 hover:underline dark:text-brand-400"
                >
                  Ver planificador <ArrowRight size={14} />
                </Link>
              </div>
              {stats?.upcoming_tasks?.length ? (
                <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stats.upcoming_tasks.map((t) => (
                    <li
                      key={t.id}
                      className="flex items-center justify-between py-3"
                    >
                      <div>
                        <p className="text-sm font-medium">{t.title}</p>
                        {t.due_date && (
                          <p className="text-xs text-slate-400">
                            Entrega:{" "}
                            {new Date(t.due_date).toLocaleDateString("es-CO", {
                              day: "2-digit",
                              month: "short",
                            })}
                          </p>
                        )}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          t.priority === "high"
                            ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                            : t.priority === "medium"
                            ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {t.priority === "high"
                          ? "Alta"
                          : t.priority === "medium"
                          ? "Media"
                          : "Baja"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="py-6 text-center text-sm text-slate-400">
                  No tienes tareas próximas. ¡Vas al día!
                </p>
              )}
            </div>

            {/* Acceso rápido */}
            <div className="card p-6">
              <h2 className="mb-4 text-base font-semibold">Acceso rápido</h2>
              <div className="space-y-2">
                {QUICK_LINKS.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="flex items-center gap-3 rounded-xl border border-slate-100 px-3 py-3 text-sm font-medium transition-colors hover:border-brand-200 hover:bg-brand-50 dark:border-slate-800 dark:hover:border-brand-500/30 dark:hover:bg-brand-500/10"
                  >
                    <l.icon size={18} className="text-brand-600 dark:text-brand-400" />
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Actividad reciente */}
          <div className="card p-6">
            <h2 className="mb-4 text-base font-semibold">Actividad reciente</h2>
            {stats?.recent_activity?.length ? (
              <ul className="space-y-3">
                {stats.recent_activity.map((a, idx) => (
                  <li key={idx} className="flex items-center gap-3 text-sm">
                    <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                    <span className="text-slate-600 dark:text-slate-300">
                      {a.type === "quiz"
                        ? "Cuestionario generado:"
                        : "Mazo de flashcards creado:"}
                    </span>
                    <span className="font-medium">{a.title}</span>
                    <span className="ml-auto text-xs text-slate-400">
                      {new Date(a.date).toLocaleDateString("es-CO")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-4 text-center text-sm text-slate-400">
                Aún no hay actividad. Empieza generando un cuestionario o unas
                flashcards.
              </p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

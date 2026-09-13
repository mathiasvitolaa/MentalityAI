"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Trash2,
  CalendarDays,
  BookOpen,
  Clock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api } from "@/lib/api";
import type { Subject, Task, StudySession } from "@/lib/types";
import { clsx } from "clsx";

const PRIORITY_LABEL: Record<string, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
};

const SUBJECT_COLORS = ["#6366F1", "#EC4899", "#10B981", "#F59E0B", "#0EA5E9", "#8B5CF6"];

export default function PlannerPage() {
  const [tab, setTab] = useState<"tasks" | "subjects" | "sessions">("tasks");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [sessions, setSessions] = useState<StudySession[]>([]);

  // formularios
  const [subjectName, setSubjectName] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskSubject, setTaskSubject] = useState("");
  const [taskDue, setTaskDue] = useState("");
  const [taskPriority, setTaskPriority] = useState("medium");
  const [sessionTitle, setSessionTitle] = useState("");
  const [sessionSubject, setSessionSubject] = useState("");
  const [sessionDate, setSessionDate] = useState("");
  const [sessionDuration, setSessionDuration] = useState(60);

  const loadAll = () => {
    api.get<Subject[]>("/api/planner/subjects").then(setSubjects).catch(() => {});
    api.get<Task[]>("/api/planner/tasks").then(setTasks).catch(() => {});
    api
      .get<StudySession[]>("/api/planner/sessions")
      .then(setSessions)
      .catch(() => {});
  };

  useEffect(() => {
    loadAll();
  }, []);

  function subjectColor(id?: string | null) {
    const idx = subjects.findIndex((s) => s.id === id);
    return subjects[idx]?.color ?? "#94A3B8";
  }

  async function addSubject(e: React.FormEvent) {
    e.preventDefault();
    if (!subjectName.trim()) return;
    const color = SUBJECT_COLORS[subjects.length % SUBJECT_COLORS.length];
    await api.post("/api/planner/subjects", { name: subjectName, color });
    setSubjectName("");
    loadAll();
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await api.post("/api/planner/tasks", {
      title: taskTitle,
      subject_id: taskSubject || null,
      due_date: taskDue ? new Date(taskDue).toISOString() : null,
      priority: taskPriority,
    });
    setTaskTitle("");
    setTaskDue("");
    loadAll();
  }

  async function toggleTask(task: Task) {
    const nextStatus = task.status === "completed" ? "pending" : "completed";
    await api.patch(`/api/planner/tasks/${task.id}`, { status: nextStatus });
    loadAll();
  }

  async function addSession(e: React.FormEvent) {
    e.preventDefault();
    if (!sessionTitle.trim()) return;
    await api.post("/api/planner/sessions", {
      title: sessionTitle,
      subject_id: sessionSubject || null,
      scheduled_at: sessionDate ? new Date(sessionDate).toISOString() : null,
      duration_minutes: sessionDuration,
    });
    setSessionTitle("");
    loadAll();
  }

  async function toggleSession(s: StudySession) {
    await api.patch(`/api/planner/sessions/${s.id}`, { completed: !s.completed });
    loadAll();
  }

  return (
    <AppShell
      title="Planificador académico"
      subtitle="Organiza materias, tareas, entregas y sesiones de estudio"
    >
      <div className="mb-6 flex gap-2">
        {[
          { key: "tasks", label: "Tareas" },
          { key: "sessions", label: "Sesiones de estudio" },
          { key: "subjects", label: "Materias" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as any)}
            className={clsx(
              "rounded-full px-4 py-1.5 text-sm font-medium",
              tab === t.key
                ? "bg-brand-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "tasks" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={addTask} className="card space-y-3 p-6">
            <h3 className="text-sm font-semibold">Nueva tarea</h3>
            <input
              value={taskTitle}
              onChange={(e) => setTaskTitle(e.target.value)}
              placeholder="Título de la tarea"
              className="input-field"
              required
            />
            <select
              value={taskSubject}
              onChange={(e) => setTaskSubject(e.target.value)}
              className="input-field"
            >
              <option value="">Sin materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={taskDue}
              onChange={(e) => setTaskDue(e.target.value)}
              className="input-field"
            />
            <select
              value={taskPriority}
              onChange={(e) => setTaskPriority(e.target.value)}
              className="input-field"
            >
              <option value="low">Prioridad baja</option>
              <option value="medium">Prioridad media</option>
              <option value="high">Prioridad alta</option>
            </select>
            <button type="submit" className="btn-primary w-full">
              <Plus size={16} /> Agregar tarea
            </button>
          </form>

          <div className="card p-6 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">
              Todas las tareas ({tasks.length})
            </h3>
            {tasks.length === 0 ? (
              <p className="text-sm text-slate-400">No tienes tareas aún.</p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {tasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-3 py-3">
                    <button onClick={() => toggleTask(t)}>
                      {t.status === "completed" ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <Circle size={20} className="text-slate-300" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={clsx(
                          "truncate text-sm font-medium",
                          t.status === "completed" && "text-slate-400 line-through"
                        )}
                      >
                        {t.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                        {t.subject_id && (
                          <span
                            className="rounded-full px-2 py-0.5"
                            style={{
                              backgroundColor: `${subjectColor(t.subject_id)}1A`,
                              color: subjectColor(t.subject_id),
                            }}
                          >
                            {subjects.find((s) => s.id === t.subject_id)?.name}
                          </span>
                        )}
                        {t.due_date && (
                          <span>
                            {new Date(t.due_date).toLocaleDateString("es-CO")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={clsx(
                        "shrink-0 rounded-full px-2.5 py-1 text-xs font-medium",
                        t.priority === "high"
                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : t.priority === "medium"
                          ? "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      )}
                    >
                      {PRIORITY_LABEL[t.priority]}
                    </span>
                    <button
                      onClick={async () => {
                        await api.delete(`/api/planner/tasks/${t.id}`);
                        loadAll();
                      }}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "sessions" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={addSession} className="card space-y-3 p-6">
            <h3 className="text-sm font-semibold">Nueva sesión de estudio</h3>
            <input
              value={sessionTitle}
              onChange={(e) => setSessionTitle(e.target.value)}
              placeholder="Ej. Repasar capítulo 5"
              className="input-field"
              required
            />
            <select
              value={sessionSubject}
              onChange={(e) => setSessionSubject(e.target.value)}
              className="input-field"
            >
              <option value="">Sin materia</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <input
              type="datetime-local"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="input-field"
            />
            <div>
              <label className="mb-1 block text-xs text-slate-500">
                Duración (minutos)
              </label>
              <input
                type="number"
                min={15}
                step={15}
                value={sessionDuration}
                onChange={(e) => setSessionDuration(Number(e.target.value))}
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary w-full">
              <Plus size={16} /> Agregar sesión
            </button>
          </form>

          <div className="card p-6 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">
              Sesiones programadas ({sessions.length})
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-slate-400">
                No tienes sesiones de estudio aún.
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {sessions.map((s) => (
                  <li key={s.id} className="flex items-center gap-3 py-3">
                    <button onClick={() => toggleSession(s)}>
                      {s.completed ? (
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      ) : (
                        <Circle size={20} className="text-slate-300" />
                      )}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className={clsx(
                          "truncate text-sm font-medium",
                          s.completed && "text-slate-400 line-through"
                        )}
                      >
                        {s.title}
                      </p>
                      <div className="mt-0.5 flex items-center gap-3 text-xs text-slate-400">
                        {s.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <CalendarDays size={12} />
                            {new Date(s.scheduled_at).toLocaleString("es-CO", {
                              day: "2-digit",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Clock size={12} /> {s.duration_minutes} min
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={async () => {
                        await api.delete(`/api/planner/sessions/${s.id}`);
                        loadAll();
                      }}
                      className="text-slate-300 hover:text-red-500"
                    >
                      <Trash2 size={15} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {tab === "subjects" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <form onSubmit={addSubject} className="card space-y-3 p-6">
            <h3 className="text-sm font-semibold">Nueva materia</h3>
            <input
              value={subjectName}
              onChange={(e) => setSubjectName(e.target.value)}
              placeholder="Ej. Gestión de Mercadeo"
              className="input-field"
              required
            />
            <button type="submit" className="btn-primary w-full">
              <Plus size={16} /> Agregar materia
            </button>
          </form>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:col-span-2">
            {subjects.map((s) => (
              <div key={s.id} className="card flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${s.color}1A`, color: s.color }}
                  >
                    <BookOpen size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-xs text-slate-400">
                      {s.professor || "Sin profesor asignado"} · {s.credits} créditos
                    </p>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    await api.delete(`/api/planner/subjects/${s.id}`);
                    loadAll();
                  }}
                  className="text-slate-300 hover:text-red-500"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
            {subjects.length === 0 && (
              <p className="text-sm text-slate-400">No has agregado materias aún.</p>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}

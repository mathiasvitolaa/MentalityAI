"use client";

import { useEffect, useState } from "react";
import { ListChecks, Loader2, Sparkles, Trash2, CheckCircle2, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import type { Quiz } from "@/lib/types";
import { clsx } from "clsx";

const DIFFICULTIES = [
  { value: "easy", label: "Fácil" },
  { value: "medium", label: "Media" },
  { value: "hard", label: "Difícil" },
];

export default function QuizPage() {
  const [title, setTitle] = useState("");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState("medium");
  const [numMcq, setNumMcq] = useState(5);
  const [numOpen, setNumOpen] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [history, setHistory] = useState<Quiz[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  const loadHistory = () => {
    api.get<Quiz[]>("/api/quiz").then(setHistory).catch(() => {});
  };

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setQuiz(null);
    setAnswers({});
    setRevealed({});
    try {
      const q = await api.post<Quiz>("/api/quiz/generate", {
        title: title || "Cuestionario sin título",
        topic_or_text: topic,
        difficulty,
        num_mcq: numMcq,
        num_open: numOpen,
      });
      setQuiz(q);
      loadHistory();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al generar el cuestionario");
    } finally {
      setLoading(false);
    }
  }

  async function removeQuiz(id: string) {
    await api.delete(`/api/quiz/${id}`);
    if (quiz?.id === id) setQuiz(null);
    loadHistory();
  }

  function reveal(qId: string) {
    setRevealed((r) => ({ ...r, [qId]: true }));
  }

  return (
    <AppShell
      title="Generador de cuestionarios"
      subtitle="Crea preguntas de opción múltiple y abiertas a partir de un tema o texto"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-4 p-6 lg:col-span-1">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Título</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Ej. Quiz de Cálculo - Derivadas"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Tema o texto de referencia
              </label>
              <textarea
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                rows={6}
                className="input-field resize-none"
                placeholder="Ej. Reglas de derivación, regla de la cadena, derivadas de funciones trigonométricas..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Dificultad</label>
              <div className="flex gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => setDifficulty(d.value)}
                    className={clsx(
                      "flex-1 rounded-lg px-3 py-2 text-xs font-medium",
                      difficulty === d.value
                        ? "bg-brand-600 text-white"
                        : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Opción múltiple
                </label>
                <input
                  type="number"
                  min={0}
                  max={15}
                  value={numMcq}
                  onChange={(e) => setNumMcq(Number(e.target.value))}
                  className="input-field"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Preguntas abiertas
                </label>
                <input
                  type="number"
                  min={0}
                  max={10}
                  value={numOpen}
                  onChange={(e) => setNumOpen(Number(e.target.value))}
                  className="input-field"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generar cuestionario
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="mb-2 text-sm font-semibold">Cuestionarios anteriores</h3>
            {history.length === 0 ? (
              <p className="text-xs text-slate-400">No hay cuestionarios aún.</p>
            ) : (
              <ul className="space-y-1.5">
                {history.map((q) => (
                  <li
                    key={q.id}
                    className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <button
                      onClick={() => {
                        setQuiz(q);
                        setAnswers({});
                        setRevealed({});
                      }}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <ListChecks size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">{q.title}</span>
                    </button>
                    <button
                      onClick={() => removeQuiz(q.id)}
                      className="hidden text-slate-400 hover:text-red-500 group-hover:block"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Preview del cuestionario */}
        <div className="lg:col-span-2">
          {!quiz ? (
            <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-10 text-center">
              <ListChecks size={28} className="mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">
                Genera un cuestionario para verlo aquí
              </p>
            </div>
          ) : (
            <div className="card animate-fade-in space-y-6 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{quiz.title}</h3>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium capitalize text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                  Dificultad: {quiz.difficulty}
                </span>
              </div>

              {quiz.questions.map((q, idx) => {
                const isRevealed = revealed[q.id];
                const selected = answers[q.id];
                return (
                  <div
                    key={q.id}
                    className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"
                  >
                    <p className="mb-3 text-sm font-medium">
                      {idx + 1}. {q.question_text}
                    </p>

                    {q.question_type === "mcq" ? (
                      <div className="space-y-2">
                        {q.options.map((opt) => {
                          const isCorrect = opt === q.correct_answer;
                          const isSelected = selected === opt;
                          return (
                            <button
                              key={opt}
                              onClick={() => {
                                setAnswers((a) => ({ ...a, [q.id]: opt }));
                                reveal(q.id);
                              }}
                              className={clsx(
                                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                                !isRevealed &&
                                  "border-slate-200 hover:border-brand-300 dark:border-slate-700",
                                isRevealed &&
                                  isCorrect &&
                                  "border-emerald-400 bg-emerald-50 dark:bg-emerald-500/10",
                                isRevealed &&
                                  isSelected &&
                                  !isCorrect &&
                                  "border-red-300 bg-red-50 dark:bg-red-500/10"
                              )}
                            >
                              {opt}
                              {isRevealed && isCorrect && (
                                <CheckCircle2 size={16} className="text-emerald-500" />
                              )}
                              {isRevealed && isSelected && !isCorrect && (
                                <XCircle size={16} className="text-red-500" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <textarea
                          className="input-field resize-none"
                          rows={3}
                          placeholder="Escribe tu respuesta..."
                          onChange={(e) =>
                            setAnswers((a) => ({ ...a, [q.id]: e.target.value }))
                          }
                        />
                        {!isRevealed && (
                          <button
                            onClick={() => reveal(q.id)}
                            className="btn-secondary mt-2 text-xs"
                          >
                            Ver respuesta modelo
                          </button>
                        )}
                        {isRevealed && (
                          <div className="mt-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm dark:bg-emerald-500/10">
                            <strong>Respuesta esperada:</strong> {q.correct_answer}
                          </div>
                        )}
                      </div>
                    )}

                    {isRevealed && q.explanation && (
                      <p className="mt-2.5 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                        <strong>¿Por qué?</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

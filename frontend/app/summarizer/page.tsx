"use client";

import { useEffect, useState } from "react";
import { FileText, Upload, Loader2, Sparkles, Trash2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import type { DocumentSummary } from "@/lib/types";

export default function SummarizerPage() {
  const [tab, setTab] = useState<"text" | "file">("text");
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentSummary | null>(null);
  const [history, setHistory] = useState<DocumentSummary[]>([]);

  const loadHistory = () => {
    api.get<DocumentSummary[]>("/api/documents").then(setHistory).catch(() => {});
  };

  useEffect(() => {
    loadHistory();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      let doc: DocumentSummary;
      if (tab === "text") {
        doc = await api.post<DocumentSummary>("/api/documents/summarize-text", {
          title: title || "Documento sin título",
          text,
        });
      } else {
        if (!file) throw new Error("Selecciona un archivo primero");
        const form = new FormData();
        form.append("file", file);
        doc = await api.postForm<DocumentSummary>(
          "/api/documents/summarize-file",
          form
        );
      }
      setResult(doc);
      loadHistory();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : (err as Error).message
      );
    } finally {
      setLoading(false);
    }
  }

  async function removeDoc(id: string) {
    await api.delete(`/api/documents/${id}`);
    if (result?.id === id) setResult(null);
    loadHistory();
  }

  return (
    <AppShell
      title="Resumen de documentos"
      subtitle="Sube un PDF, un documento o pega texto para obtener un resumen con IA"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card p-6 lg:col-span-2">
          <div className="mb-4 flex gap-2">
            <button
              onClick={() => setTab("text")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === "text"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Pegar texto
            </button>
            <button
              onClick={() => setTab("file")}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                tab === "file"
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              }`}
            >
              Subir archivo (PDF / TXT)
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Título
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Ej. Apuntes de Marketing - Capítulo 3"
              />
            </div>

            {tab === "text" ? (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Texto a resumir
                </label>
                <textarea
                  required
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  rows={10}
                  className="input-field resize-none"
                  placeholder="Pega aquí tus apuntes, un artículo o cualquier texto académico..."
                />
              </div>
            ) : (
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Archivo (.pdf o .txt)
                </label>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center hover:border-brand-400 dark:border-slate-700">
                  <Upload size={22} className="text-slate-400" />
                  <span className="text-sm text-slate-500">
                    {file ? file.name : "Haz clic para seleccionar un archivo"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
              </div>
            )}

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              Generar resumen con IA
            </button>
          </form>

          {result && (
            <div className="mt-8 animate-fade-in space-y-4 border-t border-slate-100 pt-6 dark:border-slate-800">
              <h3 className="text-base font-semibold">{result.title}</h3>
              <div>
                <p className="mb-1 text-sm font-medium text-slate-500">
                  Resumen
                </p>
                <p className="whitespace-pre-wrap text-sm leading-relaxed">
                  {result.summary}
                </p>
              </div>
              {result.key_points?.length > 0 && (
                <div>
                  <p className="mb-1.5 text-sm font-medium text-slate-500">
                    Puntos clave y conceptos importantes
                  </p>
                  <ul className="space-y-1.5">
                    {result.key_points.map((p, i) => (
                      <li key={i} className="flex gap-2 text-sm">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Historial */}
        <div className="card p-6">
          <h3 className="mb-4 text-base font-semibold">Documentos recientes</h3>
          {history.length === 0 ? (
            <p className="text-sm text-slate-400">Aún no has resumido nada.</p>
          ) : (
            <ul className="space-y-2">
              {history.map((d) => (
                <li
                  key={d.id}
                  className="group flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2.5 text-sm dark:border-slate-800"
                >
                  <button
                    onClick={() => setResult(d)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left"
                  >
                    <FileText size={15} className="shrink-0 text-slate-400" />
                    <span className="truncate">{d.title}</span>
                  </button>
                  <button
                    onClick={() => removeDoc(d.id)}
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
    </AppShell>
  );
}

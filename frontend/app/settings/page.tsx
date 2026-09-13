"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor, Save, CheckCircle2, Check } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api";
import { clsx } from "clsx";
import { ACCENT_OPTIONS, useAccent } from "@/lib/accent-context";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { theme, setTheme } = useTheme();
  const { accent, setAccent } = useAccent();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [career, setCareer] = useState(user?.career ?? "");
  const [university, setUniversity] = useState(user?.university ?? "");
  const [saved, setSaved] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user) {
      setFullName(user.full_name);
      setCareer(user.career ?? "");
      setUniversity(user.university ?? "");
    }
  }, [user]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    await api.patch("/api/auth/me", {
      full_name: fullName,
      career,
      university,
    });
    await refreshUser();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <AppShell title="Configuración" subtitle="Personaliza tu cuenta y tu experiencia">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="mb-4 text-base font-semibold">Perfil</h3>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Nombre completo
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Correo</label>
              <input value={user?.email ?? ""} disabled className="input-field opacity-60" />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Carrera</label>
              <input
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                className="input-field"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Universidad
              </label>
              <input
                value={university}
                onChange={(e) => setUniversity(e.target.value)}
                className="input-field"
              />
            </div>
            <button type="submit" className="btn-primary">
              {saved ? <CheckCircle2 size={16} /> : <Save size={16} />}
              {saved ? "Guardado" : "Guardar cambios"}
            </button>
          </form>
        </div>

        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 text-base font-semibold">Apariencia</h3>
            <p className="mb-3 text-sm text-slate-500">
              Elige cómo se ve Mentality en tu dispositivo.
            </p>
            {mounted && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: "light", label: "Claro", icon: Sun },
                  { value: "dark", label: "Oscuro", icon: Moon },
                  { value: "system", label: "Sistema", icon: Monitor },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setTheme(opt.value)}
                    className={clsx(
                      "flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-sm transition-colors",
                      theme === opt.value
                        ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 dark:border-slate-700"
                    )}
                  >
                    <opt.icon size={18} />
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="card p-6">
            <h3 className="mb-1 text-base font-semibold">Color principal</h3>
            <p className="mb-4 text-sm text-slate-500">
              Elige el color de acento de botones, enlaces y elementos
              destacados.
            </p>
            <div className="flex flex-wrap gap-3">
              {ACCENT_OPTIONS.map((color) => {
                const selected = accent === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setAccent(color)}
                    aria-label={`Usar color ${color}`}
                    aria-pressed={selected}
                    className={clsx(
                      "flex h-11 w-11 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
                      selected
                        ? "border-slate-900 dark:border-white"
                        : "border-transparent"
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selected && (
                      <Check
                        size={18}
                        strokeWidth={3}
                        className="text-slate-900/70"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="mb-2 text-base font-semibold">Sobre Mentality</h3>
            <p className="text-sm leading-relaxed text-slate-500">
              Mentality es un prototipo funcional desarrollado como proyecto
              académico para la materia de Gestión de Mercadeo (fase de
              concepto y prototipado de producto). Utiliza la API de Google
              Gemini de forma real a través de un backend en FastAPI —
              la clave de API nunca se expone en el navegador.
            </p>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

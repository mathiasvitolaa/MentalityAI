"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function RegisterPage() {
  const { register } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [career, setCareer] = useState("");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await register({
        full_name: fullName,
        email,
        password,
        career: career || undefined,
        university: university || undefined,
      });
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo crear la cuenta"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-10 dark:bg-slate-950">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={22} />
          </div>
          <h1 className="text-xl font-semibold">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Empieza a estudiar de forma más inteligente
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Nombre completo
            </label>
            <input
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
              placeholder="Ana Pérez"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="tucorreo@universidad.edu"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">
              Contraseña
            </label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Carrera
              </label>
              <input
                value={career}
                onChange={(e) => setCareer(e.target.value)}
                className="input-field"
                placeholder="Opcional"
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
                placeholder="Opcional"
              />
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Crear cuenta
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          ¿Ya tienes cuenta?{" "}
          <Link
            href="/login"
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Inicia sesión
          </Link>
        </p>
        <p className="mt-3 text-center text-xs">
          <Link href="/" className="text-slate-400 hover:underline">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}

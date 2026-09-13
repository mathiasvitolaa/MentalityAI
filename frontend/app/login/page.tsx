"use client";

import { useState } from "react";
import Link from "next/link";
import { GraduationCap, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ApiError } from "@/lib/api";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("demo@mentality.com");
  const [password, setPassword] = useState("demo1234");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "No se pudo iniciar sesión"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <GraduationCap size={22} />
          </div>
          <h1 className="text-xl font-semibold">Bienvenido de vuelta</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inicia sesión en tu cuenta de Mentality
          </p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4 p-6">
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading && <Loader2 size={16} className="animate-spin" />}
            Iniciar sesión
          </button>

          <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
            Cuenta de prueba precargada: <strong>demo@mentality.com</strong> /{" "}
            <strong>demo1234</strong> (ejecuta{" "}
            <code>python seed.py</code> en el backend)
          </p>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          ¿No tienes cuenta?{" "}
          <Link
            href="/register"
            className="font-medium text-brand-600 hover:underline dark:text-brand-400"
          >
            Regístrate
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

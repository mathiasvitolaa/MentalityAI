import Link from "next/link";
import {
  GraduationCap,
  MessageSquare,
  FileText,
  ListChecks,
  Layers,
  CalendarDays,
  BarChart3,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Tutor con IA",
    desc: "Chatea con un tutor impulsado por Gemini que explica, ejemplifica y resuelve tus dudas de cualquier materia.",
  },
  {
    icon: FileText,
    title: "Resumen de documentos",
    desc: "Sube PDFs, documentos o pega texto y obtén resúmenes, conceptos clave y puntos importantes al instante.",
  },
  {
    icon: ListChecks,
    title: "Generador de cuestionarios",
    desc: "Crea quizzes de opción múltiple y preguntas abiertas a partir de tus apuntes, con explicaciones incluidas.",
  },
  {
    icon: Layers,
    title: "Flashcards automáticas",
    desc: "Convierte tus apuntes en tarjetas de estudio listas para repasar antes de cualquier examen.",
  },
  {
    icon: CalendarDays,
    title: "Planificador académico",
    desc: "Organiza materias, tareas, fechas de entrega y sesiones de estudio en un solo lugar.",
  },
  {
    icon: BarChart3,
    title: "Estadísticas de estudio",
    desc: "Visualiza tu progreso, horas estudiadas y actividad reciente para mantenerte motivado.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950">
      {/* Navbar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur dark:border-slate-800/80 dark:bg-slate-950/80">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap size={18} />
            </div>
            <span className="text-lg font-semibold tracking-tight">
              Mentality
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white sm:block"
            >
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-primary">
              Empezar gratis
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pt-28">
        <div className="mb-5 inline-flex animate-fade-in items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-3.5 py-1.5 text-xs font-medium text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
          <Sparkles size={14} />
          Impulsado realmente por Google Gemini
        </div>
        <h1 className="animate-fade-in text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
          Tu asistente de IA para
          <span className="block text-brand-600 dark:text-brand-400">
            estudiar mejor, no más duro
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl animate-fade-in text-lg text-slate-600 dark:text-slate-400">
          Mentality ayuda a estudiantes universitarios a comprender sus materias,
          resumir documentos, generar cuestionarios, crear flashcards y
          organizar su tiempo — todo en un solo lugar.
        </p>
        <div className="mt-10 flex animate-fade-in flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Crear cuenta gratis
            <ArrowRight size={18} />
          </Link>
          <Link
            href="/login"
            className="btn-secondary px-6 py-3 text-base"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Todo lo que necesitas para tu semestre
          </h2>
          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Seis herramientas pensadas específicamente para estudiantes
            universitarios.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="card animate-fade-in p-6"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                <f.icon size={22} />
              </div>
              <h3 className="mb-1.5 text-base font-semibold">{f.title}</h3>
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-4xl px-6 pb-24">
        <div className="card flex flex-col items-center gap-6 bg-gradient-to-br from-brand-600 to-brand-700 p-10 text-center text-white sm:p-14">
          <h2 className="text-2xl font-bold sm:text-3xl">
            Empieza a estudiar de forma más inteligente hoy
          </h2>
          <p className="max-w-xl text-brand-100">
            Prototipo académico construido para la materia de Gestión de
            Mercadeo — fase de concepto y prototipado de producto.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-brand-700 transition-colors hover:bg-brand-50"
          >
            Crear mi cuenta
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 py-8 text-center text-sm text-slate-400 dark:border-slate-800">
        Mentality — Prototipo funcional de producto académico · {new Date().getFullYear()}
      </footer>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Layers, Loader2, Sparkles, Trash2, ChevronLeft, ChevronRight, RotateCw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError } from "@/lib/api";
import type { FlashcardDeck } from "@/lib/types";
import { clsx } from "clsx";

export default function FlashcardsPage() {
  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [numCards, setNumCards] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [decks, setDecks] = useState<FlashcardDeck[]>([]);
  const [activeDeck, setActiveDeck] = useState<FlashcardDeck | null>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const loadDecks = () => {
    api.get<FlashcardDeck[]>("/api/flashcards").then(setDecks).catch(() => {});
  };

  useEffect(() => {
    loadDecks();
  }, []);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const deck = await api.post<FlashcardDeck>("/api/flashcards/generate", {
        title: title || "Mazo sin título",
        text,
        num_cards: numCards,
      });
      setDecks((d) => [deck, ...d]);
      setActiveDeck(deck);
      setCardIndex(0);
      setFlipped(false);
      setText("");
      setTitle("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Error al generar flashcards");
    } finally {
      setLoading(false);
    }
  }

  async function removeDeck(id: string) {
    await api.delete(`/api/flashcards/${id}`);
    if (activeDeck?.id === id) setActiveDeck(null);
    loadDecks();
  }

  function openDeck(deck: FlashcardDeck) {
    setActiveDeck(deck);
    setCardIndex(0);
    setFlipped(false);
  }

  const card = activeDeck?.cards[cardIndex];

  return (
    <AppShell
      title="Flashcards"
      subtitle="Convierte tus apuntes en tarjetas de estudio con IA"
    >
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="card space-y-4 p-6">
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Título del mazo
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="Ej. Vocabulario de Bases de Datos"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Apuntes o texto base
              </label>
              <textarea
                required
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={8}
                className="input-field resize-none"
                placeholder="Pega tus apuntes o conceptos que quieras convertir en flashcards..."
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                Número de tarjetas
              </label>
              <input
                type="number"
                min={4}
                max={30}
                value={numCards}
                onChange={(e) => setNumCards(Number(e.target.value))}
                className="input-field"
              />
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              Generar flashcards
            </button>
          </form>

          <div className="border-t border-slate-100 pt-4 dark:border-slate-800">
            <h3 className="mb-2 text-sm font-semibold">Mis mazos</h3>
            {decks.length === 0 ? (
              <p className="text-xs text-slate-400">Aún no tienes mazos.</p>
            ) : (
              <ul className="space-y-1.5">
                {decks.map((d) => (
                  <li
                    key={d.id}
                    className="group flex items-center justify-between rounded-lg px-2.5 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                  >
                    <button
                      onClick={() => openDeck(d)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <Layers size={14} className="shrink-0 text-slate-400" />
                      <span className="truncate">{d.title}</span>
                      <span className="ml-auto shrink-0 text-xs text-slate-400">
                        {d.cards.length}
                      </span>
                    </button>
                    <button
                      onClick={() => removeDeck(d.id)}
                      className="ml-2 hidden text-slate-400 hover:text-red-500 group-hover:block"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Visor de flashcards */}
        <div className="lg:col-span-2">
          {!activeDeck || !card ? (
            <div className="card flex h-full min-h-[300px] flex-col items-center justify-center p-10 text-center">
              <Layers size={28} className="mb-3 text-slate-300" />
              <p className="text-sm text-slate-400">
                Genera o selecciona un mazo para empezar a repasar
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <p className="mb-3 text-sm text-slate-500">
                {activeDeck.title} — Tarjeta {cardIndex + 1} de{" "}
                {activeDeck.cards.length}
              </p>
              <div
                onClick={() => setFlipped((f) => !f)}
                className={clsx(
                  "card flex h-72 w-full max-w-lg cursor-pointer select-none flex-col items-center justify-center p-8 text-center transition-all",
                  "hover:shadow-lg"
                )}
                style={{ perspective: "1000px" }}
              >
                <span className="mb-3 text-xs font-medium uppercase tracking-wide text-brand-500">
                  {flipped ? "Respuesta" : "Pregunta"}
                </span>
                <p className="text-lg font-medium leading-relaxed">
                  {flipped ? card.back : card.front}
                </p>
                <span className="mt-4 flex items-center gap-1 text-xs text-slate-400">
                  <RotateCw size={12} /> Clic para voltear
                </span>
              </div>

              <div className="mt-5 flex items-center gap-4">
                <button
                  onClick={() => {
                    setCardIndex((i) => Math.max(0, i - 1));
                    setFlipped(false);
                  }}
                  disabled={cardIndex === 0}
                  className="btn-secondary"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm text-slate-500">
                  {cardIndex + 1} / {activeDeck.cards.length}
                </span>
                <button
                  onClick={() => {
                    setCardIndex((i) =>
                      Math.min(activeDeck.cards.length - 1, i + 1)
                    );
                    setFlipped(false);
                  }}
                  disabled={cardIndex === activeDeck.cards.length - 1}
                  className="btn-secondary"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}

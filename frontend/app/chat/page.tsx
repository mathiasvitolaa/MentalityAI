"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, Plus, Trash2, Bot, User as UserIcon } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { MarkdownContent } from "@/components/MarkdownContent";
import { api, ApiError } from "@/lib/api";
import type { ChatMessage, Conversation } from "@/lib/types";
import { clsx } from "clsx";

const MODES = [
  { value: "tutor", label: "Tutor" },
  { value: "simple", label: "Explicación simple" },
  { value: "avanzado", label: "Nivel avanzado" },
];

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [mode, setMode] = useState("tutor");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = () => {
    api
      .get<Conversation[]>("/api/chat/conversations")
      .then(setConversations)
      .catch(() => {});
  };

  useEffect(() => {
    loadConversations();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function openConversation(id: string) {
    setActiveId(id);
    const convo = await api.get<Conversation>(`/api/chat/conversations/${id}`);
    setMessages(convo.messages);
    setMode(convo.mode);
  }

  function newConversation() {
    setActiveId(null);
    setMessages([]);
    setError(null);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setError(null);

    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: "user",
      content: input,
      created_at: new Date().toISOString(),
    };
    setMessages((m) => [...m, userMessage]);
    const messageText = input;
    setInput("");
    setSending(true);

    try {
      const res = await api.post<{ conversation_id: string; reply: ChatMessage }>(
        "/api/chat/send",
        { conversation_id: activeId, message: messageText, mode }
      );
      setActiveId(res.conversation_id);
      setMessages((m) => [...m, res.reply]);
      loadConversations();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "No se pudo contactar al tutor de IA. Verifica tu conexión y la GEMINI_API_KEY del backend."
      );
    } finally {
      setSending(false);
    }
  }

  async function removeConversation(id: string) {
    await api.delete(`/api/chat/conversations/${id}`);
    if (activeId === id) newConversation();
    loadConversations();
  }

  return (
    <AppShell title="Tutor IA" subtitle="Pregunta lo que quieras, Mentality usa Gemini para responderte">
      <div className="flex h-[calc(100vh-140px)] gap-4">
        {/* Lista de conversaciones */}
        <div className="hidden w-64 shrink-0 flex-col gap-2 md:flex">
          <button onClick={newConversation} className="btn-secondary w-full justify-start gap-2">
            <Plus size={16} /> Nueva conversación
          </button>
          <div className="card flex-1 overflow-y-auto p-2">
            {conversations.length === 0 && (
              <p className="p-3 text-center text-xs text-slate-400">
                Aún no tienes conversaciones
              </p>
            )}
            {conversations.map((c) => (
              <div
                key={c.id}
                className={clsx(
                  "group flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-sm",
                  activeId === c.id
                    ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                    : "hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                onClick={() => openConversation(c.id)}
              >
                <span className="truncate">{c.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeConversation(c.id);
                  }}
                  className="hidden text-slate-400 hover:text-red-500 group-hover:block"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Chat */}
        <div className="card flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <div className="flex gap-2">
              {MODES.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setMode(m.value)}
                  className={clsx(
                    "rounded-full px-3 py-1.5 text-xs font-medium transition-colors",
                    mode === m.value
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-6">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-400">
                  <Bot size={24} />
                </div>
                <p className="text-sm font-medium">¿En qué te puedo ayudar hoy?</p>
                <p className="mt-1 max-w-sm text-xs text-slate-400">
                  Pregunta sobre cualquier materia, pide ejemplos, o dile a Mentality
                  que actúe como tutor para prepararte para un examen.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={clsx(
                      "flex gap-3",
                      m.role === "user" ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    <div
                      className={clsx(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        m.role === "user"
                          ? "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                          : "bg-brand-600 text-white"
                      )}
                    >
                      {m.role === "user" ? <UserIcon size={16} /> : <Bot size={16} />}
                    </div>
                    <div
                      className={clsx(
                        "max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed",
                        m.role === "user"
                          ? "whitespace-pre-wrap bg-brand-600 text-white"
                          : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100"
                      )}
                    >
                      {m.role === "assistant" ? (
                        <MarkdownContent content={m.content} />
                      ) : (
                        m.content
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-600 text-white">
                      <Bot size={16} />
                    </div>
                    <div className="flex items-center gap-1 rounded-2xl bg-slate-100 px-4 py-3 dark:bg-slate-800">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>
            )}
          </div>

          {error && (
            <p className="mx-4 mb-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
              {error}
            </p>
          )}

          <form
            onSubmit={handleSend}
            className="flex items-center gap-2 border-t border-slate-100 p-3 dark:border-slate-800"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta académica..."
              className="input-field"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              className="btn-primary shrink-0"
            >
              {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}

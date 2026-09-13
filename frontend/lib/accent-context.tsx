"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { generateAccentShades } from "@/lib/colors";

/**
 * Colores de acento permitidos para personalizar el color principal de la
 * aplicación. Limitado estrictamente a estos 4 valores por diseño.
 */
export const ACCENT_OPTIONS = [
  "#FA99FF",
  "#99FAFF",
  "#A5FF99",
  "#FF9999",
] as const;

export type AccentColor = (typeof ACCENT_OPTIONS)[number];

export const DEFAULT_ACCENT: AccentColor = "#FA99FF";

const STORAGE_KEY = "mentality_accent";

function isValidAccent(value: string | null): value is AccentColor {
  return !!value && (ACCENT_OPTIONS as readonly string[]).includes(value);
}

function applyAccent(hex: string) {
  const shades = generateAccentShades(hex);
  const root = document.documentElement;
  Object.entries(shades).forEach(([stop, rgb]) => {
    root.style.setProperty(`--brand-${stop}`, rgb);
  });
}

interface AccentContextValue {
  accent: AccentColor;
  setAccent: (hex: AccentColor) => void;
}

const AccentContext = createContext<AccentContextValue | undefined>(
  undefined
);

export function AccentProvider({ children }: { children: React.ReactNode }) {
  const [accent, setAccentState] = useState<AccentColor>(DEFAULT_ACCENT);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const initial = isValidAccent(stored) ? stored : DEFAULT_ACCENT;
    setAccentState(initial);
    applyAccent(initial);
  }, []);

  const setAccent = useCallback((hex: AccentColor) => {
    setAccentState(hex);
    applyAccent(hex);
    window.localStorage.setItem(STORAGE_KEY, hex);
  }, []);

  return (
    <AccentContext.Provider value={{ accent, setAccent }}>
      {children}
    </AccentContext.Provider>
  );
}

export function useAccent() {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error("useAccent debe usarse dentro de <AccentProvider>");
  return ctx;
}

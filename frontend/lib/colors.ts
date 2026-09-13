/**
 * Utilidades para generar una rampa de tonos (50-900, estilo Tailwind) a
 * partir de un único color de acento en hexadecimal.
 *
 * El color exacto que elige el usuario se usa como referencia "500"; los
 * tonos más claros (50-400) se generan mezclando con blanco y los más
 * oscuros (600-900) mezclando con negro, para asegurar suficiente
 * contraste en botones y texto sin perder la identidad del color elegido.
 */

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function mix(c1: RGB, c2: RGB, t: number): RGB {
  return [0, 1, 2].map((i) =>
    Math.round(c1[i] * (1 - t) + c2[i] * t)
  ) as RGB;
}

export const ACCENT_SHADE_STOPS = [
  "50",
  "100",
  "200",
  "300",
  "400",
  "500",
  "600",
  "700",
  "800",
  "900",
] as const;

/**
 * Devuelve un mapa { "50": "r g b", ..., "900": "r g b" } listo para usarse
 * como valor de las variables CSS `--brand-<stop>` (formato que espera
 * Tailwind con la sintaxis `rgb(var(--brand-500) / <alpha-value>)`).
 */
export function generateAccentShades(hex: string): Record<string, string> {
  const base = hexToRgb(hex);
  const white: RGB = [255, 255, 255];
  const black: RGB = [0, 0, 0];
  const toVar = (rgb: RGB) => rgb.join(" ");

  return {
    "50": toVar(mix(base, white, 0.92)),
    "100": toVar(mix(base, white, 0.84)),
    "200": toVar(mix(base, white, 0.68)),
    "300": toVar(mix(base, white, 0.5)),
    "400": toVar(mix(base, white, 0.25)),
    "500": toVar(base),
    "600": toVar(mix(base, black, 0.15)),
    "700": toVar(mix(base, black, 0.32)),
    "800": toVar(mix(base, black, 0.48)),
    "900": toVar(mix(base, black, 0.62)),
  };
}

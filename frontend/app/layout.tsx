import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth-context";
import { AccentProvider } from "@/lib/accent-context";

export const metadata: Metadata = {
  title: "Mentality — Tu asistente académico con IA",
  description:
    "Mentality ayuda a estudiantes universitarios a estudiar, organizarse y comprender mejor sus materias, con inteligencia artificial real (Google Gemini).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <AccentProvider>
            <AuthProvider>{children}</AuthProvider>
          </AccentProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

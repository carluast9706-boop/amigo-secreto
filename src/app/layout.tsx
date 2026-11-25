import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Amigo Secreto — Organiza tu intercambio sin cruces",
  description:
    "Crea sorteos de Amigo Secreto con enlaces privados por participante, sin auto-asignaciones ni parejas cruzadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-stone-50 text-stone-900 font-sans">
        {children}
      </body>
    </html>
  );
}

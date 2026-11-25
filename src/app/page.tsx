import { Gift } from "lucide-react";
import { SorteoCreator } from "@/components/SorteoCreator";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-rose-50/60 via-stone-50 to-stone-100">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
            <Gift className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-stone-900">
              Amigo Secreto
            </h1>
            <p className="text-xs text-stone-500">
              Sorteos privados con enlaces únicos
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight text-stone-900 sm:text-4xl">
            Organiza tu intercambio en segundos
          </h2>
          <p className="mt-2 text-base text-stone-600">
            Crea el sorteo, añade a los participantes y comparte con cada uno su
            enlace secreto. Todo queda guardado de forma segura en Firestore.
          </p>
        </div>

        <SorteoCreator />
      </main>

      <footer className="border-t border-stone-200/70 py-6 text-center text-xs text-stone-500">
        Algoritmo Fisher-Yates en ciclo cerrado único · Sin auto-asignaciones ni
        parejas cruzadas
      </footer>
    </div>
  );
}

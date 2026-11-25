import { Suspense } from "react";
import Link from "next/link";
import { Gift, ArrowLeft } from "lucide-react";
import { SorteoRevealClient } from "@/components/SorteoRevealClient";

interface SorteoPageProps {
  params: Promise<{ id: string }>;
}

async function SorteoContent({ params }: SorteoPageProps) {
  const { id } = await params;
  return <SorteoRevealClient sorteoId={id} />;
}

function SorteoFallback() {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
      <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
      <p className="mt-3 text-sm font-medium text-stone-600">
        Cargando sorteo...
      </p>
    </div>
  );
}

export default function SorteoPage({ params }: SorteoPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-rose-50/60 via-stone-50 to-stone-100">
      <header className="border-b border-stone-200/80 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2.5 text-stone-900 transition-opacity hover:opacity-80"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-600 text-white shadow-sm">
              <Gift className="h-4 w-4" aria-hidden="true" />
            </div>
            <span className="text-base font-bold tracking-tight">
              Amigo Secreto
            </span>
          </Link>

          <Link
            href="/"
            className="inline-flex items-center gap-1 text-xs font-medium text-stone-600 hover:text-stone-900"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            Nuevo sorteo
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <Suspense fallback={<SorteoFallback />}>
          <SorteoContent params={params} />
        </Suspense>
      </main>
    </div>
  );
}

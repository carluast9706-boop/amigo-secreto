"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Gift,
  Lock,
  CheckCircle2,
  Sparkles,
  AlertTriangle,
  ArrowLeft,
  Eye,
} from "lucide-react";
import {
  getMissingFirebaseEnvVars,
  isFirebaseConfigured,
  revelarAmigoSecreto,
  suscribirSorteo,
} from "@/lib/firebase";
import type { Participante, SorteoConId } from "@/types/sorteo";

interface SorteoRevealClientProps {
  sorteoId: string;
}

export function SorteoRevealClient({ sorteoId }: SorteoRevealClientProps) {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("t");

  const firebaseOk = isFirebaseConfigured();
  const missingEnv = useMemo(() => getMissingFirebaseEnvVars(), []);

  const [sorteo, setSorteo] = useState<SorteoConId | null>(null);
  const [loading, setLoading] = useState(firebaseOk);
  const [loadError, setLoadError] = useState<string | null>(
    firebaseOk
      ? null
      : `Faltan variables de entorno de Firebase (${missingEnv.join(", ")}).`
  );

  const [revealingId, setRevealingId] = useState<string | null>(null);
  const [revealError, setRevealError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<{
    para: string;
    asignadoA: string;
  } | null>(null);

  useEffect(() => {
    if (!firebaseOk) {
      return;
    }

    const unsubscribe = suscribirSorteo(
      sorteoId,
      (data) => {
        setSorteo(data);
        setLoading(false);
        if (!data) {
          setLoadError("No encontramos este sorteo. Verifica el enlace.");
        } else {
          setLoadError(null);
        }
      },
      (err) => {
        setLoading(false);
        setLoadError(
          err.message || "Error al conectar con Firestore para cargar el sorteo."
        );
      }
    );

    return () => unsubscribe();
  }, [sorteoId, firebaseOk, missingEnv]);

  const participantePorToken = useMemo(() => {
    if (!sorteo || !tokenParam) return null;
    return sorteo.participantes.find((p) => p.token === tokenParam) ?? null;
  }, [sorteo, tokenParam]);

  const tokenInvalido = Boolean(
    sorteo && tokenParam && !participantePorToken
  );

  const selectorBloqueado = Boolean(
    participantePorToken && !participantePorToken.revelado
  );

  const totalParticipantes = sorteo?.participantes.length ?? 0;
  const totalRevelados =
    sorteo?.participantes.filter((p) => p.revelado).length ?? 0;
  const todosRevelados =
    totalParticipantes > 0 && totalRevelados === totalParticipantes;

  async function handleRevealParticipant(participante: Participante) {
    if (!sorteo || revealingId || participante.revelado) return;
    if (selectorBloqueado && participante.id !== participantePorToken?.id) {
      return;
    }

    setRevealError(null);

    const tokenAValidar =
      tokenParam && participantePorToken?.id === participante.id
        ? tokenParam
        : undefined;

    setRevealingId(participante.id);
    try {
      const res = await revelarAmigoSecreto(
        sorteo.id,
        participante.id,
        tokenAValidar
      );
      setResultado({
        para: participante.nombre,
        asignadoA: res.asignadoA,
      });
    } catch (err) {
      setRevealError(
        err instanceof Error
          ? err.message
          : "No se pudo revelar tu Amigo Secreto. Intenta nuevamente."
      );
    } finally {
      setRevealingId(null);
    }
  }

  if (loading) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-rose-600 border-t-transparent" />
        <p className="mt-3 text-sm font-medium text-stone-600">
          Cargando sorteo...
        </p>
      </div>
    );
  }

  if (loadError || !sorteo) {
    return (
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-start gap-3 text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <div>
            <h2 className="text-lg font-bold text-stone-900">
              No se pudo cargar el sorteo
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              {loadError ?? "El sorteo solicitado no existe."}
            </p>
          </div>
        </div>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Crear un nuevo sorteo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="border-b border-stone-100 pb-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            Sorteo de Amigo Secreto
          </span>
          <span className="text-xs font-semibold text-stone-600">
            {totalRevelados} de {totalParticipantes} revelados
          </span>
        </div>

        <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          {sorteo.nombre}
        </h2>

        <div
          aria-hidden="true"
          className="mt-4 h-2 w-full overflow-hidden rounded-full bg-stone-100"
        >
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-300"
            style={{
              width:
                totalParticipantes > 0
                  ? `${Math.round((totalRevelados / totalParticipantes) * 100)}%`
                  : "0%",
            }}
          />
        </div>
      </div>

      {tokenInvalido && (
        <div
          role="alert"
          className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-sm text-amber-900"
        >
          <AlertTriangle
            className="mt-0.5 h-4 w-4 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <span>
            El enlace con token no coincide con ningún participante de este
            sorteo. Puedes tocar tu nombre si aún no revelaste.
          </span>
        </div>
      )}

      {participantePorToken && participantePorToken.revelado && !resultado && (
        <div
          role="status"
          className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900"
        >
          <CheckCircle2
            className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">
              Hola {participantePorToken.nombre}, ya revelaste tu Amigo Secreto
            </p>
            <p className="mt-0.5 text-emerald-800">
              Por seguridad, tu resultado solo se muestra al momento de
              revelarlo y tu nombre quedó bloqueado para evitar duplicados.
            </p>
          </div>
        </div>
      )}

      {resultado && (
        <div
          role="status"
          className="animate-pop-in mt-6 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-6 text-center"
        >
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white shadow-sm">
            <Sparkles className="h-6 w-6" aria-hidden="true" />
          </div>
          <p className="mt-3 text-sm font-medium text-emerald-800">
            {resultado.para}, tu Amigo Secreto es:
          </p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 sm:text-4xl">
            {resultado.asignadoA}
          </p>
          <p className="mt-3 text-xs text-emerald-700">
            Guarda este nombre en secreto. Tu nombre ya quedó bloqueado para
            evitar futuras selecciones.
          </p>
        </div>
      )}

      {revealError && (
        <div
          role="alert"
          className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
        >
          {revealError}
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-stone-900">
            {todosRevelados
              ? "Todos los participantes ya revelaron su Amigo Secreto"
              : "Toca tu nombre para revelar tu Amigo Secreto"}
          </h3>
          {selectorBloqueado && (
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Enlace privado de {participantePorToken?.nombre}
            </span>
          )}
        </div>

        <ul className="mt-4 space-y-2.5">
          {sorteo.participantes.map((p) => {
            const bloqueadoPorToken =
              selectorBloqueado && p.id !== participantePorToken?.id;
            const deshabilitado =
              p.revelado || revealingId !== null || bloqueadoPorToken;
            const revelandoEste = revealingId === p.id;

            return (
              <li key={p.id}>
                <button
                  type="button"
                  disabled={deshabilitado}
                  onClick={() => handleRevealParticipant(p)}
                  className={`flex min-h-14 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600 ${
                    p.revelado
                      ? "cursor-not-allowed border-stone-200 bg-stone-50 text-stone-400"
                      : bloqueadoPorToken
                        ? "cursor-not-allowed border-stone-200 bg-stone-50/60 text-stone-400"
                        : "border-stone-200 bg-white text-stone-900 shadow-xs hover:border-rose-300 hover:bg-rose-50/70 active:scale-[0.99]"
                  }`}
                >
                  <span className="text-base font-semibold">{p.nombre}</span>

                  {p.revelado ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                      ✓ Revelado
                    </span>
                  ) : revelandoEste ? (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
                      Revelando...
                    </span>
                  ) : bloqueadoPorToken ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-500">
                      <Lock className="h-3 w-3" aria-hidden="true" />
                      Bloqueado
                    </span>
                  ) : (
                    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-xs font-semibold text-white">
                      <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                      Revelar
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

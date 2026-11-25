"use client";

import { useEffect, useId, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Gift,
  Lock,
  CheckCircle2,
  Clock,
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
import type { SorteoConId } from "@/types/sorteo";

interface SorteoRevealClientProps {
  sorteoId: string;
}

export function SorteoRevealClient({ sorteoId }: SorteoRevealClientProps) {
  const searchParams = useSearchParams();
  const tokenParam = searchParams.get("t");

  const selectId = useId();
  const selectErrorId = useId();

  const firebaseOk = isFirebaseConfigured();
  const missingEnv = useMemo(() => getMissingFirebaseEnvVars(), []);

  const [sorteo, setSorteo] = useState<SorteoConId | null>(null);
  const [loading, setLoading] = useState(firebaseOk);
  const [loadError, setLoadError] = useState<string | null>(
    firebaseOk
      ? null
      : `Faltan variables de entorno de Firebase (${missingEnv.join(", ")}).`
  );

  const [selectedId, setSelectedId] = useState("");
  const [selectTouchedInvalid, setSelectTouchedInvalid] = useState(false);
  const [isRevealing, setIsRevealing] = useState(false);
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

  // Participante asociado al token de la URL (?t=...)
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

  const effectiveSelectedId = selectorBloqueado
    ? participantePorToken!.id
    : participantePorToken?.revelado && selectedId === participantePorToken.id
      ? ""
      : selectedId;

  const totalParticipantes = sorteo?.participantes.length ?? 0;
  const totalRevelados =
    sorteo?.participantes.filter((p) => p.revelado).length ?? 0;

  const seleccionado = useMemo(() => {
    if (!sorteo || !effectiveSelectedId) return null;
    return (
      sorteo.participantes.find((p) => p.id === effectiveSelectedId) ?? null
    );
  }, [sorteo, effectiveSelectedId]);

  const todosRevelados =
    totalParticipantes > 0 && totalRevelados === totalParticipantes;

  async function handleReveal(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setRevealError(null);

    if (!sorteo) return;

    if (!effectiveSelectedId) {
      setSelectTouchedInvalid(true);
      return;
    }

    const elegido = sorteo.participantes.find(
      (p) => p.id === effectiveSelectedId
    );
    if (!elegido) {
      setRevealError("Participante no válido.");
      return;
    }

    if (elegido.revelado) {
      setRevealError(`${elegido.nombre} ya reveló su Amigo Secreto.`);
      setSelectedId("");
      return;
    }

    // Si existe token válido para este participante, se envía para validación en transacción
    const tokenAValidar =
      tokenParam && participantePorToken?.id === elegido.id
        ? tokenParam
        : undefined;

    setIsRevealing(true);
    try {
      const res = await revelarAmigoSecreto(
        sorteo.id,
        elegido.id,
        tokenAValidar
      );
      setResultado({
        para: elegido.nombre,
        asignadoA: res.asignadoA,
      });
      setSelectedId("");
      setSelectTouchedInvalid(false);
    } catch (err) {
      setRevealError(
        err instanceof Error
          ? err.message
          : "No se pudo revelar tu Amigo Secreto. Intenta nuevamente."
      );
    } finally {
      setIsRevealing(false);
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
    <div className="space-y-6">
      {/* Tarjeta principal de selección y revelación */}
      <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="border-b border-stone-100 pb-5">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-rose-700">
            <Gift className="h-3.5 w-3.5" aria-hidden="true" />
            Sorteo de Amigo Secreto
          </span>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
            {sorteo.nombre}
          </h2>
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
              sorteo. Puedes seleccionarte manualmente si aún no revelaste.
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
                Hola {participantePorToken.nombre}, ya revelaste tu Amigo
                Secreto
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
              Guarda este nombre en secreto. Tu estado ya fue marcado como
              revelado.
            </p>
          </div>
        )}

        <form onSubmit={handleReveal} noValidate className="mt-6 space-y-5">
          <div>
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor={selectId}
                className="block text-sm font-semibold text-stone-900"
              >
                Selecciona tu nombre
              </label>
              {selectorBloqueado && (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-0.5 text-xs font-medium text-stone-700">
                  <Lock className="h-3 w-3" aria-hidden="true" />
                  Identidad verificada por enlace
                </span>
              )}
            </div>

            <select
              id={selectId}
              name="participante"
              required
              disabled={selectorBloqueado || isRevealing || todosRevelados}
              value={effectiveSelectedId}
              aria-invalid={
                selectTouchedInvalid && !effectiveSelectedId ? "true" : "false"
              }
              aria-describedby={
                selectTouchedInvalid && !effectiveSelectedId
                  ? selectErrorId
                  : undefined
              }
              onChange={(e) => {
                setSelectedId(e.target.value);
                setSelectTouchedInvalid(false);
                setRevealError(null);
              }}
              onBlur={() => {
                if (!effectiveSelectedId && !selectorBloqueado) {
                  setSelectTouchedInvalid(true);
                }
              }}
              className={`validated-control mt-2 block w-full rounded-xl border px-4 py-3 text-sm font-medium transition-colors focus:border-rose-500 focus:outline-2 focus:outline-rose-500/20 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-700 ${
                selectTouchedInvalid && !effectiveSelectedId
                  ? "user-invalid-fallback border-red-600 bg-red-50"
                  : "border-stone-300 bg-white text-stone-900"
              }`}
            >
              <option value="" disabled>
                {todosRevelados
                  ? "Todos los participantes ya revelaron su Amigo Secreto"
                  : "Selecciona tu nombre..."}
              </option>
              {sorteo.participantes.map((p) => (
                <option key={p.id} value={p.id} disabled={p.revelado}>
                  {p.revelado ? `${p.nombre} (✓ Ya reveló)` : p.nombre}
                </option>
              ))}
            </select>

            <p
              id={selectErrorId}
              className="field-error mt-1.5 text-xs font-medium text-red-600"
            >
              Por favor, selecciona tu nombre de la lista.
            </p>
          </div>

          {revealError && (
            <div
              role="alert"
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
            >
              {revealError}
            </div>
          )}

          {seleccionado && !seleccionado.revelado && (
            <div className="animate-pop-in space-y-3 rounded-xl border border-rose-200 bg-rose-50/70 p-4">
              <p className="text-sm text-stone-700">
                Hola <strong className="text-stone-900">{seleccionado.nombre}</strong>,
                cuando pulses el botón verás a quién te toca regalar y tu nombre
                quedará bloqueado.
              </p>
              <button
                type="submit"
                disabled={isRevealing}
                className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
              >
                <Eye className="h-4 w-4" aria-hidden="true" />
                {isRevealing ? "Revelando..." : "Revelar mi Amigo Secreto"}
              </button>
            </div>
          )}
        </form>
      </section>

      {/* Panel inferior: Estado general del sorteo */}
      <section
        aria-labelledby="estado-general-titulo"
        className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3
            id="estado-general-titulo"
            className="text-base font-bold text-stone-900"
          >
            Estado general del sorteo
          </h3>
          <span className="text-xs font-semibold text-stone-600">
            {totalRevelados} de {totalParticipantes} revelados
          </span>
        </div>

        <div
          aria-hidden="true"
          className="mt-3 h-2 w-full overflow-hidden rounded-full bg-stone-100"
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

        <ul className="mt-5 divide-y divide-stone-100">
          {sorteo.participantes.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between py-3 text-sm"
            >
              <span className="font-medium text-stone-800">{p.nombre}</span>
              {p.revelado ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                  ✓ Revelado
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                  <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                  Pendiente
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import Link from "next/link";
import {
  Gift,
  Plus,
  Trash2,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  Users,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  crearSorteoData,
  normalizarNombre,
  validarParticipantes,
} from "@/lib/sorteo";
import {
  crearSorteoEnFirestore,
  getMissingFirebaseEnvVars,
  isFirebaseConfigured,
} from "@/lib/firebase";
import { CopyButton } from "@/components/CopyButton";
import type { SorteoConId } from "@/types/sorteo";

export function SorteoCreator() {
  const nombreSorteoId = useId();
  const nombreSorteoErrorId = useId();
  const nuevoParticipanteId = useId();

  const [nombreSorteo, setNombreSorteo] = useState("");
  const [nuevoParticipante, setNuevoParticipante] = useState("");
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [participanteError, setParticipanteError] = useState<string | null>(
    null
  );
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sorteoCreado, setSorteoCreado] = useState<SorteoConId | null>(null);
  const [origin, setOrigin] = useState("");

  const firebaseOk = isFirebaseConfigured();
  const missingEnv = getMissingFirebaseEnvVars();

  function handleAddParticipant() {
    setParticipanteError(null);
    setSubmitError(null);

    const limpio = normalizarNombre(nuevoParticipante);
    if (!limpio) {
      setParticipanteError("Escribe un nombre antes de añadirlo.");
      return;
    }

    const yaExiste = participantes.some(
      (p) => p.toLocaleLowerCase("es") === limpio.toLocaleLowerCase("es")
    );
    if (yaExiste) {
      setParticipanteError(`"${limpio}" ya está en la lista.`);
      return;
    }

    setParticipantes((prev) => [...prev, limpio]);
    setNuevoParticipante("");
  }

  function handleRemoveParticipant(index: number) {
    setParticipantes((prev) => prev.filter((_, i) => i !== index));
    setParticipanteError(null);
    setSubmitError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitError(null);
    setParticipanteError(null);

    const nombreLimpio = normalizarNombre(nombreSorteo);
    if (!nombreLimpio) {
      setSubmitError("El nombre del sorteo es obligatorio.");
      return;
    }

    const validacion = validarParticipantes(participantes);
    if (validacion.error) {
      setSubmitError(validacion.error);
      return;
    }

    if (!firebaseOk) {
      setSubmitError(
        `Falta configurar Firebase (${missingEnv.join(", ")}). Revisa .env.local.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const sorteoData = crearSorteoData(nombreLimpio, validacion.validos);
      const id = await crearSorteoEnFirestore(sorteoData);
      setOrigin(typeof window !== "undefined" ? window.location.origin : "");
      setSorteoCreado({ id, ...sorteoData });
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al guardar el sorteo en Firestore."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleReset() {
    setSorteoCreado(null);
    setNombreSorteo("");
    setNuevoParticipante("");
    setParticipantes([]);
    setParticipanteError(null);
    setSubmitError(null);
  }

  if (sorteoCreado) {
    return (
      <section
        aria-labelledby="sorteo-creado-titulo"
        className="animate-pop-in rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-stone-100 pb-5">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800">
              <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
              Sorteo guardado en Firestore
            </span>
            <h2
              id="sorteo-creado-titulo"
              className="mt-2 text-2xl font-bold tracking-tight text-stone-900"
            >
              {sorteoCreado.nombre}
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Comparte cada enlace privado con su respectivo participante. La
              lista está ordenada alfabéticamente para no revelar el orden del
              sorteo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/sorteo/${sorteoCreado.id}`}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-stone-300 bg-white px-3.5 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-100"
            >
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
              Ver sala del sorteo
            </Link>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-lg bg-stone-900 px-3.5 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-800"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              Nuevo sorteo
            </button>
          </div>
        </div>

        <ul className="mt-6 divide-y divide-stone-100">
          {sorteoCreado.participantes.map((p) => {
            const path = `/sorteo/${sorteoCreado.id}?t=${p.token}`;
            const fullUrl = origin ? `${origin}${path}` : path;
            return (
              <li
                key={p.id}
                className="flex flex-col gap-3 py-3.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-stone-900">{p.nombre}</p>
                  <p className="truncate font-mono text-xs text-stone-500">
                    {fullUrl}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <CopyButton
                    text={fullUrl}
                    label={`Copiar enlace privado de ${p.nombre}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8"
    >
      {!firebaseOk && (
        <div
          role="alert"
          className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
        >
          <AlertTriangle
            className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
            aria-hidden="true"
          />
          <div>
            <p className="font-semibold">Configuración de Firebase pendiente</p>
            <p className="mt-1 text-amber-800">
              Copia <code className="font-mono">.env.example</code> a{" "}
              <code className="font-mono">.env.local</code> y completa las
              variables <code className="font-mono">NEXT_PUBLIC_FIREBASE_*</code>{" "}
              antes de crear sorteos.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-6">
        <div>
          <label
            htmlFor={nombreSorteoId}
            className="block text-sm font-semibold text-stone-900"
          >
            Nombre del sorteo <span className="text-rose-600">*</span>
          </label>
          <p className="mt-0.5 text-xs text-stone-500">
            Ejemplo: Navidad Familiar 2026 - Amigo Secreto
          </p>
          <input
            id={nombreSorteoId}
            name="nombreSorteo"
            type="text"
            required
            value={nombreSorteo}
            onChange={(e) => {
              setNombreSorteo(e.target.value);
              if (submitError) setSubmitError(null);
            }}
            data-error={nombreSorteoErrorId}
            placeholder="Navidad Familiar 2026 - Amigo Secreto"
            className="validated-control mt-2 block w-full rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-rose-500 focus:outline-2 focus:outline-rose-500/20"
          />
          <p
            id={nombreSorteoErrorId}
            className="field-error mt-1.5 text-xs font-medium text-red-600"
          >
            Ingresa un nombre para identificar el sorteo.
          </p>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label
              htmlFor={nuevoParticipanteId}
              className="block text-sm font-semibold text-stone-900"
            >
              Participantes <span className="text-rose-600">*</span>
            </label>
            <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {participantes.length} añadidos (mínimo 3)
            </span>
          </div>

          <div className="mt-2 flex gap-2">
            <input
              id={nuevoParticipanteId}
              type="text"
              value={nuevoParticipante}
              onChange={(e) => {
                setNuevoParticipante(e.target.value);
                if (participanteError) setParticipanteError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddParticipant();
                }
              }}
              placeholder="Nombre del participante (ej. Sofía)"
              className="block min-w-0 flex-1 rounded-xl border border-stone-300 bg-white px-4 py-2.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-rose-500 focus:outline-2 focus:outline-rose-500/20"
            />
            <button
              type="button"
              onClick={handleAddParticipant}
              className="inline-flex min-h-10 shrink-0 items-center gap-1.5 rounded-xl bg-stone-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-stone-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-stone-900"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              Añadir
            </button>
          </div>

          {participanteError && (
            <p
              role="alert"
              className="mt-1.5 text-xs font-medium text-red-600"
            >
              {participanteError}
            </p>
          )}

          {participantes.length > 0 ? (
            <ul
              aria-label="Lista de participantes"
              className="mt-4 flex flex-wrap gap-2"
            >
              {participantes.map((nombre, index) => (
                <li
                  key={nombre}
                  className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 py-1.5 pr-2 pl-3.5 text-sm font-medium text-stone-800"
                >
                  <span>{nombre}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveParticipant(index)}
                    aria-label={`Quitar a ${nombre}`}
                    className="inline-flex h-6 w-6 items-center justify-center rounded-full text-stone-400 transition-colors hover:bg-rose-100 hover:text-rose-700 focus-visible:outline-2 focus-visible:outline-rose-600"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 rounded-xl border border-dashed border-stone-200 bg-stone-50/70 px-4 py-5 text-center text-sm text-stone-500">
              Aún no hay participantes. Añade al menos 3 personas para sortear.
            </p>
          )}
        </div>

        {submitError && (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800"
          >
            {submitError}
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-stone-100 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1.5 text-xs text-stone-500">
            <ShieldCheck
              className="h-4 w-4 text-emerald-600"
              aria-hidden="true"
            />
            Ciclo cerrado único: nadie se toca a sí mismo ni hay cruces A ↔ B.
          </p>

          <button
            type="submit"
            disabled={isSubmitting || participantes.length < 3}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
          >
            <Gift className="h-4 w-4" aria-hidden="true" />
            {isSubmitting ? "Generando sorteo..." : "Crear Sorteo"}
          </button>
        </div>
      </div>
    </form>
  );
}

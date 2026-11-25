import type { Participante, Sorteo } from "@/types/sorteo";

const MIN_PARTICIPANTES = 3;

function getRandomInt(maxExclusive: number): number {
  if (maxExclusive <= 0) {
    throw new Error("maxExclusive debe ser mayor que 0");
  }
  // Rejection sampling with crypto.getRandomValues to avoid modulo bias
  const range = 0x1_0000_0000;
  const limit = range - (range % maxExclusive);
  const buffer = new Uint32Array(1);
  let value: number;
  do {
    crypto.getRandomValues(buffer);
    value = buffer[0];
  } while (value >= limit);
  return value % maxExclusive;
}

/**
 * Mezcla un arreglo usando el algoritmo Fisher-Yates con aleatoriedad criptográfica.
 */
export function mezclarFisherYates<T>(items: readonly T[]): T[] {
  const copia = [...items];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = getRandomInt(i + 1);
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

/**
 * Genera un token criptográfico URL-safe único por participante.
 */
export function generarTokenSeguro(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function normalizarNombre(nombre: string): string {
  return nombre.trim().replace(/\s+/g, " ");
}

export function validarParticipantes(nombresRaw: readonly string[]): {
  validos: string[];
  error: string | null;
} {
  const vistos = new Set<string>();
  const validos: string[] = [];

  for (const raw of nombresRaw) {
    const limpio = normalizarNombre(raw);
    if (!limpio) {
      return {
        validos: [],
        error: "No puede haber nombres de participantes vacíos.",
      };
    }
    const clave = limpio.toLocaleLowerCase("es");
    if (vistos.has(clave)) {
      return {
        validos: [],
        error: `El participante "${limpio}" está duplicado.`,
      };
    }
    vistos.add(clave);
    validos.push(limpio);
  }

  if (validos.length < MIN_PARTICIPANTES) {
    return {
      validos: [],
      error: `Se necesitan al menos ${MIN_PARTICIPANTES} participantes para realizar el sorteo.`,
    };
  }

  return { validos, error: null };
}

/**
 * Crea la estructura completa de un sorteo para guardar en Firestore:
 * 1. Mezcla con Fisher-Yates.
 * 2. Asigna en ciclo cerrado único: participante[i] regala a participante[(i + 1) % n].
 *    Esto garantiza cero auto-asignaciones y cero parejas cruzadas (A ↔ B).
 * 3. Ordena la lista final alfabéticamente para no revelar el orden circular.
 */
export function crearSorteoData(
  nombreSorteo: string,
  nombresParticipantes: readonly string[]
): Sorteo {
  const nombreLimpio = normalizarNombre(nombreSorteo);
  if (!nombreLimpio) {
    throw new Error("El nombre del sorteo es obligatorio.");
  }

  const { validos, error } = validarParticipantes(nombresParticipantes);
  if (error) {
    throw new Error(error);
  }

  const mezclados = mezclarFisherYates(validos);
  const total = mezclados.length;

  const asignados: Participante[] = mezclados.map((nombre, index) => ({
    id: crypto.randomUUID(),
    nombre,
    token: generarTokenSeguro(),
    asignadoA: mezclados[(index + 1) % total],
    revelado: false,
    reveladoEn: null,
  }));

  // Ordenar alfabéticamente para ocultar el orden circular del ciclo
  asignados.sort((a, b) =>
    a.nombre.localeCompare(b.nombre, "es", { sensitivity: "base" })
  );

  return {
    nombre: nombreLimpio,
    creadoEn: new Date().toISOString(),
    participantes: asignados,
  };
}


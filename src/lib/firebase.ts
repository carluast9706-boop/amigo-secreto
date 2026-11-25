import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  type Firestore,
  type Unsubscribe,
} from "firebase/firestore";
import type { Sorteo, SorteoConId } from "@/types/sorteo";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const REQUIRED_ENV_VARS: Array<[keyof typeof firebaseConfig, string]> = [
  ["apiKey", "NEXT_PUBLIC_FIREBASE_API_KEY"],
  ["authDomain", "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"],
  ["projectId", "NEXT_PUBLIC_FIREBASE_PROJECT_ID"],
  ["storageBucket", "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"],
  ["messagingSenderId", "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"],
  ["appId", "NEXT_PUBLIC_FIREBASE_APP_ID"],
];

export function getMissingFirebaseEnvVars(): string[] {
  return REQUIRED_ENV_VARS.filter(([key]) => !firebaseConfig[key]).map(
    ([, envName]) => envName
  );
}

export function isFirebaseConfigured(): boolean {
  return getMissingFirebaseEnvVars().length === 0;
}

function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    const missing = getMissingFirebaseEnvVars().join(", ");
    throw new Error(
      `Faltan variables de entorno de Firebase: ${missing}. Configura .env.local o las variables en Vercel.`
    );
  }
  return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
}

function getDb(): Firestore {
  return getFirestore(getFirebaseApp());
}

const COLECCION_SORTEOS = "sorteos";

export async function crearSorteoEnFirestore(sorteo: Sorteo): Promise<string> {
  const db = getDb();
  const docRef = await addDoc(collection(db, COLECCION_SORTEOS), sorteo);
  return docRef.id;
}

export async function obtenerSorteo(id: string): Promise<SorteoConId | null> {
  const db = getDb();
  const snap = await getDoc(doc(db, COLECCION_SORTEOS, id));
  if (!snap.exists()) {
    return null;
  }
  return {
    id: snap.id,
    ...(snap.data() as Sorteo),
  };
}

export function suscribirSorteo(
  id: string,
  onData: (sorteo: SorteoConId | null) => void,
  onError: (error: Error) => void
): Unsubscribe {
  const db = getDb();
  return onSnapshot(
    doc(db, COLECCION_SORTEOS, id),
    (snap) => {
      if (!snap.exists()) {
        onData(null);
        return;
      }
      onData({
        id: snap.id,
        ...(snap.data() as Sorteo),
      });
    },
    (err) => {
      onError(err);
    }
  );
}

export async function revelarAmigoSecreto(
  sorteoId: string,
  participanteId: string,
  token?: string | null
): Promise<{ asignadoA: string; reveladoEn: string }> {
  const db = getDb();
  const sorteoRef = doc(db, COLECCION_SORTEOS, sorteoId);

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(sorteoRef);
    if (!snap.exists()) {
      throw new Error("El sorteo no existe o fue eliminado.");
    }

    const data = snap.data() as Sorteo;
    const index = data.participantes.findIndex((p) => p.id === participanteId);
    if (index === -1) {
      throw new Error("Participante no encontrado en este sorteo.");
    }

    const participante = data.participantes[index];

    if (token && participante.token !== token) {
      throw new Error(
        "El token de seguridad no coincide con el participante seleccionado."
      );
    }

    if (participante.revelado) {
      throw new Error(
        `${participante.nombre} ya reveló su Amigo Secreto anteriormente.`
      );
    }

    const reveladoEn = new Date().toISOString();
    const participantesActualizados = data.participantes.map((p, i) =>
      i === index ? { ...p, revelado: true, reveladoEn } : p
    );

    transaction.update(sorteoRef, {
      participantes: participantesActualizados,
    });

    return {
      asignadoA: participante.asignadoA,
      reveladoEn,
    };
  });
}


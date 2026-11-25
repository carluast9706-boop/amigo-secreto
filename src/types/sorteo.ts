export interface Participante {
  id: string;
  nombre: string;
  token: string;
  asignadoA: string;
  revelado: boolean;
  reveladoEn: string | null;
}

export interface Sorteo {
  nombre: string;
  creadoEn: string;
  participantes: Participante[];
}

export interface SorteoConId extends Sorteo {
  id: string;
}


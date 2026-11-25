import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { crearSorteoData, validarParticipantes } from "./sorteo.ts";

describe("validarParticipantes", () => {
  it("rechaza menos de 3 participantes", () => {
    const res = validarParticipantes(["Ana", "Luis"]);
    assert.equal(res.validos.length, 0);
    assert.match(res.error ?? "", /al menos 3/i);
  });

  it("rechaza nombres vacíos o solo espacios", () => {
    const res = validarParticipantes(["Ana", "   ", "Luis"]);
    assert.match(res.error ?? "", /vacíos/i);
  });

  it("rechaza duplicados sin importar mayúsculas o espacios", () => {
    const res = validarParticipantes(["Ana", "  ana ", "Luis", "Carlos"]);
    assert.match(res.error ?? "", /duplicado/i);
  });
});

describe("crearSorteoData", () => {
  it("requiere nombre del sorteo", () => {
    assert.throws(
      () => crearSorteoData("   ", ["Ana", "Luis", "Sofía"]),
      /obligatorio/i
    );
  });

  it("genera ciclo cerrado único sin auto-asignaciones ni cruces de 2 personas", () => {
    const nombres = ["Sofía", "Ana", "Carlos", "Miguel", "Lucía", "Pedro"];

    for (let iter = 0; iter < 50; iter++) {
      const sorteo = crearSorteoData("Navidad Familiar 2026", nombres);

      assert.equal(sorteo.nombre, "Navidad Familiar 2026");
      assert.ok(!Number.isNaN(Date.parse(sorteo.creadoEn)));
      assert.equal(sorteo.participantes.length, nombres.length);

      // Verificar orden alfabético
      const ordenados = [...sorteo.participantes]
        .map((p) => p.nombre)
        .sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));
      assert.deepEqual(
        sorteo.participantes.map((p) => p.nombre),
        ordenados
      );

      // Verificar IDs y tokens únicos, estado inicial y cero auto-asignaciones
      const ids = new Set<string>();
      const tokens = new Set<string>();
      const mapa = new Map<string, string>();

      for (const p of sorteo.participantes) {
        assert.ok(p.id.length > 0);
        assert.ok(p.token.length >= 32);
        assert.equal(p.revelado, false);
        assert.equal(p.reveladoEn, null);
        assert.notEqual(p.nombre, p.asignadoA);

        assert.equal(ids.has(p.id), false);
        assert.equal(tokens.has(p.token), false);
        ids.add(p.id);
        tokens.add(p.token);
        mapa.set(p.nombre, p.asignadoA);
      }

      // Verificar cero parejas cruzadas (A <-> B)
      for (const [a, b] of mapa.entries()) {
        assert.notEqual(mapa.get(b), a, `Cruce detectado entre ${a} y ${b}`);
      }

      // Verificar ciclo cerrado único de longitud N
      const inicio = sorteo.participantes[0].nombre;
      const visitados = new Set<string>();
      let actual = inicio;
      for (let step = 0; step < nombres.length; step++) {
        assert.equal(visitados.has(actual), false);
        visitados.add(actual);
        actual = mapa.get(actual)!;
      }
      assert.equal(visitados.size, nombres.length);
      assert.equal(actual, inicio);
    }
  });
});


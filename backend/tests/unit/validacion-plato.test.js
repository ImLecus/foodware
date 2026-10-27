import { describe, expect, it } from 'vitest';
import { actualizarPlatoSchema, crearPlatoSchema } from '../../src/api/cartaSchemas.js';

describe('validación plato', () => {
  it('rechaza precio <= 0', () => {
    const r = crearPlatoSchema.safeParse({ nombre: 'X', partida_codigo: 'entrantes', precio: 0 });
    expect(r.success).toBe(false);
  });
  it('acepta precio > 0 y partida válida', () => {
    const r = crearPlatoSchema.safeParse({ nombre: 'X', partida_codigo: 'principales', precio: 5.5 });
    expect(r.success).toBe(true);
  });
  it('actualización vacía rechazada', () => {
    const r = actualizarPlatoSchema.safeParse({});
    expect(r.success).toBe(false);
  });
});

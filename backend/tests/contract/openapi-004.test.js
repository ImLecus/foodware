import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const OPENAPI = path.resolve(
  AQUI,
  '../../../specs/004-marcar_listos/contracts/openapi.yaml',
);
const contenido = fs.readFileSync(OPENAPI, 'utf8');

describe('contrato OpenAPI de marcar estado (004)', () => {
  it('documenta la partida obligatoria y la respuesta 400', () => {
    expect(contenido).toContain('/pedidos/{pedidoId}/lineas/{lineaId}/estado:');
    expect(contenido).toMatch(/- name: partida\n\s+in: query\n\s+required: true/);
    expect(contenido).toContain('"400":');
    expect(contenido).toContain('partida_requerida');
  });

  it('incluye ejemplos para marcar y deshacer', () => {
    expect(contenido).toContain('marcarListo:');
    expect(contenido).toContain('deshacer:');
  });

  it('documenta la partida por línea y la semántica por partida', () => {
    expect(contenido).toContain(
      'description: Partida del plato; presente en la lista de pendientes de cocina.',
    );
    expect(contenido).toContain('la partida se completa');
    expect(contenido).toContain('partida que ya está completada');
  });
});

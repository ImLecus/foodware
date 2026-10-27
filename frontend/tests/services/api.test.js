import { afterEach, describe, expect, it, vi } from 'vitest';
import { apiGet } from '../../src/services/api.js';

function respuestaError(cuerpo, status = 404, statusText = 'Not Found') {
  return {
    ok: false,
    status,
    statusText,
    json: async () => cuerpo,
  };
}

describe('cliente REST: mensajes de error', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('usa el mensaje en español del cuerpo del error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        respuestaError({
          codigo: 'cocinero_no_encontrado',
          mensaje: 'El cocinero indicado no existe',
        }),
      ),
    );

    await expect(apiGet('/cocineros/desconocido')).rejects.toMatchObject({
      message: 'El cocinero indicado no existe',
      codigo: 'cocinero_no_encontrado',
      status: 404,
    });
  });

  it('traduce un fallo de red a un mensaje en español', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(apiGet('/partidas/entrantes/pedidos-pendientes')).rejects.toMatchObject({
      message: 'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      codigo: 'sin_conexion',
    });
  });
});

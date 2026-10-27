import { afterEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { CABECERA_CAMARERO } from '../ayuda.js';

function clienteFalso() {
  const escrito = [];
  const respuesta = {
    writeHead: () => {},
    write: (trozo) => escrito.push(String(trozo)),
    end: () => {},
  };
  return { respuesta, peticion: { on: () => {} }, escrito };
}

describe('eventos SSE de aviso de mesa completa', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  function preparar(lineas = [{ id: 'linea-1', estado: 'pendiente' }]) {
    db = crearBase();
    app = createApp(db);
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    for (const linea of lineas) {
      insertarLinea(db, { ...linea, pedidoId: 'pedido-1' });
    }
  }

  function marcar(lineaId, estado = 'listo') {
    return request(app)
      .put(`/api/pedidos/pedido-1/lineas/${lineaId}/estado`)
      .set(CABECERA_CAMARERO)
      .send({ estado });
  }

  async function leerMesa() {
    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);
    return respuesta.body.mesas[0];
  }

  it('emite aviso.activo y la instantánea incluye el aviso al completarse la mesa', async () => {
    preparar();
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    const marca = await marcar('linea-1');

    expect(marca.status).toBe(200);

    const mesa = await leerMesa();
    expect(mesa.completa).toBe(true);
    expect(mesa.aviso).toMatchObject({ estado: 'activo', mesa_id: 'mesa-1' });
    expect(mesa.aviso.generado_en).toEqual(expect.any(String));

    const contenido = escrito.join('');
    expect(contenido).toContain('event: aviso.activo');
    expect(contenido).toContain(`"aviso_id":"${mesa.aviso.id}"`);
    expect(contenido).toContain('"mesa_id":"mesa-1"');
  });

  it('emite aviso.retirado y la instantánea deja de mostrar el aviso al deshacer la marca', async () => {
    preparar();
    await marcar('linea-1');

    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    const deshacer = await marcar('linea-1', 'pendiente');

    expect(deshacer.status).toBe(200);

    const mesa = await leerMesa();
    expect(mesa.completa).toBe(false);
    expect(mesa.aviso).toBeNull();

    const contenido = escrito.join('');
    expect(contenido).toContain('event: aviso.retirado');
    expect(contenido).toContain('"mesa_id":"mesa-1"');
  });

  it('no emite aviso.activo mientras queden platos pendientes', async () => {
    preparar([
      { id: 'linea-1', estado: 'pendiente' },
      { id: 'linea-2', estado: 'pendiente', platoId: 'plato-principal' },
    ]);
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    await marcar('linea-1');

    const contenido = escrito.join('');
    expect(contenido).not.toContain('event: aviso.activo');
    expect((await leerMesa()).aviso).toBeNull();
  });

  it('devuelve el aviso y la completitud en la respuesta del marcado', async () => {
    preparar();
    const { respuesta, peticion } = clienteFalso();
    suscribir(peticion, respuesta);

    const marca = await marcar('linea-1');

    expect(marca.body.mesa).toMatchObject({ completa: true });
    expect(marca.body.mesa.aviso).toMatchObject({ estado: 'activo', mesa_id: 'mesa-1' });
  });
});

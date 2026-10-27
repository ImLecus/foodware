import { afterEach, describe, expect, it } from 'vitest';
import { createApp } from '../../src/app.js';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { CABECERA_CAMARERO, CAMARERO_ID } from '../ayuda.js';
import request from 'supertest';

describe('GET /api/sala/mesas', () => {
  let db;
  let app;

  afterEach(() => {
    db?.close();
  });

  function preparar() {
    db = crearBase();
    app = createApp(db);
  }

  it('devuelve las mesas abiertas con sus platos enviados agrupados por partida', async () => {
    preparar();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-entrante', pedidoId: 'pedido-1', platoId: 'plato-entrante' });
    insertarLinea(db, {
      id: 'linea-principal',
      pedidoId: 'pedido-1',
      platoId: 'plato-principal',
    });
    insertarLinea(db, { id: 'linea-postre', pedidoId: 'pedido-1', platoId: 'plato-postre' });

    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.generado_en).toEqual(expect.any(String));

    const [mesa] = respuesta.body.mesas;
    expect(mesa.id).toBe('mesa-1');
    expect(mesa.identificador).toBe('Mesa 1');
    expect(mesa.abierta).toBe(true);
    expect(mesa.completa).toBe(false);
    expect(mesa.aviso).toBeNull();
    expect(mesa.platos.map((plato) => plato.partida)).toEqual([
      'entrantes',
      'principales',
      'postres',
    ]);
    expect(mesa.platos[0]).toMatchObject({
      id: 'linea-entrante',
      nombre: 'Croquetas',
      cantidad: 1,
      estado: 'pendiente',
      marcado_en: null,
    });
  });

  it('marca la mesa como completa solo si todas las líneas enviadas están listas', async () => {
    preparar();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, {
      id: 'linea-1',
      pedidoId: 'pedido-1',
      platoId: 'plato-entrante',
      estado: 'listo',
    });
    insertarLinea(db, {
      id: 'linea-2',
      pedidoId: 'pedido-1',
      platoId: 'plato-postre',
      estado: 'listo',
    });

    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);

    const [mesa] = respuesta.body.mesas;
    expect(mesa.completa).toBe(true);
    expect(mesa.platos.every((plato) => plato.estado === 'listo')).toBe(true);
  });

  it('incluye la mesa con comanda en curso sin platos marcables ni aviso', async () => {
    preparar();
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES ('pedido-curso', 'mesa-1', ?, 'en_curso')",
    ).run(CAMARERO_ID);
    db.prepare(
      "INSERT INTO lineas_pedido (id, pedido_id, plato_id, cantidad, precio_centimos) VALUES ('linea-curso', 'pedido-curso', 'plato-entrante', 1, 850)",
    ).run();

    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);

    const [mesa] = respuesta.body.mesas;
    expect(mesa.abierta).toBe(true);
    expect(mesa.platos).toEqual([]);
    expect(mesa.completa).toBe(false);
    expect(mesa.aviso).toBeNull();
  });

  it('devuelve una lista vacía cuando no hay mesas abiertas', async () => {
    preparar();

    const respuesta = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mesas).toEqual([]);
  });

  it('exige un camarero identificado', async () => {
    preparar();

    const respuesta = await request(app).get('/api/sala/mesas');

    expect(respuesta.status).toBe(401);
  });
});

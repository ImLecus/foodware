import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';
import {
  CABECERA_CAMARERO,
  cookieCocinero,
  clienteSseFalso,
  crearAppDePrueba,
  crearPedidoEnviado,
} from '../ayuda.js';

describe('difusión global del descarte de avisos', () => {
  let db;
  let app;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  async function completarMesa(pedidoId) {
    const pedido = await request(app).get(`/api/pedidos/${pedidoId}`).set(CABECERA_CAMARERO);
    const lineas = Object.entries(pedido.body.por_partida ?? {}).flatMap(([partida, grupo]) =>
      grupo.map((linea) => ({ ...linea, partida })),
    );
    for (const linea of lineas) {
      await request(app)
        .put(`/api/pedidos/${pedidoId}/lineas/${linea.id}/estado?partida=${linea.partida}`)
        .set(cookieCocinero(linea.partida))
        .send({ estado: 'listo' });
    }

    const sala = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);
    return sala.body.mesas[0].aviso;
  }

  it('difunde aviso.descartado a todos los clientes conectados', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    const aviso = await completarMesa(pedidoId);

    const clienteUno = clienteSseFalso();
    const clienteDos = clienteSseFalso();
    suscribir(clienteUno.peticion, clienteUno.respuesta);
    suscribir(clienteDos.peticion, clienteDos.respuesta);

    const descarte = await request(app)
      .post(`/api/sala/avisos/${aviso.id}/descartar`)
      .set(CABECERA_CAMARERO);

    expect(descarte.status).toBe(200);

    for (const cliente of [clienteUno, clienteDos]) {
      const contenido = cliente.escrito.join('');
      expect(contenido).toContain('event: aviso.descartado');
      expect(contenido).toContain(`"aviso_id":"${aviso.id}"`);
      expect(contenido).toContain('"mesa_id":"mesa-1"');
      expect(contenido).toContain('"descartado_en":"');
    }
  });

  it('no vuelve a difundir el descarte si el aviso ya estaba descartado', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    const aviso = await completarMesa(pedidoId);

    await request(app).post(`/api/sala/avisos/${aviso.id}/descartar`).set(CABECERA_CAMARERO);

    const cliente = clienteSseFalso();
    suscribir(cliente.peticion, cliente.respuesta);

    const segundo = await request(app)
      .post(`/api/sala/avisos/${aviso.id}/descartar`)
      .set(CABECERA_CAMARERO);

    expect(segundo.status).toBe(200);
    expect(cliente.escrito.join('')).not.toContain('event: aviso.descartado');
  });

  it('la instantánea posterior al descarte converge sin mostrar el aviso', async () => {
    ({ db, app } = crearAppDePrueba());
    const pedidoId = await crearPedidoEnviado(app);
    const aviso = await completarMesa(pedidoId);

    await request(app).post(`/api/sala/avisos/${aviso.id}/descartar`).set(CABECERA_CAMARERO);

    const sala = await request(app).get('/api/sala/mesas').set(CABECERA_CAMARERO);
    const [mesa] = sala.body.mesas;

    expect(mesa.completa).toBe(true);
    expect(mesa.aviso).toBeNull();
    expect(mesa.platos.every((plato) => plato.estado === 'listo')).toBe(true);
  });
});

import { afterEach, describe, expect, it } from 'vitest';
import { crearBase, insertarLinea, insertarPedido } from '../helpers/fixtures.js';
import { obtenerAvisoVigente } from '../../src/db/avisos.js';
import { calcularCompletitudMesa, sincronizarAvisoMesa } from '../../src/services/avisos.js';
import { reiniciarHub, suscribir } from '../../src/realtime/hub.js';

function clienteFalso() {
  const escrito = [];
  const respuesta = {
    writeHead: () => {},
    write: (trozo) => escrito.push(String(trozo)),
    end: () => {},
  };
  return { respuesta, peticion: { on: () => {} }, escrito };
}

describe('ciclo de vida de los avisos de mesa completa', () => {
  let db;

  afterEach(() => {
    reiniciarHub();
    db?.close();
  });

  function mesaCompleta() {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', estado: 'listo' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1', estado: 'listo' });
  }

  it('crea un aviso al completarse una mesa abierta y lo difunde', () => {
    mesaCompleta();
    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    const resultado = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true });

    expect(resultado.completa).toBe(true);
    expect(resultado.aviso).toMatchObject({ estado: 'activo', mesa_id: 'mesa-1' });
    expect(resultado.aviso.generado_en).toEqual(expect.any(String));

    const vigente = obtenerAvisoVigente(db, 'mesa-1');
    expect(vigente.id).toBe(resultado.aviso.id);
    expect(vigente.estado).toBe('activo');

    const contenido = escrito.join('');
    expect(contenido).toContain('event: aviso.activo');
    expect(contenido).toContain(`"aviso_id":"${resultado.aviso.id}"`);
    expect(contenido).toContain('"mesa_id":"mesa-1"');
  });

  it('no crea aviso mientras queden platos pendientes', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', estado: 'listo' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-1' });

    const resultado = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true });

    expect(resultado).toEqual({ completa: false, aviso: null });
    expect(obtenerAvisoVigente(db, 'mesa-1')).toBeNull();
  });

  it('no crea aviso en una mesa sin platos enviados', () => {
    db = crearBase();
    db.prepare(
      "INSERT INTO pedidos (id, mesa_id, camarero_id, estado) VALUES ('pedido-curso', 'mesa-1', 'camarero-1', 'en_curso')",
    ).run();
    insertarLinea(db, { id: 'linea-curso', pedidoId: 'pedido-curso', estado: 'listo' });

    expect(calcularCompletitudMesa(db, 'mesa-1')).toMatchObject({ completa: false, total: 0 });
    expect(sincronizarAvisoMesa(db, 'mesa-1').aviso).toBeNull();
  });

  it('retira el aviso activo cuando un plato vuelve a pendiente y lo difunde', () => {
    mesaCompleta();
    const aviso = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true }).aviso;

    db.prepare("UPDATE lineas_pedido SET estado = 'pendiente', listo_en = NULL WHERE id = 'linea-2'").run();

    const { respuesta, peticion, escrito } = clienteFalso();
    suscribir(peticion, respuesta);

    const resultado = sincronizarAvisoMesa(db, 'mesa-1');

    expect(resultado).toEqual({ completa: false, aviso: null });
    expect(obtenerAvisoVigente(db, 'mesa-1')).toBeNull();
    expect(escrito.join('')).toContain('event: aviso.retirado');
    expect(escrito.join('')).toContain('"mesa_id":"mesa-1"');
    expect(aviso.estado).toBe('activo');
  });

  it('no duplica el aviso mientras la mesa sigue completa', () => {
    mesaCompleta();
    const primero = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true }).aviso;
    const segundo = sincronizarAvisoMesa(db, 'mesa-1').aviso;

    expect(segundo.id).toBe(primero.id);
    expect(db.prepare('SELECT COUNT(*) AS total FROM avisos').get().total).toBe(1);
  });

  it('genera un aviso nuevo tras descartar y marcar otro plato listo', () => {
    mesaCompleta();
    const primero = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true }).aviso;
    db.prepare("UPDATE avisos SET estado = 'descartado', descartado_en = datetime('now') WHERE id = ?").run(
      primero.id,
    );

    const segundo = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true }).aviso;

    expect(segundo.id).not.toBe(primero.id);
    expect(segundo.estado).toBe('activo');
    expect(obtenerAvisoVigente(db, 'mesa-1').id).toBe(segundo.id);
  });

  it('mantiene oculto el aviso descartado si no se marca un plato nuevo', () => {
    mesaCompleta();
    const primero = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true }).aviso;
    db.prepare("UPDATE avisos SET estado = 'descartado', descartado_en = datetime('now') WHERE id = ?").run(
      primero.id,
    );

    const resultado = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: false });

    expect(resultado.completa).toBe(true);
    expect(resultado.aviso).toBeNull();
    expect(obtenerAvisoVigente(db, 'mesa-1').estado).toBe('descartado');
  });

  it('retira el aviso al confirmar una edición que añade un plato pendiente', () => {
    mesaCompleta();
    sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true });
    insertarLinea(db, { id: 'linea-nueva', pedidoId: 'pedido-1', platoId: 'plato-entrante-2' });

    const resultado = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: false });

    expect(resultado.completa).toBe(false);
    expect(obtenerAvisoVigente(db, 'mesa-1')).toBeNull();
    const listos = db
      .prepare("SELECT COUNT(*) AS total FROM lineas_pedido WHERE estado = 'listo'")
      .get().total;
    expect(listos).toBe(2);
  });

  it('genera avisos independientes cuando varias mesas están completas', () => {
    db = crearBase();
    insertarPedido(db, { id: 'pedido-1', mesa: 'mesa-1' });
    insertarLinea(db, { id: 'linea-1', pedidoId: 'pedido-1', estado: 'listo' });
    insertarPedido(db, { id: 'pedido-2', mesa: 'mesa-2' });
    insertarLinea(db, { id: 'linea-2', pedidoId: 'pedido-2', estado: 'listo' });

    const avisoUno = sincronizarAvisoMesa(db, 'mesa-1', { nuevoPlatoListo: true }).aviso;
    const avisoDos = sincronizarAvisoMesa(db, 'mesa-2', { nuevoPlatoListo: true }).aviso;

    expect(avisoUno.mesa_id).toBe('mesa-1');
    expect(avisoDos.mesa_id).toBe('mesa-2');
    expect(avisoUno.id).not.toBe(avisoDos.id);
  });
});

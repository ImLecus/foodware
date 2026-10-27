import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';
import { CartaService } from '../../src/services/cartaService.js';
describe('inmutabilidad precio histórico', () => {
  it('un cambio de precio no altera líneas ya pedidas', () => {
    const db = new Database(':memory:');
    db.exec(`
      CREATE TABLE partidas(codigo TEXT PRIMARY KEY, nombre TEXT);
      CREATE TABLE platos(id TEXT PRIMARY KEY, nombre TEXT, partida_codigo TEXT, precio_centimos INTEGER, activo INTEGER);
      CREATE TABLE usuarios(id TEXT PRIMARY KEY, nombre TEXT, rol TEXT);
      CREATE TABLE cuentas(id TEXT PRIMARY KEY, usuario_id TEXT, camarero_id TEXT, estado TEXT, cerrada_en TEXT, total_centimos INTEGER);
      CREATE TABLE lineas_pedido(id TEXT PRIMARY KEY, cuenta_id TEXT, plato_id TEXT, cantidad INTEGER, precio_unitario_centimos INTEGER, enviado_en TEXT);
    `);
    db.prepare("INSERT INTO partidas VALUES('principales','Principales')").run();
    db.prepare("INSERT INTO platos VALUES('p1','Paella','principales',1500,1)").run();
    db.prepare("INSERT INTO usuarios VALUES('c1','Camarero','camarero')").run();
    db.prepare("INSERT INTO cuentas VALUES('c1','c1','c1','cerrada','2026-10-19',1500)").run();
    db.prepare("INSERT INTO lineas_pedido VALUES('l1','c1','p1',1,1500,'2026-10-19T12:00:00')").run();

    const service = new CartaService(db);
    service.actualizarPlato('p1', { precio_centimos: 2000 });

    const linea = db.prepare('SELECT precio_unitario_centimos FROM lineas_pedido WHERE id = ?').get('l1');
    expect(linea.precio_unitario_centimos).toBe(1500);
  });
});

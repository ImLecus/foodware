import fs from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire('/home/lecus/Escritorio/IWEB/foodware/backend/package.json');
const Database = require('better-sqlite3');
const base = '/tmp/opencode/foodware-base.db';

function fixture(nombre) {
  const destino = `/tmp/opencode/foodware-${nombre}.db`;
  fs.copyFileSync(base, destino);
  const db = new Database(destino);
  db.pragma('foreign_keys = OFF');
  return { db, destino };
}

// 1. Sin historial: no hay ninguna cuenta cerrada.
{
  const { db, destino } = fixture('nohist');
  db.exec(`
    DELETE FROM tickets;
    DELETE FROM cuentas_parte_consumos;
    DELETE FROM cuentas_partes;
    DELETE FROM cuentas;
  `);
  db.close();
  console.log(destino);
}

// 2. Historial existe, pero el día anterior no tuvo ventas.
{
  const { db, destino } = fixture('sinbase');
  db.prepare("UPDATE cuentas SET cerrada_en = '2026-11-14 12:00:00', abierta_en = '2026-11-14 10:00:00' WHERE id = 'cuenta-anteayer-1'").run();
  db.close();
  console.log(destino);
}

// 3. Cuenta abierta por un camarero y cerrada por otro.
{
  const { db, destino } = fixture('atribucion');
  db.prepare("UPDATE pedidos SET camarero_id = 'camarero-2' WHERE id = 'pedido-historico-1'").run();
  db.prepare("UPDATE cuentas SET camarero_id = 'camarero-1' WHERE id = 'cuenta-ayer-1'").run();
  db.close();
  console.log(destino);
}

// 4. Cuenta dividida cerrada en un día completado.
{
  const { db, destino } = fixture('dividida');
  db.prepare("UPDATE cuentas SET modo_division = 'iguales' WHERE id = 'cuenta-ayer-2'").run();
  db.prepare(`
    INSERT INTO cuentas_partes (id, cuenta_id, orden, comensal, importe_centimos, estado, pagada_en)
    VALUES ('parte-demo-1', 'cuenta-ayer-2', 1, 'Parte 1', 1800, 'pagada', '2026-11-16 12:00:00')
  `).run();
  db.prepare(`
    INSERT INTO cuentas_partes (id, cuenta_id, orden, comensal, importe_centimos, estado, pagada_en)
    VALUES ('parte-demo-2', 'cuenta-ayer-2', 2, 'Parte 2', 1800, 'pagada', '2026-11-16 12:00:00')
  `).run();
  db.close();
  console.log(destino);
}

// 5. Plato renombrado después de venderse: el histórico conserva el nombre viejo.
{
  const { db, destino } = fixture('historico-nombre');
  db.prepare("UPDATE platos SET nombre = 'Tarta de queso casera' WHERE id = 'plato-6'").run();
  db.prepare("UPDATE lineas_pedido SET nombre_plato = 'Tarta de queso', partida_codigo = 'postres' WHERE plato_id = 'plato-6'").run();
  db.close();
  console.log(destino);
}

// 6. Sin pedidos abiertos: estados vacíos de cocina, señales y cuentas.
{
  const { db, destino } = fixture('vacio');
  db.prepare("UPDATE pedidos SET estado = 'cerrada' WHERE estado IN ('en_curso', 'enviada')").run();
  db.prepare("UPDATE mesas SET estado = 'libre'").run();
  db.close();
  console.log(destino);
}

// 7. Cierre de hoy: el dashboard no debe mostrar datos parciales del día en curso.
{
  const { db, destino } = fixture('hoycerrada');
  db.prepare(`
    INSERT INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en, modo_division, camarero_id)
    VALUES ('cuenta-hoy-demo', 'mesa-20', 'cerrada', 5000, datetime('now'), datetime('now'), 'unico', 'camarero-1')
  `).run();
  db.close();
  console.log(destino);
}

import { createRequire } from 'node:module';

const require = createRequire('/home/lecus/Escritorio/IWEB/foodware/backend/package.json');
const Database = require('better-sqlite3');

const db = new Database('/home/lecus/Escritorio/IWEB/foodware/backend/data/foodware.db');

// Los pedidos históricos del seed quedaron como 'enviada' y contaminaban la
// vista de cocina con pedidos de días anteriores.
db.prepare("UPDATE pedidos SET estado = 'cerrada' WHERE id LIKE 'pedido-historico-%'").run();

// La Mesa 2 tenía dos pedidos enviados. Dejamos el pedido preparado para el
// ejemplo de edición y cerramos el pedido de demostración duplicado.
db.prepare("UPDATE pedidos SET estado = 'cerrada' WHERE id = 'pedido-demo-2'").run();

// Estado base limpio para las mesas de trabajo.
for (let i = 10; i <= 20; i += 1) {
  db.prepare("UPDATE mesas SET estado = 'libre' WHERE id = ?").run(`mesa-${i}`);
}

// Las mesas 1 a 9 conservan sus pedidos de demostración.
const resumen = db
  .prepare(
    `SELECT p.id, p.mesa_id, p.estado, p.modificado,
            COUNT(l.id) AS lineas,
            SUM(CASE WHEN l.estado = 'pendiente' THEN 1 ELSE 0 END) AS pendientes
       FROM pedidos p
       LEFT JOIN lineas_pedido l ON l.pedido_id = p.id
      WHERE p.estado IN ('en_curso', 'enviada')
      GROUP BY p.id
      ORDER BY p.mesa_id, p.id`,
  )
  .all();
console.log(resumen);
db.close();

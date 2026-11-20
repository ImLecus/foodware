import fs from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire('/home/lecus/Escritorio/IWEB/foodware/backend/package.json');
const Database = require('better-sqlite3');
const destino = '/tmp/opencode/foodware-aviso.db';
fs.copyFileSync('/tmp/opencode/foodware-base.db', destino);
const db = new Database(destino);
db.prepare(`
  UPDATE lineas_pedido
     SET estado = 'listo', listo_en = datetime('now')
   WHERE pedido_id = (
     SELECT id FROM pedidos WHERE mesa_id = 'mesa-9' AND estado = 'enviada' LIMIT 1
   )
`).run();
db.prepare(`
  INSERT INTO avisos (id, mesa_id, estado, generado_en)
  VALUES ('aviso-demo-9', 'mesa-9', 'activo', datetime('now'))
`).run();
db.close();
console.log(destino);

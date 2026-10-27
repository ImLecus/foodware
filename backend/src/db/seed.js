import { hashPassword } from '../auth/password.js';
import { diaAnterior, fechaEnMadrid } from '../services/dayTime.js';
import { createDb } from './index.js';

const db = createDb();
const hashDemo = hashPassword('demo1234');

const partidas = [
  { codigo: 'entrantes', nombre: 'Entrantes', orden: 1 },
  { codigo: 'principales', nombre: 'Principales', orden: 2 },
  { codigo: 'postres', nombre: 'Postres', orden: 3 },
];

const usuarios = [
  { id: 'camarero-1', nombre: 'Ana (camarera)', rol: 'camarero', partida: null },
  { id: 'camarero-2', nombre: 'Luis (camarero)', rol: 'camarero', partida: null },
  { id: 'cocinero-entrantes', nombre: 'Marta (entrantes)', rol: 'cocinero', partida: 'entrantes' },
  {
    id: 'cocinero-principales',
    nombre: 'Pablo (principales)',
    rol: 'cocinero',
    partida: 'principales',
  },
  { id: 'cocinero-postres', nombre: 'Lucía (postres)', rol: 'cocinero', partida: 'postres' },
  {
    id: 'cocinero-sin-partida',
    nombre: 'Cocinero sin partida',
    rol: 'cocinero',
    partida: null,
  },
  { id: 'encargado-1', nombre: 'Carmen (encargada)', rol: 'encargado', partida: null },
  { id: 'admin-1', nombre: 'Administración', rol: 'administrador', partida: null },
];

const mesas = [
  { id: 'mesa-1', identificador: 'Mesa 1' },
  { id: 'mesa-2', identificador: 'Mesa 2' },
  { id: 'mesa-3', identificador: 'Mesa 3' },
  { id: 'mesa-4', identificador: 'Mesa 4' },
  { id: 'mesa-5', identificador: 'Mesa 5' },
  { id: 'mesa-6', identificador: 'Mesa 6' },
  { id: 'mesa-7', identificador: 'Mesa 7' },
  { id: 'mesa-8', identificador: 'Mesa 8' },
  { id: 'mesa-9', identificador: 'Mesa 9' },
  { id: 'mesa-10', identificador: 'Mesa 10' },
  { id: 'mesa-11', identificador: 'Mesa 11' },
  { id: 'mesa-12', identificador: 'Mesa 12' },
  { id: 'mesa-13', identificador: 'Mesa 13' },
  { id: 'mesa-14', identificador: 'Mesa 14' },
  { id: 'mesa-15', identificador: 'Mesa 15' },
  { id: 'mesa-16', identificador: 'Mesa 16' },
  { id: 'mesa-17', identificador: 'Mesa 17' },
  { id: 'mesa-18', identificador: 'Mesa 18' },
  { id: 'mesa-19', identificador: 'Mesa 19' },
  { id: 'mesa-20', identificador: 'Mesa 20' },
];

const platos = [
  { id: 'plato-1', nombre: 'Croquetas de jamón', partida: 'entrantes', precio: 850 },
  { id: 'plato-2', nombre: 'Ensalada mixta', partida: 'entrantes', precio: 700 },
  { id: 'plato-3', nombre: 'Paella de marisco', partida: 'principales', precio: 1800 },
  { id: 'plato-4', nombre: 'Entrecot a la plancha', partida: 'principales', precio: 2200 },
  { id: 'plato-5', nombre: 'Merluza al horno', partida: 'principales', precio: 1650 },
  { id: 'plato-6', nombre: 'Tarta de queso', partida: 'postres', precio: 600 },
  { id: 'plato-7', nombre: 'Flan casero', partida: 'postres', precio: 450 },
  { id: 'plato-8', nombre: 'Helado de vainilla', partida: 'postres', precio: 500 },
];

const ingredientes = [
  { id: 'ing-1', nombre: 'Jamón', estado: 'disponible' },
  { id: 'ing-2', nombre: 'Marisco', estado: 'disponible' },
  { id: 'ing-3', nombre: 'Queso', estado: 'disponible' },
  { id: 'ing-4', nombre: 'Leche', estado: 'disponible' },
  { id: 'ing-5', nombre: 'Harina', estado: 'disponible' },
  { id: 'ing-6', nombre: 'Huevo', estado: 'disponible' },
];

const asociaciones = [
  ['plato-1', 'ing-1'],
  ['plato-1', 'ing-5'],
  ['plato-1', 'ing-6'],
  ['plato-3', 'ing-2'],
  ['plato-6', 'ing-3'],
  ['plato-6', 'ing-4'],
  ['plato-6', 'ing-6'],
];

const hoy = fechaEnMadrid();
const ayer = diaAnterior(hoy);
const anteayer = diaAnterior(ayer);

// Cuentas cerradas en dos días naturales distintos para probar el total y la
// comparación del dashboard. Las fechas se recalculan en cada carga.

// Pedido ya enviado de ejemplo para poder probar la edición (historia 002).
const pedidosEnviados = [
  {
    id: 'pedido-enviado-1',
    mesaId: 'mesa-2',
    camareroId: 'camarero-2',
    lineas: [
      { id: 'linea-enviada-1', platoId: 'plato-1', cantidad: 2, precio: 850 },
      { id: 'linea-enviada-2', platoId: 'plato-3', cantidad: 1, precio: 1800 },
      { id: 'linea-enviada-3', platoId: 'plato-6', cantidad: 1, precio: 600 },
    ],
  },
];

const cargar = db.transaction(() => {
  const insertarPartida = db.prepare(
    'INSERT OR IGNORE INTO partidas (codigo, nombre, orden) VALUES (?, ?, ?)',
  );
  for (const partida of partidas) {
    insertarPartida.run(partida.codigo, partida.nombre, partida.orden);
  }

  const insertarUsuario = db.prepare(
    `INSERT INTO usuarios (id, nombre, rol, partida_codigo, password_hash)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET
       nombre = excluded.nombre,
       rol = excluded.rol,
       partida_codigo = excluded.partida_codigo,
       password_hash = excluded.password_hash`,
  );
  for (const usuario of usuarios) {
    insertarUsuario.run(usuario.id, usuario.nombre, usuario.rol, usuario.partida, hashDemo);
  }

  const insertarMesa = db.prepare(
    'INSERT OR IGNORE INTO mesas (id, identificador, estado) VALUES (?, ?, ?)',
  );
  for (const mesa of mesas) {
    insertarMesa.run(mesa.id, mesa.identificador, 'libre');
  }

  const insertarPlato = db.prepare(
    'INSERT OR IGNORE INTO platos (id, nombre, partida_codigo, precio_centimos) VALUES (?, ?, ?, ?)',
  );
  for (const plato of platos) {
    insertarPlato.run(plato.id, plato.nombre, plato.partida, plato.precio);
  }

  const insertarIngrediente = db.prepare(
    'INSERT OR IGNORE INTO ingredientes (id, nombre, estado) VALUES (?, ?, ?)',
  );
  for (const ingrediente of ingredientes) {
    insertarIngrediente.run(ingrediente.id, ingrediente.nombre, ingrediente.estado);
  }

  const insertarAsociacion = db.prepare(
    'INSERT OR IGNORE INTO plato_ingredientes (plato_id, ingrediente_id) VALUES (?, ?)',
  );
  for (const [platoId, ingredienteId] of asociaciones) {
    insertarAsociacion.run(platoId, ingredienteId);
  }

  const insertarCuenta = db.prepare(
    `INSERT OR REPLACE INTO cuentas (id, mesa_id, camarero_id, estado, total_centimos, abierta_en, cerrada_en)
     VALUES (?, ?, ?, 'cerrada', ?, ?, ?)`,
  );
  insertarCuenta.run(
    'cuenta-ayer-1',
    'mesa-1',
    'camarero-1',
    35500,
    `${ayer} 10:00:00`,
    `${ayer} 12:00:00`,
  );
  insertarCuenta.run(
    'cuenta-ayer-2',
    'mesa-2',
    'camarero-2',
    22000,
    `${ayer} 10:00:00`,
    `${ayer} 12:00:00`,
  );
  insertarCuenta.run(
    'cuenta-anteayer-1',
    'mesa-3',
    'camarero-1',
    18000,
    `${anteayer} 10:00:00`,
    `${anteayer} 12:00:00`,
  );
  // Mesa con una cuenta histórica y una comanda nueva: demuestra la reutilización.
  insertarCuenta.run(
    'cuenta-reutilizada',
    'mesa-9',
    'camarero-1',
    1200,
    `${ayer} 09:00:00`,
    `${ayer} 09:30:00`,
  );

  const insertarPedido = db.prepare(
    `INSERT OR IGNORE INTO pedidos (id, mesa_id, camarero_id, estado, creado_en, enviado_en)
     VALUES (?, ?, ?, 'enviada', datetime('now'), datetime('now'))`,
  );
  const insertarLinea = db.prepare(
    `INSERT OR IGNORE INTO lineas_pedido
       (id, pedido_id, plato_id, cantidad, precio_centimos)
     VALUES (?, ?, ?, ?, ?)`,
  );
  const ocuparMesa = db.prepare("UPDATE mesas SET estado = 'ocupada' WHERE id = ?");

  for (const pedido of pedidosEnviados) {
    insertarPedido.run(pedido.id, pedido.mesaId, pedido.camareroId);
    for (const linea of pedido.lineas) {
      insertarLinea.run(linea.id, pedido.id, linea.platoId, linea.cantidad, linea.precio);
    }
    ocuparMesa.run(pedido.mesaId);
  }
});

// Momento compartido para demostrar el desempate por identificador (FR-004).
const enviadoEnEmpate = db
  .prepare("SELECT datetime('now', '-25 minutes') AS momento")
  .get().momento;

const pedidosDemo = [
  {
    id: 'pedido-demo-1',
    mesa: 'mesa-1',
    camarero: 'camarero-1',
    enviadoEn: '-35 minutes',
    modificado: 0,
    lineas: [
      { id: 'linea-demo-1', plato: 'plato-1', cantidad: 2, estado: 'pendiente' },
      { id: 'linea-demo-2', plato: 'plato-3', cantidad: 1, estado: 'pendiente' },
      { id: 'linea-demo-3', plato: 'plato-6', cantidad: 1, estado: 'pendiente' },
    ],
  },
  {
    id: 'pedido-demo-2',
    mesa: 'mesa-2',
    camarero: 'camarero-2',
    enviadoEn: '-20 minutes',
    modificado: 0,
    lineas: [
      { id: 'linea-demo-4', plato: 'plato-2', cantidad: 1, estado: 'listo' },
      { id: 'linea-demo-5', plato: 'plato-4', cantidad: 1, estado: 'pendiente' },
    ],
  },
  {
    id: 'pedido-demo-3',
    mesa: 'mesa-3',
    camarero: 'camarero-1',
    enviadoEn: '-10 minutes',
    modificado: 1,
    lineas: [
      { id: 'linea-demo-6', plato: 'plato-5', cantidad: 2, estado: 'pendiente' },
      { id: 'linea-demo-7', plato: 'plato-7', cantidad: 2, estado: 'pendiente' },
    ],
  },
  {
    id: 'pedido-demo-4',
    mesa: 'mesa-4',
    camarero: 'camarero-2',
    enviadoEn: '-5 minutes',
    modificado: 0,
    lineas: [
      { id: 'linea-demo-8', plato: 'plato-8', cantidad: 1, estado: 'pendiente' },
      { id: 'linea-demo-9', plato: 'plato-1', cantidad: 1, estado: 'pendiente' },
    ],
  },
  {
    id: 'pedido-demo-5',
    mesa: 'mesa-5',
    camarero: 'camarero-1',
    enviadoEn: '-15 minutes',
    modificado: 0,
    lineas: [
      { id: 'linea-demo-10', plato: 'plato-2', cantidad: 1, estado: 'listo' },
      { id: 'linea-demo-11', plato: 'plato-4', cantidad: 1, estado: 'pendiente' },
    ],
  },
  {
    id: 'pedido-demo-6',
    mesa: 'mesa-6',
    camarero: 'camarero-1',
    enviadoEn: '-75 minutes',
    modificado: 0,
    lineas: [
      { id: 'linea-demo-12', plato: 'plato-2', cantidad: 1, estado: 'pendiente' },
      { id: 'linea-demo-13', plato: 'plato-4', cantidad: 1, estado: 'pendiente' },
    ],
  },
  {
    id: 'pedido-demo-7',
    mesa: 'mesa-7',
    camarero: 'camarero-2',
    enviadoEnExacto: enviadoEnEmpate,
    modificado: 0,
    lineas: [
      { id: 'linea-demo-14', plato: 'plato-1', cantidad: 1, estado: 'pendiente' },
      { id: 'linea-demo-15', plato: 'plato-3', cantidad: 1, estado: 'pendiente' },
    ],
  },
  {
    id: 'pedido-reutilizado',
    mesa: 'mesa-9',
    camarero: 'camarero-1',
    enviadoEn: '-5 minutes',
    modificado: 0,
    lineas: [{ id: 'linea-reutilizada-1', plato: 'plato-2', cantidad: 1, estado: 'pendiente' }],
  },
  {
    id: 'pedido-demo-8',
    mesa: 'mesa-8',
    camarero: 'camarero-1',
    enviadoEnExacto: enviadoEnEmpate,
    modificado: 0,
    lineas: [
      { id: 'linea-demo-16', plato: 'plato-2', cantidad: 1, estado: 'pendiente' },
      { id: 'linea-demo-17', plato: 'plato-5', cantidad: 1, estado: 'pendiente' },
    ],
  },
];

const precios = new Map(platos.map((plato) => [plato.id, plato.precio]));

const cargarDemo = db.transaction(() => {
  const insertarPedido = db.prepare(`
    INSERT OR IGNORE INTO pedidos
      (id, mesa_id, camarero_id, estado, modificado, enviado_en, modificado_en)
    VALUES (?, ?, ?, 'enviada', ?, datetime('now', ?),
            CASE WHEN ? = 1 THEN datetime('now', ?) ELSE NULL END)
  `);
  const insertarPedidoExacto = db.prepare(`
    INSERT OR IGNORE INTO pedidos
      (id, mesa_id, camarero_id, estado, modificado, enviado_en, modificado_en)
    VALUES (?, ?, ?, 'enviada', ?, ?, CASE WHEN ? = 1 THEN ? ELSE NULL END)
  `);
  const insertarLinea = db.prepare(`
    INSERT OR IGNORE INTO lineas_pedido
      (id, pedido_id, plato_id, cantidad, precio_centimos, estado, listo_en)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const ocuparMesa = db.prepare(`
    UPDATE mesas SET estado = 'ocupada' WHERE id = ? AND estado = 'libre'
  `);

  for (const pedido of pedidosDemo) {
    if (pedido.enviadoEnExacto) {
      insertarPedidoExacto.run(
        pedido.id,
        pedido.mesa,
        pedido.camarero,
        pedido.modificado,
        pedido.enviadoEnExacto,
        pedido.modificado,
        pedido.enviadoEnExacto,
      );
    } else {
      insertarPedido.run(
        pedido.id,
        pedido.mesa,
        pedido.camarero,
        pedido.modificado,
        pedido.enviadoEn,
        pedido.modificado,
        pedido.enviadoEn,
      );
    }
    ocuparMesa.run(pedido.mesa);

    for (const linea of pedido.lineas) {
      insertarLinea.run(
        linea.id,
        pedido.id,
        linea.plato,
        linea.cantidad,
        precios.get(linea.plato),
        linea.estado,
        linea.estado === 'listo' ? new Date().toISOString() : null,
      );
    }
  }
});

cargar();
cargarDemo();
db.close();

console.log(
  'Datos cargados: partidas, usuarios, mesas, carta, ingredientes, cuentas y pedidos de ejemplo.',
);

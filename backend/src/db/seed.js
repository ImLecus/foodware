import { diaAnterior, fechaEnMadrid } from '../services/dayTime.js';
import { createDb } from './index.js';

const db = createDb();

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
const cuentas = [
  { id: 'cuenta-ayer-1', mesa: 'mesa-1', total: 35500, dia: ayer },
  { id: 'cuenta-ayer-2', mesa: 'mesa-2', total: 22000, dia: ayer },
  { id: 'cuenta-anteayer-1', mesa: 'mesa-3', total: 18000, dia: anteayer },
];

const cargar = db.transaction(() => {
  const insertarPartida = db.prepare(
    'INSERT OR IGNORE INTO partidas (codigo, nombre, orden) VALUES (?, ?, ?)',
  );
  for (const partida of partidas) {
    insertarPartida.run(partida.codigo, partida.nombre, partida.orden);
  }

  const insertarUsuario = db.prepare(
    'INSERT OR IGNORE INTO usuarios (id, nombre, rol, partida_codigo) VALUES (?, ?, ?, ?)',
  );
  for (const usuario of usuarios) {
    insertarUsuario.run(usuario.id, usuario.nombre, usuario.rol, usuario.partida);
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
    `INSERT OR REPLACE INTO cuentas (id, mesa_id, estado, total_centimos, abierta_en, cerrada_en)
     VALUES (?, ?, 'cerrada', ?, ?, ?)`,
  );
  for (const cuenta of cuentas) {
    insertarCuenta.run(
      cuenta.id,
      cuenta.mesa,
      cuenta.total,
      `${cuenta.dia} 10:00:00`,
      `${cuenta.dia} 12:00:00`,
    );
  }
});

cargar();
db.close();

console.log('Datos de referencia cargados: partidas, usuarios, mesas, carta e ingredientes.');

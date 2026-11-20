import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  pausa,
  rotulo,
} from './lib.mjs';

await resetDb('/tmp/opencode/foodware-base.db');
await iniciarGrabacion();
const handle = await crearContexto({ nombre: '01g-acceso-denegado', usuario: 'camarero-1' });
const page = await nuevaPagina(handle, '/admin');
await rotulo(page, 'Control de acceso por rol', 'Un camarero no puede entrar en la gestión de la carta', 3000);
await pausa(page, 1200);
await cerrarContexto(handle);
await terminarGrabacion();

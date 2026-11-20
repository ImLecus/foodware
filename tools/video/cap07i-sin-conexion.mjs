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
const handle = await crearContexto({ nombre: '07i-sin-conexion', usuario: 'encargado-1' });
const page = await nuevaPagina(handle, '/dashboard');
await page.route('**/api/reports/daily*', (route) => route.abort());
await page.reload();
await pausa(page, 1600);
await rotulo(page, 'Dashboard sin conexión', 'Aviso de que no se ha podido cargar el informe del día', 3000);
await pausa(page, 1000);
await page.unroute('**/api/reports/daily*');
await cerrarContexto(handle);
await terminarGrabacion();

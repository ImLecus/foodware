import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  pausa,
  rotulo,
  abrirMesa,
  anadirPlato,
  ejecutarSql,
  ir,
} from './lib.mjs';

await resetDb('/tmp/opencode/foodware-base.db');
await iniciarGrabacion();
const handle = await crearContexto({ nombre: '09k-cuenta-cambiada', usuario: 'camarero-1' });
const page = await nuevaPagina(handle, '/sala');

await abrirMesa(page, 13);
await anadirPlato(page, 'Croquetas de jamón', 2);
await anadirPlato(page, 'Paella de marisco', 1);
await pausa(page, 500);
await page.getByRole('button', { name: 'Confirmar pedido' }).click();
await pausa(page, 1200);
await ejecutarSql(`
  UPDATE lineas_pedido
     SET estado = 'listo', listo_en = datetime('now')
   WHERE pedido_id = (
     SELECT id FROM pedidos WHERE mesa_id = 'mesa-13' AND estado = 'enviada' LIMIT 1
   );
`);
await rotulo(page, 'Cuenta preparada', 'Comanda enviada y platos listos para cobrar', 2400);

await ir(page, '/cuentas?mesa=mesa-13');
await page.getByRole('button', { name: 'Partes iguales' }).click();
await page.locator('#numero-partes').fill('2');
await pausa(page, 800);
await page.getByRole('button', { name: 'Confirmar división' }).click();
await pausa(page, 1200);
await rotulo(page, 'División confirmada', 'La cuenta queda dividida en dos partes', 2400);

await rotulo(page, 'Mientras tanto, en otra pantalla', 'Se añade un plato al pedido ya enviado', 2800);
const pedidoId = await page.evaluate(async () => {
  const respuesta = await fetch('http://localhost:3000/api/mesas', { credentials: 'include' });
  const mesas = await respuesta.json();
  return mesas.find((mesa) => mesa.id === 'mesa-13')?.pedido_enviado_id ?? null;
});
if (!pedidoId) throw new Error('No se encontró el pedido de Mesa 13');
await page.evaluate(async (id) => {
  const opciones = { method: 'POST', credentials: 'include' };
  const abrir = await fetch(`http://localhost:3000/api/pedidos/${id}/editar`, opciones);
  if (!abrir.ok) throw new Error(`No se pudo abrir la edición: ${abrir.status}`);
  const linea = await fetch(`http://localhost:3000/api/pedidos/${id}/lineas`, {
    ...opciones,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plato_id: 'plato-6', cantidad: 1, indicaciones: null }),
  });
  if (!linea.ok) throw new Error(`No se pudo añadir la línea: ${linea.status}`);
  const enviar = await fetch(`http://localhost:3000/api/pedidos/${id}/enviar-cambios`, opciones);
  if (!enviar.ok) throw new Error(`No se pudieron enviar los cambios: ${enviar.status}`);
}, pedidoId);
await pausa(page, 1000);
await rotulo(page, 'La cuenta ha cambiado', 'El total ya no coincide con la división confirmada', 2800);

await page.reload();
await pausa(page, 1800);
await rotulo(
  page,
  'División descartada',
  'El nuevo total es 41,00 € y hay que rehacer la división sobre la cuenta actualizada',
  3800,
);
await pausa(page, 1400);
await cerrarContexto(handle);
await terminarGrabacion();

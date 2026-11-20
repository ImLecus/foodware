import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  pausa,
  rotulo,
  ejecutarSql,
  seleccionarMesa,
  abrirMesa,
  anadirPlato,
  tarjetaEditor,
} from './lib.mjs';

await iniciarGrabacion();
const base = '/tmp/opencode/foodware-base.db';

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

async function conPagina(nombre, fixture, usuario, ruta, fn) {
  await resetDb(fixture);
  const handle = await crearContexto({ nombre, usuario });
  try {
    const page = await nuevaPagina(handle, ruta);
    await fn(page, handle);
  } finally {
    await guardar(handle);
  }
}

// S-18: sala sin conexión.
await conPagina('09a-sala-offline', base, 'camarero-1', '/sala', async (page, handle) => {
  await handle.context.setOffline(true);
  await pausa(page, 1400);
  await rotulo(page, 'Sala sin conexión', 'No se puede confirmar ni modificar; lo anotado se conserva', 3000);
  await pausa(page, 1000);
  await handle.context.setOffline(false);
  await pausa(page, 1400);
  await rotulo(page, 'Conexión recuperada', 'La sala vuelve a estar operativa', 2400);
});

// E-21: editor sin conexión.
await conPagina('09b-editor-offline', base, 'camarero-1', '/sala', async (page, handle) => {
  await seleccionarMesa(page, 2);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1200);
  await handle.context.setOffline(true);
  await pausa(page, 1400);
  await rotulo(page, 'Editor sin conexión', 'No se pueden guardar ni enviar cambios; lo escrito se conserva', 3000);
  await pausa(page, 1000);
  await handle.context.setOffline(false);
  await pausa(page, 1200);
});

// K-17: cocina sin conexión.
await conPagina('09c-cocina-offline', base, 'cocinero-entrantes', '/cocina', async (page, handle) => {
  await handle.context.setOffline(true);
  await pausa(page, 1400);
  await rotulo(page, 'Cocina sin conexión', 'La lista queda marcada como no actualizada; el tiempo sigue avanzando', 3200);
  await pausa(page, 1000);
  await handle.context.setOffline(false);
  await pausa(page, 1400);
});

// K-12: fallo de la carga inicial y reintento.
await resetDb(base);
{
  const handle = await crearContexto({ nombre: '09d-cocina-error', usuario: 'cocinero-entrantes' });
  const page = await handle.context.newPage();
  await page.route('**/api/partidas/*/pedidos-pendientes*', (route) => route.abort());
  await page.goto('http://localhost:5173/cocina');
  await pausa(page, 1600);
  await rotulo(page, 'Error al cargar los pedidos', 'Mensaje de error con acción Reintentar; no se muestra el estado vacío', 3200);
  await pausa(page, 1000);
  await page.unroute('**/api/partidas/*/pedidos-pendientes*');
  await page.getByRole('button', { name: 'Reintentar' }).click();
  await pausa(page, 1600);
  await rotulo(page, 'Reintento correcto', 'La lista se recupera sin recargar la aplicación', 2600);
  await guardar(handle);
}

// G-16 y G-25: señales sin conexión.
await conPagina('09e-senales-offline', '/tmp/opencode/foodware-aviso.db', 'camarero-1', '/sala/estado', async (page, handle) => {
  await rotulo(page, 'Aviso de mesa completa', 'Mesa 9 tiene todos los platos listos', 2600);
  await pausa(page, 1000);
  await handle.context.setOffline(true);
  await pausa(page, 1400);
  await rotulo(page, 'Señales sin conexión', 'La información no está actualizada y Descartar aviso queda deshabilitado', 3400);
  await pausa(page, 1200);
  await handle.context.setOffline(false);
  await pausa(page, 1500);
  await rotulo(page, 'Resincronización', 'Al volver la conexión, el estado de sala se recupera', 2600);
});

// C-27: cuentas sin conexión.
await conPagina('09f-cuentas-offline', base, 'camarero-1', '/cuentas?mesa=mesa-9', async (page, handle) => {
  await handle.context.setOffline(true);
  await pausa(page, 1400);
  await rotulo(page, 'Cuentas sin conexión', 'No se puede cerrar, dividir, pagar ni deshacer; la cuenta se conserva', 3400);
  await pausa(page, 1000);
  await handle.context.setOffline(false);
  await pausa(page, 1300);
});

// C-33: error al cargar las mesas de cuentas.
await resetDb(base);
{
  const handle = await crearContexto({ nombre: '09g-cuentas-error', usuario: 'camarero-1' });
  const page = await handle.context.newPage();
  await page.route('**/api/mesas*', (route) => route.abort());
  await page.goto('http://localhost:5173/cuentas');
  await pausa(page, 1600);
  await rotulo(page, 'Error al cargar las mesas', 'Aviso de error; no se presenta una lista vacía falsa', 3000);
  await pausa(page, 1000);
  await guardar(handle);
}

// M-24: error al cargar la administración.
await resetDb(base);
{
  const handle = await crearContexto({ nombre: '09h-admin-error', usuario: 'admin-1' });
  const page = await handle.context.newPage();
  await page.route('**/api/admin/**', (route) => route.abort());
  await page.goto('http://localhost:5173/admin');
  await pausa(page, 1600);
  await rotulo(page, 'Error al cargar la carta', 'La gestión avisa del fallo en lugar de mostrar una tabla vacía', 3000);
  await pausa(page, 1000);
  await guardar(handle);
}

// A-15: sesión caducada durante una operación.
await resetDb(base);
{
  const handle = await crearContexto({ nombre: '09i-sesion-expirada', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await rotulo(page, 'Sesión caducada', 'La sesión deja de ser válida por inactividad', 2800);
  ejecutarSql('DELETE FROM sesiones;');
  await pausa(page, 400);
  await seleccionarMesa(page, 2);
  await pausa(page, 1600);
  await rotulo(page, 'Vuelta al login', 'La operación protegida devuelve 401 y pide volver a acceder', 3000);
  await pausa(page, 1000);
  await guardar(handle);
}

// E-14: bloqueo de edición expirado.
await resetDb(base);
{
  const handle = await crearContexto({ nombre: '09j-bloqueo-expirado', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await seleccionarMesa(page, 2);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1200);
  const editor = tarjetaEditor(page);
  await rotulo(page, 'Bloqueo de edición activo', 'El camarero mantiene el pedido bloqueado', 2600);
  ejecutarSql(`
    UPDATE bloqueos_edicion
       SET expira_en = datetime('now', '-1 minute'),
           ultima_actividad = datetime('now', '-20 minutes')
     WHERE pedido_id = (
       SELECT id FROM pedidos WHERE mesa_id = 'mesa-2' AND estado = 'enviada' LIMIT 1
     );
  `);
  await editor.getByLabel('Cantidad de Croquetas de jamón').fill('3');
  await pausa(page, 1600);
  await rotulo(page, 'Bloqueo expirado', 'Al guardar se avisa de que hay que reabrir la edición', 3200);
  await pausa(page, 1000);
  const reabrir = page.getByRole('button', { name: 'Reabrir edición' });
  if (await reabrir.count()) {
    await reabrir.click();
    await pausa(page, 1400);
    await rotulo(page, 'Reabrir edición', 'El camarero recupera el bloqueo y puede continuar', 2800);
  }
  await guardar(handle);
}

// C-22: la cuenta cambia después de confirmar la división.
await resetDb(base);
{
  const handle = await crearContexto({ nombre: '09k-cuenta-cambiada', usuario: 'camarero-1' });
  const pageSala = await nuevaPagina(handle, '/sala');
  await abrirMesa(pageSala, 13);
  await anadirPlato(pageSala, 'Croquetas de jamón', 2);
  await anadirPlato(pageSala, 'Paella de marisco', 1);
  await pausa(pageSala, 500);
  await pageSala.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(pageSala, 1200);
  ejecutarSql(`
    UPDATE lineas_pedido
       SET estado = 'listo', listo_en = datetime('now')
     WHERE pedido_id = (
       SELECT id FROM pedidos WHERE mesa_id = 'mesa-13' AND estado = 'enviada' LIMIT 1
     );
  `);
  await rotulo(pageSala, 'Cuenta preparada', 'Comanda enviada y platos listos para cobrar', 2400);

  const pageCuentas = await handle.context.newPage();
  await pageCuentas.goto('http://localhost:5173/cuentas?mesa=mesa-13');
  await pausa(pageCuentas, 1400);
  await pageCuentas.getByRole('button', { name: 'Partes iguales' }).click();
  await pageCuentas.locator('#numero-partes').fill('2');
  await pausa(pageCuentas, 800);
  await pageCuentas.getByRole('button', { name: 'Confirmar división' }).click();
  await pausa(pageCuentas, 1200);
  await rotulo(pageCuentas, 'División confirmada', 'La cuenta queda dividida en dos partes', 2400);

  await pageSala.bringToFront();
  await seleccionarMesa(pageSala, 13);
  await pageSala.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(pageSala, 1200);
  const editor = tarjetaEditor(pageSala);
  await editor.getByRole('button', { name: 'Añadir Tarta de queso' }).click();
  await pausa(pageSala, 1200);
  await editor.getByRole('button', { name: 'Enviar cambios' }).click();
  await pausa(pageSala, 1300);
  await rotulo(pageSala, 'La cuenta ha cambiado', 'Se añade un plato después de confirmar la división', 2600);

  await pageCuentas.bringToFront();
  await pausa(pageCuentas, 700);
  await pageCuentas.getByRole('button', { name: 'Marcar como pagada' }).first().click();
  await pausa(pageCuentas, 1600);
  await rotulo(pageCuentas, 'Total desactualizado', 'El pago se rechaza y la división se descarta para rehacerla', 3400);
  await pausa(pageCuentas, 1200);
  await guardar(handle);
}

// Estados vacíos.
await conPagina('09l-cocina-vacia', '/tmp/opencode/foodware-vacio.db', 'cocinero-entrantes', '/cocina', async (page) => {
  await rotulo(page, 'Partida sin pedidos pendientes', 'Estado vacío claro, sin pedidos de otras partidas', 3000);
  await pausa(page, 1200);
});

await conPagina('09m-senales-vacias', '/tmp/opencode/foodware-vacio.db', 'camarero-1', '/sala/estado', async (page) => {
  await rotulo(page, 'Sin mesas abiertas', 'La vista de señales muestra un estado vacío claro', 2800);
  await pausa(page, 1200);
});

await conPagina('09n-cuentas-vacias', '/tmp/opencode/foodware-vacio.db', 'camarero-1', '/cuentas', async (page) => {
  await rotulo(page, 'Sin mesas abiertas para cobrar', 'No se muestra una lista vacía sin explicación', 2800);
  await pausa(page, 1200);
});

await terminarGrabacion();

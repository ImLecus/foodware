import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  pausa,
  rotulo,
  pararBackend,
  arrancarBackend,
  seleccionarMesa,
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
    await fn(page);
  } finally {
    await guardar(handle);
  }
}

await conPagina('09a-sala-offline', base, 'camarero-1', '/sala', async (page) => {
  pararBackend();
  await pausa(page, 2600);
  await rotulo(page, 'Sala sin conexión', 'No se puede confirmar ni modificar; lo anotado se conserva', 3200);
  await pausa(page, 1000);
  await arrancarBackend();
  await pausa(page, 1800);
  await rotulo(page, 'Conexión recuperada', 'La sala vuelve a estar operativa', 2400);
});

await conPagina('09b-editor-offline', base, 'camarero-1', '/sala', async (page) => {
  await seleccionarMesa(page, 2);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1200);
  pararBackend();
  await pausa(page, 2600);
  await rotulo(page, 'Editor sin conexión', 'No se pueden guardar ni enviar cambios; lo escrito se conserva', 3200);
  await pausa(page, 1000);
  await arrancarBackend();
  await pausa(page, 1600);
});

await conPagina('09c-cocina-offline', base, 'cocinero-entrantes', '/cocina', async (page) => {
  pararBackend();
  await pausa(page, 2600);
  await rotulo(page, 'Cocina sin conexión', 'La lista queda marcada como no actualizada; el tiempo sigue avanzando', 3200);
  await pausa(page, 1000);
  await arrancarBackend();
  await pausa(page, 1800);
});

await conPagina('09e-senales-offline', '/tmp/opencode/foodware-aviso.db', 'camarero-1', '/sala/estado', async (page) => {
  await rotulo(page, 'Aviso de mesa completa', 'Mesa 9 tiene todos los platos listos', 2600);
  await pausa(page, 1000);
  pararBackend();
  await pausa(page, 2800);
  await rotulo(page, 'Señales sin conexión', 'La información no está actualizada y Descartar aviso queda deshabilitado', 3400);
  await pausa(page, 1200);
  await arrancarBackend();
  await pausa(page, 2000);
  await rotulo(page, 'Resincronización', 'Al volver la conexión, el estado de sala se recupera', 2600);
});

await conPagina('09f-cuentas-offline', base, 'camarero-1', '/cuentas?mesa=mesa-9', async (page) => {
  pararBackend();
  await pausa(page, 2600);
  await rotulo(page, 'Cuentas sin conexión', 'No se puede cerrar, dividir, pagar ni deshacer; la cuenta se conserva', 3400);
  await pausa(page, 1000);
  await arrancarBackend();
  await pausa(page, 1800);
});

await terminarGrabacion();

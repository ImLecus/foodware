import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  pausa,
  rotulo,
  seleccionarMesa,
  tarjetaEditor,
  tarjetaPedidoCocina,
  ir,
} from './lib.mjs';

const avisoFixture = '/tmp/opencode/foodware-aviso.db';
await iniciarGrabacion();

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

// G-17 y G-18: editar una mesa completa retira el aviso; al completarla de nuevo, vuelve.
{
  await resetDb(avisoFixture);
  const handle = await crearContexto({ nombre: '05k-recalculo-aviso', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await seleccionarMesa(page, 9);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1300);
  const editor = tarjetaEditor(page);
  await rotulo(page, 'Mesa completa con aviso activo', 'Editamos una comanda ya enviada', 2800);

  await editor.getByLabel('Cantidad de Ensalada mixta').fill('2');
  await pausa(page, 1000);
  await editor.getByRole('button', { name: 'Añadir Flan casero' }).click();
  await pausa(page, 1100);
  await rotulo(page, 'Cambios que afectan a la completitud', 'Sube la cantidad de una línea lista y se añade un postre pendiente', 3400);
  await editor.getByRole('button', { name: 'Enviar cambios' }).click();
  await pausa(page, 1500);
  await rotulo(page, 'El aviso se retira', 'La mesa deja de estar completa hasta que cocina termine', 2800);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '05k-estado-sin-aviso', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala/estado');
  await rotulo(page, 'Mesa 9 deja de estar completa', 'Los platos vuelven a aparecer pendientes y sin aviso', 3000);
  await pausa(page, 1200);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '05k-cocina-completa', usuario: 'cocinero-entrantes' });
  const page = await nuevaPagina(handle, '/cocina');
  const card = tarjetaPedidoCocina(page, 9);
  await card.scrollIntoViewIfNeeded();
  await pausa(page, 700);
  await rotulo(page, 'Cocina prepara la ensalada', 'Ensalada x2 vuelve a estar lista', 2600);
  await card.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 900);
  await rotulo(page, 'Queda un plato pendiente', 'El flan todavía no está listo', 2400);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '05k-cocina-postres', usuario: 'cocinero-postres' });
  const page = await nuevaPagina(handle, '/cocina');
  const card = tarjetaPedidoCocina(page, 9);
  await card.scrollIntoViewIfNeeded();
  await pausa(page, 700);
  await rotulo(page, 'Cocina termina el flan', 'Con esta línea, la mesa vuelve a estar completa', 2800);
  await card.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 1100);
  await rotulo(page, 'Nuevo aviso de mesa completa', 'Al completar de nuevo la mesa se genera un aviso nuevo', 2800);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '05k-estado-nuevo-aviso', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala/estado');
  await pausa(page, 1300);
  await rotulo(page, 'Aviso nuevo visible', 'La señal se ha recalculado tras la edición', 2600);
  await pausa(page, 1200);
  await guardar(handle);
}

// G-19 y C-29: cerrar la cuenta retira el aviso y la mesa de la vista.
{
  await resetDb(avisoFixture);
  const handle = await crearContexto({ nombre: '05l-cierre-aviso', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala/estado');
  await rotulo(page, 'Mesa 9 completa con aviso', 'Antes de cerrar su cuenta', 2600);
  await pausa(page, 1000);
  await ir(page, '/cuentas?mesa=mesa-9');
  await pausa(page, 1200);
  await rotulo(page, 'Cobro único de Mesa 9', 'Los platos ya están listos; se puede cerrar', 2600);
  await page.getByRole('button', { name: 'Confirmar cobro único' }).click();
  await pausa(page, 1600);
  await rotulo(page, 'Cuenta cerrada y ticket emitido', 'La mesa queda libre', 2600);
  await ir(page, '/sala/estado');
  await pausa(page, 1300);
  await rotulo(page, 'El aviso desaparece al cerrar la cuenta', 'Mesa 9 ya no aparece en la vista de señales', 3000);
  await pausa(page, 1000);
  await guardar(handle);
}

await terminarGrabacion();

import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  abrirMesa,
  seleccionarMesa,
  anadirPlato,
  pausa,
  rotulo,
} from './lib.mjs';

await resetDb();
await iniciarGrabacion();

const handle = await crearContexto({ nombre: '02-sala-001', usuario: 'camarero-1' });
const page = await nuevaPagina(handle, '/sala');

await rotulo(page, 'Historia 001 · Abrir mesa y tomar pedido', 'La sala muestra mesas libres y ocupadas', 2800);
await pausa(page, 1200);

await seleccionarMesa(page, 2);
await rotulo(page, 'Mesa ocupada con comanda enviada', 'Se puede consultar la comanda y editarla', 2800);

await seleccionarMesa(page, 10);
await rotulo(page, 'Mesa libre seleccionada', 'Aparece la acción Abrir Mesa 10', 2400);

await page.getByRole('button', { name: 'Abrir Mesa 10' }).click();
await pausa(page, 1200);
await rotulo(
  page,
  'Mesa abierta y pedido en curso',
  'Todavía no hay platos; Confirmar pedido está deshabilitado',
  3000,
);

await pausa(page, 900);
await anadirPlato(page, 'Croquetas de jamón', 1);
await rotulo(page, 'Añadir plato', 'Croquetas de jamón, cantidad 1', 2200);

await anadirPlato(page, 'Croquetas de jamón', 1);
await rotulo(page, 'Repetir el mismo plato', 'Se permiten líneas repetidas del mismo plato', 2400);

await anadirPlato(page, 'Paella de marisco', 2);
await rotulo(page, 'Cantidad mayor que uno', 'Dos raciones de paella', 2200);

await anadirPlato(page, 'Tarta de queso', 1, 'sin azúcar');
await rotulo(page, 'Indicaciones por plato', 'La nota queda asociada a la línea', 2400);

await anadirPlato(page, 'Ensalada mixta', 1);
await rotulo(
  page,
  'Agrupación automática por partidas',
  'Entrantes, principales y postres se muestran separados',
  3000,
);

const cantidadTarta = page.getByLabel('Cantidad de Tarta de queso').first();
await cantidadTarta.fill('2');
await pausa(page, 1400);
await rotulo(page, 'Ajustar cantidad antes de confirmar', 'La tarta pasa de 1 a 2 unidades', 2500);

const quitar = page.getByRole('button', { name: 'Quitar' }).first();
await quitar.click();
await pausa(page, 1300);
await rotulo(page, 'Retirar una línea', 'El total se recalcula automáticamente', 2500);

await pausa(page, 700);
await page.getByRole('button', { name: 'Confirmar pedido' }).click();
await pausa(page, 1600);
await rotulo(
  page,
  'Pedido confirmado y enviado a cocina',
  'Estado Enviada, vinculado a Mesa 10',
  3000,
);

// Anulación de un pedido en curso en otra mesa.
await seleccionarMesa(page, 15);
await page.getByRole('button', { name: 'Abrir Mesa 15' }).click();
await pausa(page, 1000);
await anadirPlato(page, 'Flan casero', 1);
await pausa(page, 700);

await page.getByRole('button', { name: 'Anular pedido' }).click();
await pausa(page, 900);
await rotulo(page, 'Anular pedido en curso', 'Se pide confirmación antes de descartarlo', 2600);
await page.getByRole('button', { name: 'Cancelar' }).click();
await pausa(page, 900);
await rotulo(page, 'Cancelar el diálogo', 'El pedido sigue en curso y la mesa sigue ocupada', 2600);

await page.getByRole('button', { name: 'Anular pedido' }).click();
await pausa(page, 700);
await page.getByRole('button', { name: 'Sí, anular pedido' }).click();
await pausa(page, 1600);
await rotulo(
  page,
  'Pedido anulado',
  'La mesa vuelve a estar libre y no se envía nada a cocina',
  3000,
);

const video = await cerrarContexto(handle);
await terminarGrabacion();
console.log(video);

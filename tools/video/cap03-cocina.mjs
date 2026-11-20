import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  abrirMesa,
  anadirPlato,
  pausa,
  rotulo,
} from './lib.mjs';

await resetDb();
await iniciarGrabacion();

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

// Entrantes: vista general, orden, espera, mesa, platos y empate.
{
  const handle = await crearContexto({ nombre: '03a-cocina-entrantes', usuario: 'cocinero-entrantes' });
  const page = await nuevaPagina(handle, '/cocina');
  await rotulo(page, 'Historia 003 · Cocina', 'Marta solo ve los pedidos de Entrantes', 3000);
  await pausa(page, 1200);

  await rotulo(page, 'Solo pedidos pendientes de mi partida', 'No aparecen pedidos de otras partidas', 2800);
  await pausa(page, 1000);

  await rotulo(page, 'Orden por tiempo de espera', 'El más antiguo primero; el más reciente al final', 3000);
  await page.mouse.wheel(0, 520);
  await pausa(page, 1500);
  await rotulo(page, 'Espera superior a una hora', 'Mesa 6 muestra 1 h 18 min de forma legible', 3000);

  await rotulo(page, 'Empate en el instante de envío', 'Mesa 7 y Mesa 8: se ordenan por identificador', 3000);
  await pausa(page, 1000);

  await rotulo(page, 'Mesa de origen, platos y cantidades', 'Cada tarjeta identifica la mesa y el detalle', 3000);
  await page.mouse.wheel(0, -300);
  await pausa(page, 1000);

  await rotulo(
    page,
    'Líneas de otras partidas visibles',
    'Se ven, pero no tienen acción de marcado desde esta partida',
    3200,
  );
  await pausa(page, 1500);
  await guardar(handle);
}

// Principales: línea lista y pendiente, y pedido modificado.
{
  const handle = await crearContexto({
    nombre: '03b-cocina-principales',
    usuario: 'cocinero-principales',
  });
  const page = await nuevaPagina(handle, '/cocina');
  await rotulo(page, 'Otra partida, otra lista', 'Pablo ve solo Principales', 2800);
  await pausa(page, 1000);

  await rotulo(
    page,
    'Listo y pendiente en el mismo pedido',
    'La etiqueta textual y el color distinguen el estado',
    3200,
  );
  await page.mouse.wheel(0, 500);
  await pausa(page, 1600);

  await rotulo(page, 'Pedido modificado', 'Aviso Modificado; conserva espera y posición', 3000);
  await pausa(page, 1500);
  await guardar(handle);
}

// Postres.
{
  const handle = await crearContexto({ nombre: '03c-cocina-postres', usuario: 'cocinero-postres' });
  const page = await nuevaPagina(handle, '/cocina');
  await rotulo(page, 'Tercera partida', 'Lucía ve únicamente Postres', 2600);
  await pausa(page, 1300);
  await page.mouse.wheel(0, 400);
  await pausa(page, 1200);
  await guardar(handle);
}

// Nuevo pedido desde sala y aparición en cocina.
{
  const handle = await crearContexto({ nombre: '03d-camarero-nuevo-pedido', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await rotulo(page, 'Mientras tanto, en sala', 'Se abre Mesa 10 y se envía una comanda nueva', 2800);
  await abrirMesa(page, 10);
  await anadirPlato(page, 'Croquetas de jamón', 2);
  await anadirPlato(page, 'Paella de marisco', 1);
  await anadirPlato(page, 'Tarta de queso', 1);
  await pausa(page, 800);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(page, 1600);
  await rotulo(page, 'Pedido enviado', 'La cocina debe recibirlo sin recargar', 2200);
  await guardar(handle);
}

{
  const handle = await crearContexto({
    nombre: '03e-cocina-nuevo-pedido',
    usuario: 'cocinero-entrantes',
  });
  const page = await nuevaPagina(handle, '/cocina');
  await rotulo(page, 'El pedido nuevo ya está en cocina', 'Mesa 10 aparece en la posición que le corresponde', 3000);
  await page.mouse.wheel(0, 2000);
  await pausa(page, 1800);
  await rotulo(page, 'Actualización sin recargar', 'La lista se refresca por SSE', 2600);
  await pausa(page, 1200);
  await guardar(handle);
}

await terminarGrabacion();

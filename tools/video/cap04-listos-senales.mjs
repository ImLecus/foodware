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
  ir,
} from './lib.mjs';

await resetDb();
await iniciarGrabacion();

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

// Preparar una comanda con dos entrantes, un principal y un postre.
{
  const handle = await crearContexto({ nombre: '04a-camarero-prepara', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await rotulo(page, 'Historia 004 · Marcar platos listos', 'Preparamos una mesa con platos de las tres partidas', 3000);
  await abrirMesa(page, 10);
  await anadirPlato(page, 'Croquetas de jamón', 2);
  await anadirPlato(page, 'Ensalada mixta', 1);
  await anadirPlato(page, 'Paella de marisco', 1);
  await anadirPlato(page, 'Tarta de queso', 1);
  await pausa(page, 600);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(page, 1300);
  await rotulo(page, 'Comanda enviada a cocina', 'Croquetas y ensalada en Entrantes; paella y tarta en sus partidas', 2600);

  // Mesa 15 se queda en curso para la vista de señales.
  await abrirMesa(page, 15);
  await anadirPlato(page, 'Flan casero', 1);
  await pausa(page, 600);
  await rotulo(page, 'Mesa 15 con pedido en curso', 'Todavía no se ha enviado a cocina', 2200);
  await guardar(handle);
}

// Entrantes: marcar, comprobar pendientes, completar y deshacer.
{
  const handle = await crearContexto({ nombre: '04b-listos-entrantes', usuario: 'cocinero-entrantes' });
  const page = await nuevaPagina(handle, '/cocina');
  const cardMesa10 = page.locator('[data-testid^="pedido-"]').filter({ hasText: 'Mesa 10' });
  const cardMesa9 = page.locator('[data-testid^="pedido-"]').filter({ hasText: 'Mesa 9' });

  await rotulo(page, 'Marcar un plato como listo', 'La marca afecta a toda la línea del plato', 2800);
  await cardMesa10.scrollIntoViewIfNeeded();
  await pausa(page, 600);
  await cardMesa10.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 1300);
  await rotulo(page, 'Solo cambia esa línea', 'La ensalada sigue pendiente; el pedido permanece', 3000);
  await pausa(page, 900);

  await rotulo(page, 'Momento de preparación', 'La línea muestra la hora en que se marcó como lista', 2800);
  await pausa(page, 700);

  await cardMesa10.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 700);
  await rotulo(page, 'Pedido completado en mi partida', 'El pedido desaparece y aparece Deshacer durante 10 s', 2200);
  await pausa(page, 500);
  await page.getByRole('button', { name: 'Deshacer' }).click();
  await pausa(page, 1000);
  await rotulo(page, 'Deshacer la última marca', 'El pedido vuelve a la lista y el plato queda pendiente', 2600);

  await cardMesa10.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 700);
  await rotulo(page, 'Pedido completado de nuevo', 'La acción Deshacer sigue disponible unos segundos', 2200);
  await pausa(page, 300);

  // Mesa 9: un único plato; al marcarlo, la mesa queda completa.
  await cardMesa9.scrollIntoViewIfNeeded();
  await pausa(page, 700);
  await rotulo(page, 'Mesa 9: un solo plato', 'Al marcarlo, la mesa se considera completa', 2600);
  await cardMesa9.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 1000);
  await rotulo(page, 'Segundo aviso de pedido completado', 'Mesa 9 también desaparece de la lista de entrantes', 2400);
  await guardar(handle);
}

// Principales.
{
  const handle = await crearContexto({
    nombre: '04c-listos-principales',
    usuario: 'cocinero-principales',
  });
  const page = await nuevaPagina(handle, '/cocina');
  const card = page.locator('[data-testid^="pedido-"]').filter({ hasText: 'Mesa 10' });
  await card.scrollIntoViewIfNeeded();
  await pausa(page, 600);
  await rotulo(page, 'Marcar el principal', 'La línea de Paella queda lista', 2200);
  await card.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 900);
  await rotulo(page, 'Pedido completado en Principales', 'La comanda desaparece de esta partida', 2400);
  await guardar(handle);
}

// Postres.
{
  const handle = await crearContexto({ nombre: '04d-listos-postres', usuario: 'cocinero-postres' });
  const page = await nuevaPagina(handle, '/cocina');
  const card = page.locator('[data-testid^="pedido-"]').filter({ hasText: 'Mesa 10' });
  await card.scrollIntoViewIfNeeded();
  await pausa(page, 600);
  await rotulo(page, 'Marcar el postre', 'Con esta línea, todos los platos de la mesa están listos', 2600);
  await card.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(page, 1200);
  await rotulo(page, 'Mesa completa', 'La sala recibirá el aviso de mesa completa', 2200);
  await guardar(handle);
}

// Señales en sala.
{
  const handle = await crearContexto({ nombre: '04e-senales', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala/estado');
  await rotulo(page, 'Historia 005 · Señales de platos listos', 'Mesas abiertas con la comanda ya enviada', 3000);
  await pausa(page, 1200);

  await rotulo(page, 'Estado en vivo por mesa', 'Mesa 10 y Mesa 9 aparecen completas; Mesa 15 sigue en curso', 3200);
  await pausa(page, 1200);

  await rotulo(page, 'Aviso de mesa completa', 'Identifica la mesa y permanece visible hasta descartarlo', 3000);
  await pausa(page, 1200);

  await rotulo(page, 'Señal sonora', 'El pitido suena una sola vez; la señal visual permanece', 2800);
  await pausa(page, 900);

  await page.getByRole('button', { name: /Silenciar sonido|Activar sonido/ }).first().click();
  await pausa(page, 900);
  await rotulo(page, 'Silenciar el sonido', 'La preferencia se guarda y la señal visual no desaparece', 2800);
  await page.reload();
  await pausa(page, 1200);
  await rotulo(page, 'Preferencia persistente', 'Tras recargar, el sonido sigue silenciado', 2400);
  await page.getByRole('button', { name: /Silenciar sonido|Activar sonido/ }).first().click();
  await pausa(page, 700);

  await rotulo(page, 'Descartar el aviso', 'Deja de mostrarse; no reaparece hasta un nuevo plato listo', 2800);
  await page.getByRole('button', { name: 'Descartar aviso' }).first().click();
  await pausa(page, 1200);
  await rotulo(page, 'Aviso descartado', 'La señal visual desaparece de la pantalla', 2200);
  await guardar(handle);
}

await terminarGrabacion();

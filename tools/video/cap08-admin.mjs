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
  seleccionarMesa,
} from './lib.mjs';

await resetDb();
await iniciarGrabacion();

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

// Comanda previa para demostrar que la carta no altera pedidos ya enviados.
{
  const handle = await crearContexto({ nombre: '08a-pedido-previo', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await rotulo(page, 'Historia 008 · Gestión de la carta', 'Antes de cambiar la carta, tomamos una comanda', 2800);
  await abrirMesa(page, 10);
  await anadirPlato(page, 'Croquetas de jamón', 1);
  await anadirPlato(page, 'Tarta de queso', 1);
  await pausa(page, 500);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Pedido enviado con precios fijados', 'Croquetas y tarta quedan en el histórico de la comanda', 2600);
  await guardar(handle);
}

// Administración: crear, editar y controlar disponibilidad.
{
  const handle = await crearContexto({ nombre: '08b-admin-carta', usuario: 'admin-1' });
  const page = await nuevaPagina(handle, '/admin');
  await rotulo(page, 'Solo el administrador gestiona la carta', 'Tabla con todos los platos, activos o no', 3000);
  await pausa(page, 1200);

  // Crear ingrediente.
  await page.getByRole('button', { name: 'Nuevo ingrediente' }).click();
  await pausa(page, 700);
  const formIng = page.locator('form').last();
  await formIng.locator('input').fill('Trufa');
  await pausa(page, 400);
  await formIng.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Crear un ingrediente', 'Trufa queda disponible para asociarla a platos', 2400);

  // Crear plato con ingrediente.
  await page.getByRole('button', { name: 'Nuevo plato' }).click();
  await pausa(page, 700);
  const formPlato = page.locator('form').last();
  await formPlato.locator('input').first().fill('Risotto de trufa');
  await formPlato.locator('select').selectOption('principales');
  await formPlato.locator('input[placeholder="0,00"]').fill('18,50');
  await formPlato.locator('label').filter({ hasText: 'Trufa' }).click();
  await pausa(page, 500);
  await formPlato.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1400);
  await rotulo(page, 'Crear un plato', 'Risotto de trufa, 18,50 €, asociado a Trufa', 2800);

  // Editar precio y nombre.
  const filaRisotto = page.getByRole('row').filter({ hasText: 'Risotto de trufa' });
  await filaRisotto.getByRole('button', { name: 'Editar' }).click();
  await pausa(page, 700);
  const formEdit = page.locator('form').last();
  await formEdit.locator('input[placeholder="0,00"]').fill('19,00');
  await pausa(page, 400);
  await formEdit.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Editar nombre, partida o precio', 'El precio de Risotto pasa a 19,00 €', 2600);

  // Cambiar un plato que ya está en un pedido enviado.
  const filaCroquetas = page.getByRole('row').filter({ hasText: 'Croquetas de jamón' });
  await filaCroquetas.getByRole('button', { name: 'Editar' }).click();
  await pausa(page, 700);
  const formCroquetas = page.locator('form').last();
  await formCroquetas.locator('input').first().fill('Croquetas caseras');
  await formCroquetas.locator('input[placeholder="0,00"]').fill('9,50');
  await pausa(page, 500);
  await formCroquetas.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Cambiar un plato ya vendido', 'La carta pasa a Croquetas caseras a 9,50 €', 2800);

  // Plato sin ingredientes.
  await page.getByRole('button', { name: 'Nuevo plato' }).click();
  await pausa(page, 700);
  const formPan = page.locator('form').last();
  await formPan.locator('input').first().fill('Pan de la casa');
  await formPan.locator('select').selectOption('entrantes');
  await formPan.locator('input[placeholder="0,00"]').fill('2,00');
  await formPan.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1300);
  await rotulo(page, 'Plato sin ingredientes', 'Se ofrece si está activo; no depende de ingredientes', 2800);

  // Desactivar Pan de la casa.
  const filaPan = page.getByRole('row').filter({ hasText: 'Pan de la casa' });
  await filaPan.getByRole('button', { name: 'Desactivar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Baja manual', 'El plato deja de ofrecerse en sala y queda como Desactivado', 3000);

  // Reactivar Pan.
  await page.getByRole('row').filter({ hasText: 'Pan de la casa' }).getByRole('button', { name: 'Activar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Alta manual', 'El plato vuelve a ofrecerse en la carta vigente', 2600);

  // Ingrediente agotado: Queso oculta la tarta.
  await page.getByRole('row').filter({ hasText: 'Queso' }).getByRole('button', { name: 'Marcar agotado' }).click();
  await pausa(page, 1300);
  await rotulo(page, 'Ingrediente agotado', 'La Tarta de queso deja de ofrecerse con motivo Ingrediente agotado', 3200);

  // Reponer Queso.
  await page.getByRole('row').filter({ hasText: 'Queso' }).getByRole('button', { name: 'Marcar disponible' }).click();
  await pausa(page, 1300);
  await rotulo(page, 'Reponer el ingrediente', 'La tarta vuelve a ofrecerse si sigue activa', 2600);

  // Disponibilidad combinada: desactivar tarta y agotar queso.
  await page.getByRole('row').filter({ hasText: 'Tarta de queso' }).getByRole('button', { name: 'Desactivar' }).click();
  await pausa(page, 900);
  await page.getByRole('row').filter({ hasText: 'Queso' }).getByRole('button', { name: 'Marcar agotado' }).click();
  await pausa(page, 900);
  await page.getByRole('row').filter({ hasText: 'Queso' }).getByRole('button', { name: 'Marcar disponible' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Disponibilidad combinada', 'Al reponer el queso, la tarta sigue oculta porque está desactivada', 3400);
  await page.getByRole('row').filter({ hasText: 'Tarta de queso' }).getByRole('button', { name: 'Activar' }).click();
  await pausa(page, 1100);
  await rotulo(page, 'Reactivar el plato', 'Con el ingrediente disponible, la tarta vuelve a ofrecerse', 2800);

  // Ingrediente asociado a varios platos: Huevo oculta Croquetas y Tarta.
  await page.getByRole('row').filter({ hasText: 'Huevo' }).getByRole('button', { name: 'Marcar agotado' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Ingrediente compartido', 'Huevo afecta a Croquetas y a Tarta; ambos dejan de ofrecerse', 3200);
  await page.getByRole('row').filter({ hasText: 'Huevo' }).getByRole('button', { name: 'Marcar disponible' }).click();
  await pausa(page, 1100);

  // Sustituir ingredientes de un plato.
  await page.getByRole('row').filter({ hasText: 'Risotto de trufa' }).getByRole('button', { name: 'Editar' }).click();
  await pausa(page, 700);
  const formAsoc = page.locator('form').last();
  await formAsoc.locator('label').filter({ hasText: 'Queso' }).click();
  await pausa(page, 500);
  await formAsoc.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Asociación plato-ingrediente', 'El conjunto de ingredientes se sustituye completo al guardar', 3000);

  // Duplicar nombre.
  await page.getByRole('button', { name: 'Nuevo plato' }).click();
  await pausa(page, 700);
  const formDup = page.locator('form').last();
  await formDup.locator('input').first().fill('Pan de la casa');
  await formDup.locator('select').selectOption('postres');
  await formDup.locator('input[placeholder="0,00"]').fill('2,50');
  await formDup.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Nombres duplicados', 'Se permiten si son platos distintos por partida o precio', 3000);

  // Precio inválido: no se guarda.
  await page.getByRole('button', { name: 'Nuevo plato' }).click();
  await pausa(page, 700);
  const formInvalido = page.locator('form').last();
  await formInvalido.locator('input').first().fill('Plato sin precio');
  await formInvalido.locator('input[placeholder="0,00"]').fill('0');
  await formInvalido.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Precio inválido', 'Un precio vacío, cero o negativo no se guarda', 2800);
  await page.getByRole('button', { name: 'Cancelar' }).last().click();
  await pausa(page, 800);

  await rotulo(page, 'Sin borrado destructivo', 'Los platos no se eliminan: se desactivan para conservar el histórico', 3000);
  await guardar(handle);
}

// Reflejo en la carta de sala.
{
  const handle = await crearContexto({ nombre: '08c-sala-carta', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await rotulo(page, 'Carta vigente en sala', 'Los cambios del administrador se ven al consultar la carta', 2800);
  await pausa(page, 1200);
  await page.mouse.wheel(0, 700);
  await pausa(page, 1200);
  await rotulo(page, 'Platos nuevos y precios actualizados', 'Risotto de trufa y Pan de la casa aparecen en su partida', 3000);
  await pausa(page, 1000);
  await guardar(handle);
}

// Pedido previo: conserva nombre, partida y precio.
{
  const handle = await crearContexto({ nombre: '08d-pedido-historico', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await seleccionarMesa(page, 10);
  await pausa(page, 1200);
  await rotulo(page, 'Pedido ya enviado', 'La comanda conserva Croquetas de jamón a 8,50 €', 3000);
  await pausa(page, 1000);
  await rotulo(page, 'La carta nueva no altera el pasado', 'Solo afecta a nuevos pedidos y a la carta vigente', 3000);
  await guardar(handle);
}

// Administración: nombre histórico en el dashboard.
{
  const handle = await crearContexto({ nombre: '08e-admin-historico', usuario: 'admin-1' });
  const page = await nuevaPagina(handle, '/admin');
  await rotulo(page, 'Cambiar el nombre de un plato vendido', 'La Tarta de queso aparece ahora como Tarta de queso casera', 3000);
  const fila = page.getByRole('row').filter({ hasText: 'Tarta de queso' });
  await fila.getByRole('button', { name: 'Editar' }).click();
  await pausa(page, 700);
  const form = page.locator('form').last();
  await form.locator('input').first().fill('Tarta de queso casera');
  await pausa(page, 500);
  await form.getByRole('button', { name: 'Guardar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Nombre actualizado en la carta', 'El histórico del pedido y del dashboard conserva el nombre anterior', 3200);
  await guardar(handle);
}

await terminarGrabacion();

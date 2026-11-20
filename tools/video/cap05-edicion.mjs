import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  seleccionarMesa,
  abrirMesa,
  anadirPlato,
  pausa,
  rotulo,
  tarjetaEditor,
  tarjetaPedidoCocina,
  ir,
} from './lib.mjs';

await resetDb();
await iniciarGrabacion();

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

// Edición directa de un pedido enviado.
{
  const handle = await crearContexto({ nombre: '05a-editar-pedido', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await seleccionarMesa(page, 2);
  await rotulo(page, 'Historia 002 · Editar pedido enviado', 'Mesa 2 tiene una comanda ya enviada a cocina', 2800);
  await pausa(page, 800);

  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1600);
  const editor = tarjetaEditor(page);
  await rotulo(page, 'Edición directa', 'No hay que reabrir el pedido: se toma el bloqueo y se edita', 3000);

  await rotulo(page, 'Acción explícita de envío', 'Enviar cambios está deshabilitado sin modificaciones', 2800);
  await pausa(page, 700);

  await editor.getByRole('button', { name: 'Añadir Ensalada mixta' }).click();
  await pausa(page, 1300);
  await rotulo(page, 'Añadir un plato', 'La ensalada se incorpora al mismo pedido', 2400);

  const cantidadCroquetas = editor.getByLabel('Cantidad de Croquetas de jamón');
  await cantidadCroquetas.fill('3');
  await pausa(page, 1300);
  await rotulo(page, 'Ajustar cantidad', 'Croquetas pasa de 2 a 3 unidades', 2200);

  const indicacion = editor.getByLabel('Indicaciones de Ensalada mixta');
  await indicacion.fill('sin cebolla');
  await indicacion.blur();
  await pausa(page, 1300);
  await rotulo(page, 'Corregir indicaciones', 'La nota queda en la línea del pedido', 2200);

  await editor.getByRole('button', { name: 'Quitar' }).last().click();
  await pausa(page, 1300);
  await rotulo(page, 'Retirar un plato', 'La tarta desaparece del pedido vigente', 2200);

  await rotulo(page, 'Pedido marcado como modificado', 'Aparecen Modificada y Cambios pendientes', 3000);
  await pausa(page, 900);

  await editor.getByRole('button', { name: 'Enviar cambios' }).click();
  await pausa(page, 1500);
  await rotulo(page, 'Cambios comunicados a cocina', 'El bloqueo se libera y cocina recibe el aviso Modificado', 3000);
  await guardar(handle);
}

// Cocina antes y después de la edición.
{
  const handle = await crearContexto({ nombre: '05b-cocina-tras-editar', usuario: 'cocinero-entrantes' });
  const page = await nuevaPagina(handle, '/cocina');
  await rotulo(page, 'La cocina recibe la modificación', 'Mesa 2 sigue siendo el mismo pedido y conserva su espera', 3000);
  const card = tarjetaPedidoCocina(page, 2);
  await card.scrollIntoViewIfNeeded();
  await pausa(page, 1200);
  await rotulo(page, 'Aviso Modificado', 'No se detalla qué platos cambiaron', 2400);
  await pausa(page, 800);
  await guardar(handle);
}

// Bloqueo: dos camareros intentan editar el mismo pedido.
{
  const handleA = await crearContexto({ nombre: '05c-bloqueo-a', usuario: 'camarero-1' });
  const pageA = await nuevaPagina(handleA, '/sala');
  await seleccionarMesa(pageA, 2);
  await pageA.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(pageA, 1400);
  await rotulo(pageA, 'Primer camarero edita el pedido', 'El pedido queda bloqueado para los demás', 2600);

  const handleB = await crearContexto({ nombre: '05d-bloqueo-b', usuario: 'camarero-2' });
  const pageB = await nuevaPagina(handleB, '/sala');
  await seleccionarMesa(pageB, 2);
  await pageB.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(pageB, 1200);
  await rotulo(pageB, 'Segundo camarero', 'No puede editar: el pedido está bloqueado por otro camarero', 3200);
  await pausa(pageB, 1000);

  await pageA.getByRole('button', { name: 'Cancelar edición' }).click();
  await pausa(pageA, 1100);
  await rotulo(pageA, 'Salir de la edición', 'El bloqueo se libera sin marcar el pedido como modificado', 2800);

  await pageB.getByRole('button', { name: 'Volver' }).click();
  await pausa(pageB, 800);
  await seleccionarMesa(pageB, 2);
  await pageB.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(pageB, 1100);
  await rotulo(pageB, 'El segundo camarero ya puede editar', 'El bloqueo se ha liberado correctamente', 2600);
  await pageB.getByRole('button', { name: 'Cancelar edición' }).click();
  await pausa(pageB, 600);

  await guardar(handleB);
  await guardar(handleA);
}

// Protección de la última línea: Mesa 9 tiene un único plato.
{
  const handle = await crearContexto({ nombre: '05e-ultima-linea', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await seleccionarMesa(page, 9);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1400);
  const editor = tarjetaEditor(page);
  await rotulo(page, 'No se puede dejar el pedido vacío', 'Con una sola línea, Quitar está deshabilitado', 3000);
  await pausa(page, 1200);
  await page.getByRole('button', { name: 'Cancelar edición' }).click();
  await pausa(page, 800);
  await rotulo(page, 'Salir sin cambios', 'El pedido no queda marcado como modificado', 2400);
  await guardar(handle);
}

// Cancelación completa de un pedido enviado: Mesa 4.
{
  const handle = await crearContexto({ nombre: '05f-cancelar-enviado', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await seleccionarMesa(page, 4);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1400);
  await rotulo(page, 'Cancelar el pedido completo', 'Se avisa a cocina y no se genera ningún cobro', 2800);
  await page.getByRole('button', { name: 'Cancelar pedido' }).click();
  await pausa(page, 800);
  await rotulo(page, 'Confirmación', 'La mesa quedará libre y el pedido desaparecerá de cocina', 2400);
  await page.getByRole('button', { name: 'Sí, cancelar pedido' }).click();
  await pausa(page, 1600);
  await rotulo(page, 'Pedido cancelado', 'Mesa 4 libre; no hay consumo ni cobro', 3000);
  await guardar(handle);
}

// Variación de cantidad de una línea ya lista.
{
  const handlePrep = await crearContexto({ nombre: '05g-prepara-cantidad', usuario: 'camarero-1' });
  const pagePrep = await nuevaPagina(handlePrep, '/sala');
  await abrirMesa(pagePrep, 10);
  await anadirPlato(pagePrep, 'Croquetas de jamón', 2);
  await anadirPlato(pagePrep, 'Paella de marisco', 1);
  await pausa(pagePrep, 500);
  await pagePrep.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(pagePrep, 1200);
  await rotulo(pagePrep, 'Preparamos una línea que ya está lista', 'Croquetas x2 se marcará como lista en cocina', 2400);
  await guardar(handlePrep);

  const handleKitchen = await crearContexto({ nombre: '05h-cantidad-cocina', usuario: 'cocinero-entrantes' });
  const pageKitchen = await nuevaPagina(handleKitchen, '/cocina');
  const card = tarjetaPedidoCocina(pageKitchen, 10);
  await card.scrollIntoViewIfNeeded();
  await pausa(pageKitchen, 600);
  await card.getByRole('button', { name: 'Marcar listo' }).first().click();
  await pausa(pageKitchen, 1000);
  await rotulo(pageKitchen, 'Línea lista', 'Croquetas x2 queda marcada como lista', 2200);
  await guardar(handleKitchen);

  const handleEdit = await crearContexto({ nombre: '05i-cantidad-editor', usuario: 'camarero-1' });
  const pageEdit = await nuevaPagina(handleEdit, '/sala');
  await seleccionarMesa(pageEdit, 10);
  await pageEdit.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(pageEdit, 1400);
  const editor = tarjetaEditor(pageEdit);
  await rotulo(pageEdit, 'Bajar la cantidad de una línea lista', 'Si la cantidad baja, la línea sigue lista', 3000);
  await editor.getByLabel('Cantidad de Croquetas de jamón').fill('1');
  await pausa(pageEdit, 1300);
  await rotulo(pageEdit, 'Cantidad reducida', 'La línea mantiene su estado de lista', 2400);
  await editor.getByLabel('Cantidad de Croquetas de jamón').fill('3');
  await pausa(pageEdit, 1300);
  await rotulo(pageEdit, 'Subir la cantidad', 'La línea vuelve a pendiente y se borra el momento de listo', 3000);
  await editor.getByRole('button', { name: 'Enviar cambios' }).click();
  await pausa(pageEdit, 1200);
  await guardar(handleEdit);

  const handleKitchen2 = await crearContexto({ nombre: '05j-cantidad-cocina-final', usuario: 'cocinero-entrantes' });
  const pageKitchen2 = await nuevaPagina(handleKitchen2, '/cocina');
  const card2 = tarjetaPedidoCocina(pageKitchen2, 10);
  await card2.scrollIntoViewIfNeeded();
  await pausa(pageKitchen2, 700);
  await rotulo(pageKitchen2, 'La línea ha vuelto a pendiente', 'Ya no muestra la hora de preparación', 2800);
  await guardar(handleKitchen2);
}

await terminarGrabacion();

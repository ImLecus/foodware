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
  ir,
  ejecutarSql,
  tarjetaEditor,
} from './lib.mjs';

await resetDb();
await iniciarGrabacion();

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

function marcarTodoListo(mesaId) {
  ejecutarSql(`
    UPDATE lineas_pedido
       SET estado = 'listo', listo_en = datetime('now')
     WHERE pedido_id = (
       SELECT id FROM pedidos
        WHERE mesa_id = '${mesaId}' AND estado = 'enviada'
        ORDER BY enviado_en DESC LIMIT 1
     );
  `);
}

// C-01, C-03 y C-04: lista de mesas, revisión y cancelación del cierre.
{
  const handle = await crearContexto({ nombre: '06a-revisar-cuenta', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/cuentas');
  await rotulo(page, 'Historia 006 · Cierre y división de cuenta', 'Lista de mesas abiertas con pedido', 3000);
  await pausa(page, 1200);

  await page.getByRole('button', { name: 'Mesa 9' }).click();
  await pausa(page, 1500);
  await rotulo(page, 'Revisar consumos y total', 'Ensalada mixta con el precio fijado al pedir', 3000);
  await pausa(page, 1200);
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Cancelar el cierre', 'La cuenta y la mesa quedan como estaban', 2600);
  await guardar(handle);
}

// Preparar Mesa 10 con una comanda enviada y un plato pendiente.
{
  const handle = await crearContexto({ nombre: '06b-prepara-mesa10', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await abrirMesa(page, 10);
  await anadirPlato(page, 'Croquetas de jamón', 2);
  await anadirPlato(page, 'Paella de marisco', 1);
  await anadirPlato(page, 'Tarta de queso', 1);
  await pausa(page, 600);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(page, 1400);
  await rotulo(page, 'Mesa 10 lista para cobrar', 'Dejamos un plato pendiente para probar el bloqueo', 2600);
  await guardar(handle);
}

// C-05, C-06, C-08 y C-09: cierre bloqueado, desbloqueo, cobro único y ticket.
{
  const handle = await crearContexto({ nombre: '06c-cobro-unico', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/cuentas?mesa=mesa-10');
  await rotulo(page, 'Cierre bloqueado por cocina', 'Hay platos pendientes: no se puede confirmar el cobro', 3200);
  await pausa(page, 1600);

  marcarTodoListo('mesa-10');
  await page.reload();
  await pausa(page, 1500);
  await rotulo(page, 'Platos listos', 'El bloqueo desaparece y el cierre se habilita', 2800);

  await page.getByRole('button', { name: 'Confirmar cobro único' }).click();
  await pausa(page, 1800);
  await rotulo(page, 'Cobro único', 'Ticket con el total; la cuenta se cierra y la mesa queda libre', 3200);
  await pausa(page, 1000);
  await guardar(handle);
}

// C-09: el ticket sigue consultable.
{
  const handle = await crearContexto({ nombre: '06d-ticket-cerrado', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/cuentas?mesa=mesa-10');
  await rotulo(page, 'Cuenta cerrada', 'El ticket final se puede volver a consultar', 2600);
  await pausa(page, 1200);
  await guardar(handle);
}

// C-11: reutilización de la mesa.
{
  const handle = await crearContexto({ nombre: '06e-reutilizar-mesa', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await seleccionarMesa(page, 10);
  await rotulo(page, 'Mesa 10 libre de nuevo', 'Se puede abrir una comanda nueva', 2600);
  await page.getByRole('button', { name: 'Abrir Mesa 10' }).click();
  await pausa(page, 1200);
  await anadirPlato(page, 'Ensalada mixta', 1);
  await pausa(page, 500);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Nueva comanda sobre la misma mesa', 'La cuenta anterior queda como histórico', 2800);
  await guardar(handle);
}

// C-07: cuenta sin consumos.
{
  const handle = await crearContexto({ nombre: '06f-cuenta-vacia', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await abrirMesa(page, 12);
  await ir(page, '/cuentas?mesa=mesa-12');
  await rotulo(page, 'Cuenta sin consumos', 'Total 0,00 €; no se permite cerrar', 2800);
  await pausa(page, 1000);
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await pausa(page, 900);
  await ir(page, '/sala');
  await seleccionarMesa(page, 12);
  await anadirPlato(page, 'Croquetas de jamón', 1);
  await anadirPlato(page, 'Paella de marisco', 1);
  await anadirPlato(page, 'Tarta de queso', 1);
  await pausa(page, 600);
  await page.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Mesa 12 con consumos', 'Tres platos para la división por consumo', 2400);
  await guardar(handle);
}

marcarTodoListo('mesa-12');

// C-14, C-15, C-16, C-25, C-17, C-18, C-19, C-20, C-21 y C-23.
{
  const handle = await crearContexto({ nombre: '06g-division-consumo', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/cuentas?mesa=mesa-12');
  page.on('dialog', (dialog) => dialog.accept());

  await rotulo(page, 'Dividir por consumo', 'Cada plato se asigna a una o varias partes', 2800);
  await page.getByRole('button', { name: 'Por consumo' }).click();
  await pausa(page, 700);
  await page.locator('#numero-partes').fill('3');
  await pausa(page, 900);
  await rotulo(page, 'Partes de la cuenta', 'Las etiquetas son Parte 1, Parte 2 y Parte 3', 2600);

  await page.getByRole('button', { name: 'Confirmar división' }).click();
  await pausa(page, 700);
  await rotulo(page, 'Validación de importes', 'Cada parte debe tener un importe mayor que cero', 2600);
  await pausa(page, 800);

  // Croquetas para la parte 1: ya está marcada por defecto.
  async function alternarParte(etiqueta) {
    await page.getByLabel(etiqueta).locator('xpath=ancestor::label[1]').click();
    await pausa(page, 250);
  }

  await alternarParte('Asignar Paella de marisco a la parte 1');
  await alternarParte('Asignar Paella de marisco a la parte 2');
  await alternarParte('Asignar Tarta de queso a la parte 1');
  await alternarParte('Asignar Tarta de queso a la parte 2');
  await alternarParte('Asignar Tarta de queso a la parte 3');
  await pausa(page, 1000);
  await rotulo(page, 'Plato compartido', 'La tarta se reparte entre las partes 2 y 3', 2800);

  await page.getByRole('button', { name: 'Confirmar división' }).click();
  await pausa(page, 1400);
  await rotulo(page, 'División confirmada', 'La mesa sigue ocupada hasta pagar todas las partes', 2800);

  await page.getByRole('button', { name: 'Marcar como pagada' }).first().click();
  await pausa(page, 1200);
  await rotulo(page, 'Pago por partes', 'La primera parte queda pagada; todavía no hay ticket', 3000);
  await pausa(page, 700);
  await rotulo(page, 'Ticket pendiente', 'No se emite hasta pagar la última parte', 2400);

  await ir(page, '/sala');
  await seleccionarMesa(page, 12);
  await page.getByRole('button', { name: 'Editar pedido' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Partes pagadas', 'La edición se bloquea hasta deshacer el pago', 2800);
  await pausa(page, 900);

  await ir(page, '/cuentas?mesa=mesa-12');
  await pausa(page, 1200);
  await page.getByRole('button', { name: 'Deshacer pago' }).first().click();
  await pausa(page, 1200);
  await rotulo(page, 'Deshacer el pago', 'La parte vuelve a pendiente y la edición se desbloquea', 2800);

  const pagarRestantes = page.getByRole('button', { name: 'Marcar como pagada' });
  while ((await pagarRestantes.count()) > 0) {
    await pagarRestantes.first().click();
    await pausa(page, 900);
  }
  await pausa(page, 1200);
  await rotulo(page, 'Ticket final único', 'Se emite al pagar la última parte, con el desglose completo', 3200);
  await pausa(page, 1000);
  await guardar(handle);
}

// Mesa 9: división en partes iguales con redondeo.
marcarTodoListo('mesa-9');
{
  const handle = await crearContexto({ nombre: '06h-division-igual', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/cuentas?mesa=mesa-9');
  page.on('dialog', (dialog) => dialog.accept());

  await rotulo(page, 'División en partes iguales', '7,00 € entre 3: el céntimo sobrante va a la primera parte', 3200);
  await page.getByRole('button', { name: 'Partes iguales' }).click();
  await page.locator('#numero-partes').fill('3');
  await pausa(page, 1200);
  await rotulo(page, 'Reparto al céntimo', '2,34 €, 2,33 € y 2,33 €; la suma coincide con el total', 3200);
  await pausa(page, 1000);

  await page.getByRole('button', { name: 'Confirmar división' }).click();
  await pausa(page, 1200);
  await page.getByRole('button', { name: 'Marcar como pagada' }).first().click();
  await pausa(page, 900);
  await page.getByRole('button', { name: 'Deshacer pago' }).first().click();
  await pausa(page, 1000);
  await rotulo(page, 'Deshacer una parte pagada', 'La cuenta sigue abierta y la parte vuelve a pendiente', 2800);

  const pagar = page.getByRole('button', { name: 'Marcar como pagada' });
  while ((await pagar.count()) > 0) {
    await pagar.first().click();
    await pausa(page, 850);
  }
  await pausa(page, 1200);
  await rotulo(page, 'Cuenta cerrada', 'Ticket único con las tres partes; la mesa queda libre', 3000);
  await guardar(handle);
}

// C-24: división en una sola parte, en una mesa de apoyo.
{
  const handlePrep = await crearContexto({ nombre: '06i-prepara-una-parte', usuario: 'camarero-1' });
  const pagePrep = await nuevaPagina(handlePrep, '/sala');
  await abrirMesa(pagePrep, 11);
  await anadirPlato(pagePrep, 'Croquetas de jamón', 1);
  await pausa(pagePrep, 500);
  await pagePrep.getByRole('button', { name: 'Confirmar pedido' }).click();
  await pausa(pagePrep, 1200);
  await guardar(handlePrep);

  marcarTodoListo('mesa-11');
  const handle = await crearContexto({ nombre: '06j-una-parte', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/cuentas?mesa=mesa-11');
  await rotulo(page, 'División en una sola parte', 'También es un reparto válido', 2600);
  await page.getByRole('button', { name: 'Partes iguales' }).click();
  await page.locator('#numero-partes').fill('1');
  await pausa(page, 900);
  await page.getByRole('button', { name: 'Confirmar división' }).click();
  await pausa(page, 1100);
  await page.getByRole('button', { name: 'Marcar como pagada' }).click();
  await pausa(page, 1300);
  await rotulo(page, 'Ticket y mesa libre', 'La cuenta se cierra con una única parte', 2600);
  await guardar(handle);
}

await terminarGrabacion();

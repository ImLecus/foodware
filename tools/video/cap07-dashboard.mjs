import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  pausa,
  rotulo,
} from './lib.mjs';

await iniciarGrabacion();

async function guardar(handle) {
  const video = await cerrarContexto(handle);
  console.log(video);
}

async function grabar(nombre, fixture, fn) {
  await resetDb(fixture);
  const handle = await crearContexto({ nombre, usuario: 'encargado-1' });
  const page = await nuevaPagina(handle, '/dashboard');
  await fn(page);
  await guardar(handle);
}

await grabar('07a-dashboard-general', '/tmp/opencode/foodware-base.db', async (page) => {
  await rotulo(page, 'Historia 007 · Dashboard de estadísticas', 'Carmen, encargada, consulta el último día completado', 3200);
  await pausa(page, 1200);
  await rotulo(page, 'Total del día', '89,00 € vendidos el lunes 16 de noviembre', 3000);
  await pausa(page, 1000);
  await rotulo(page, 'Tres cuentas cerradas', 'La fecha se muestra en formato español', 2600);
  await pausa(page, 800);

  await page.mouse.wheel(0, 520);
  await pausa(page, 1100);
  await rotulo(page, 'Comparación con el día anterior', 'Día actual 89,00 €; día anterior 25,00 €; diferencia +64,00 €', 3400);
  await pausa(page, 1200);
  await rotulo(page, 'Tendencia de subida', 'Icono, texto y porcentaje con dos decimales', 2800);
  await pausa(page, 900);

  await page.mouse.wheel(0, 650);
  await pausa(page, 1000);
  await rotulo(page, 'Diferencia por camarero', 'Ana sube 28,00 €; Luis sube 36,00 € sin base de comparación', 3400);
  await pausa(page, 1000);

  await page.mouse.wheel(0, 650);
  await pausa(page, 1000);
  await rotulo(page, 'Diferencia por plato', 'Merluza baja; Flan sin variación; varios platos sin base', 3200);
  await pausa(page, 900);

  await page.mouse.wheel(0, 750);
  await pausa(page, 1000);
  await rotulo(page, 'Ventas por camarero', 'Todos los camareros activos, hayan vendido o no', 3000);
  await pausa(page, 900);

  await page.mouse.wheel(0, 750);
  await pausa(page, 1000);
  await rotulo(page, 'Ventas por plato', 'Todos los platos de la carta vigente, incluidos los que no se vendieron', 3400);
  await pausa(page, 900);
  await page.mouse.wheel(0, 700);
  await pausa(page, 1100);
  await rotulo(page, 'Flan y Merluza a cero', 'Aparecen con 0 unidades y 0,00 €', 2600);
  await pausa(page, 800);
});

await grabar('07b-sin-datos', '/tmp/opencode/foodware-nohist.db', async (page) => {
  await rotulo(page, 'Día sin ventas y sin historial', 'No hay ninguna cuenta cerrada anterior', 3000);
  await pausa(page, 1200);
  await rotulo(page, 'Total 0,00 €', 'Se avisa de que no hay ventas registradas para este día', 3000);
  await pausa(page, 1000);
  await page.mouse.wheel(0, 500);
  await pausa(page, 1000);
  await rotulo(page, 'Sin datos anteriores para comparar', 'No se inventa una comparación', 2800);
  await pausa(page, 1000);
});

await grabar('07c-sin-base', '/tmp/opencode/foodware-sinbase.db', async (page) => {
  await rotulo(page, 'Día anterior sin ventas, pero con historial', 'Existe historial anterior, pero el día previo sumó 0,00 €', 3400);
  await pausa(page, 1200);
  await page.mouse.wheel(0, 430);
  await pausa(page, 1000);
  await rotulo(page, 'Sin base de comparación', 'Se muestra la diferencia en euros y ningún porcentaje', 3200);
  await pausa(page, 1200);
  await page.mouse.wheel(0, 500);
  await pausa(page, 1000);
  await rotulo(page, 'También por camarero y por plato', 'Las filas sin ventas previas muestran la misma indicación', 3000);
  await pausa(page, 1000);
});

await grabar('07d-atribucion', '/tmp/opencode/foodware-atribucion.db', async (page) => {
  await rotulo(page, 'Atribución de una cuenta', 'La cuenta la abrió Luis y la cerró Ana', 2800);
  await pausa(page, 1200);
  await page.mouse.wheel(0, 950);
  await pausa(page, 1200);
  await rotulo(page, 'Se atribuye al camarero que abrió el pedido', 'Luis recibe la venta; no cambia por cerrarla Ana', 3200);
  await pausa(page, 1400);
});

await grabar('07e-dividida', '/tmp/opencode/foodware-dividida.db', async (page) => {
  await rotulo(page, 'Cuenta dividida en el dashboard', 'Una cuenta dividida cuenta una sola vez por su total', 3200);
  await pausa(page, 1200);
  await rotulo(page, 'Total y número de cuentas', 'Las partes pagadas no se suman por separado', 3000);
  await pausa(page, 1000);
  await page.mouse.wheel(0, 950);
  await pausa(page, 1100);
  await rotulo(page, 'El desglose sigue cuadrando', 'La venta se atribuye al camarero que abrió el pedido', 3000);
  await pausa(page, 1000);
});

await grabar('07f-historico', '/tmp/opencode/foodware-historico-nombre.db', async (page) => {
  await rotulo(page, 'Nombre histórico del plato', 'La Tarta se renombró después de venderse', 3000);
  await pausa(page, 1200);
  await page.mouse.wheel(0, 1400);
  await pausa(page, 1300);
  await rotulo(page, 'El dashboard conserva el nombre del momento de pedir', 'La carta actual puede mostrar otro nombre', 3200);
  await pausa(page, 1200);
});

await grabar('07g-cierre-hoy', '/tmp/opencode/foodware-hoycerrada.db', async (page) => {
  await rotulo(page, 'Hay una cuenta cerrada hoy', 'El dashboard no muestra datos parciales del día en curso', 3200);
  await pausa(page, 1200);
  await rotulo(page, 'Sigue mostrando el último día completado', 'Total 89,00 € y 3 cuentas del día anterior', 3200);
  await pausa(page, 1200);
});

// Error del servidor.
{
  await resetDb('/tmp/opencode/foodware-base.db');
  const handle = await crearContexto({ nombre: '07h-error-servidor', usuario: 'encargado-1' });
  const page = await nuevaPagina(handle, '/dashboard');
  await page.route('**/api/reports/daily*', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ mensaje: 'Error interno de prueba' }),
    }),
  );
  await page.reload();
  await pausa(page, 1600);
  await rotulo(page, 'Error del servidor', 'Se muestra el mensaje real, no el aviso de sin conexión', 3000);
  await pausa(page, 1000);
  await guardar(handle);
}

// Sin conexión.
{
  await resetDb('/tmp/opencode/foodware-base.db');
  const handle = await crearContexto({ nombre: '07i-sin-conexion', usuario: 'encargado-1' });
  const page = await nuevaPagina(handle, '/dashboard');
  await page.route('**/api/reports/daily*', (route) => route.abort());
  await page.reload();
  await pausa(page, 1600);
  await rotulo(page, 'Dashboard sin conexión', 'Aviso de que no se ha podido cargar el informe del día', 3000);
  await pausa(page, 1000);
  await page.unroute('**/api/reports/daily*');
  await guardar(handle);
}

await terminarGrabacion();

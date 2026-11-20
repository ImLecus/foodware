import {
  iniciarGrabacion,
  terminarGrabacion,
  resetDb,
  crearContexto,
  cerrarContexto,
  nuevaPagina,
  loginUI,
  logoutUI,
  pausa,
  rotulo,
  ir,
} from './lib.mjs';

await resetDb();
await iniciarGrabacion();

const videos = [];
async function guardar(handle) {
  const video = await cerrarContexto(handle);
  if (video) videos.push(video);
}

// A. Login incorrecto, login correcto y sesión.
{
  const handle = await crearContexto({ nombre: '01a-login', anonimo: true });
  const page = await nuevaPagina(handle, '/sala');
  await rotulo(page, 'Historia 000 · Autenticación', 'Sin sesión, cualquier ruta lleva al login', 2400);

  await pausa(page, 500);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await pausa(page, 1200);
  await rotulo(page, 'Campos obligatorios', 'El navegador impide enviar el formulario vacío', 2200);

  await page.fill('#login-usuario', 'usuario-inexistente');
  await page.fill('#login-password', 'demo1234');
  await pausa(page, 500);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await pausa(page, 1400);
  await rotulo(page, 'Usuario inexistente', 'Mensaje genérico: usuario o contraseña incorrectos', 2600);

  await page.fill('#login-usuario', 'camarero-1');
  await page.fill('#login-password', 'incorrecta');
  await pausa(page, 500);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await pausa(page, 1400);
  await rotulo(page, 'Contraseña incorrecta', 'Mismo mensaje, sin revelar si el usuario existe', 2600);

  await page.fill('#login-password', 'demo1234');
  await pausa(page, 400);
  await page.getByRole('button', { name: 'Entrar' }).click();
  await page.waitForURL('**/sala');
  await pausa(page, 1300);
  await rotulo(page, 'Acceso correcto', 'Ana, camarera; menú Sala, Señales y Cuentas', 2600);

  await page.reload();
  await pausa(page, 1200);
  await rotulo(page, 'Sesión persistente', 'Al recargar la página la sesión continúa', 2200);

  await ir(page, '/dashboard');
  await rotulo(page, 'Control de acceso', 'Un camarero no puede entrar al dashboard', 2600);

  await ir(page, '/no-existe');
  await rotulo(page, 'Ruta inexistente', 'Página no encontrada', 2200);

  await ir(page, '/login');
  await pausa(page, 1000);
  await rotulo(page, 'Ya autenticado', 'El login redirige al inicio del rol', 2200);

  await ir(page, '/sala');
  await pausa(page, 700);
  await logoutUI(page);
  await rotulo(page, 'Cierre de sesión', 'La sesión se invalida y vuelve al login', 2200);

  await ir(page, '/sala');
  await rotulo(page, 'Ruta protegida sin sesión', 'Vuelve al login, no muestra datos', 2400);

  await guardar(handle);
}

// B. Matriz de roles: cada uno entra directamente en su pantalla.
{
  const handle = await crearContexto({ nombre: '01b-rol-camarero', usuario: 'camarero-1' });
  const page = await nuevaPagina(handle, '/sala');
  await rotulo(page, 'Rol camarero', 'Sala, Señales y Cuentas', 2600);
  await pausa(page, 1200);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '01c-rol-cocinero', usuario: 'cocinero-entrantes' });
  const page = await nuevaPagina(handle, '/cocina');
  await rotulo(page, 'Rol cocinero', 'Solo Cocina y solo su partida', 2800);
  await pausa(page, 1800);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '01d-rol-encargado', usuario: 'encargado-1' });
  const page = await nuevaPagina(handle, '/dashboard');
  await rotulo(page, 'Rol encargado', 'Acceso al dashboard de estadísticas', 2800);
  await pausa(page, 2200);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '01e-rol-admin', usuario: 'admin-1' });
  const page = await nuevaPagina(handle, '/admin');
  await rotulo(page, 'Rol administrador', 'Gestión de la carta', 2800);
  await pausa(page, 1800);
  await guardar(handle);
}

{
  const handle = await crearContexto({ nombre: '01f-sin-partida', usuario: 'cocinero-sin-partida' });
  const page = await nuevaPagina(handle, '/cocina');
  await rotulo(page, 'Cocinero sin partida', 'Puede entrar, pero no puede operar en cocina', 3000);
  await pausa(page, 1600);
  await guardar(handle);
}

await terminarGrabacion();
console.log(JSON.stringify(videos, null, 2));

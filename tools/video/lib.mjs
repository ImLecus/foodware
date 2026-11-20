import { chromium, request } from 'playwright';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

export const REPO = '/home/lecus/Escritorio/IWEB/foodware';
export const BASE = 'http://localhost:5173';
export const API = 'http://localhost:3000';
export const VIDEO_DIR = path.join(REPO, 'tools/video/grabaciones');
export const FIXTURE_BASE = '/tmp/opencode/foodware-base.db';

fs.mkdirSync(VIDEO_DIR, { recursive: true });

const CURSOR_SCRIPT = () => {
  function crearCursor() {
    if (document.getElementById('cursor-grabacion')) return;
    const cursor = document.createElement('div');
    cursor.id = 'cursor-grabacion';
    cursor.style.cssText = `
      position: fixed; width: 20px; height: 20px;
      border: 2px solid #e53e3e; border-radius: 50%;
      background: rgba(229, 62, 62, 0.22);
      pointer-events: none; z-index: 2147483647;
      transform: translate(-50%, -50%);
      transition: left 70ms linear, top 70ms linear;
    `;
    document.body.appendChild(cursor);
    document.addEventListener('mousemove', (e) => {
      cursor.style.left = `${e.clientX}px`;
      cursor.style.top = `${e.clientY}px`;
    });
    document.addEventListener('click', (e) => {
      const onda = document.createElement('div');
      onda.style.cssText = `
        position: fixed; left: ${e.clientX}px; top: ${e.clientY}px;
        width: 12px; height: 12px; border: 2px solid #e53e3e;
        border-radius: 50%; pointer-events: none; z-index: 2147483647;
        transform: translate(-50%, -50%);
        animation: onda-click 420ms ease-out forwards;
      `;
      document.body.appendChild(onda);
      setTimeout(() => onda.remove(), 500);
    });
    const estilo = document.createElement('style');
    estilo.textContent = `@keyframes onda-click {
      from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
      to { opacity: 0; transform: translate(-50%, -50%) scale(4); }
    }`;
    document.head.appendChild(estilo);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearCursor);
  } else {
    crearCursor();
  }
};

export function pausa(page, ms = 900) {
  return page.waitForTimeout(ms);
}

export async function rotulo(page, titulo, detalle = '', ms = 2600) {
  await page.evaluate(
    ({ titulo, detalle }) => {
      let caja = document.getElementById('rotulo-demo');
      if (!caja) {
        caja = document.createElement('div');
        caja.id = 'rotulo-demo';
        caja.style.cssText = `
          position: fixed; left: 0; right: 0; bottom: 0;
          padding: 8px 18px 9px;
          background: linear-gradient(180deg, rgba(15,23,42,.78), rgba(15,23,42,.95));
          color: #fff; font-family: system-ui, sans-serif;
          z-index: 2147483646; pointer-events: none;
          text-align: center; line-height: 1.25;
        `;
        document.body.appendChild(caja);
      }
      caja.innerHTML = `
        <div style="font-size:17px;font-weight:700;letter-spacing:.2px">${titulo}</div>
        ${detalle ? `<div style="font-size:12px;opacity:.85;margin-top:2px">${detalle}</div>` : ''}
      `;
    },
    { titulo, detalle },
  );
  await pausa(page, ms);
}

export async function quitarRotulo(page) {
  await page.evaluate(() => document.getElementById('rotulo-demo')?.remove());
}

function esperar(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function esperarApp() {
  for (let i = 0; i < 80; i += 1) {
    try {
      const respuesta = await fetch(`${API}/api/health`);
      if (respuesta.ok) return;
    } catch {
      // todavía arrancando
    }
    await esperar(250);
  }
  throw new Error('La aplicación no responde en /api/health');
}

export function ejecutarSql(sql) {
  const script = `
    const Database = require('better-sqlite3');
    const db = new Database('/app/data/foodware.db');
    db.exec(${JSON.stringify(sql)});
    db.close();
  `;
  execSync('docker compose exec -T backend node --input-type=commonjs', {
    cwd: REPO,
    input: script,
    stdio: ['pipe', 'ignore', 'inherit'],
  });
}

export function pararBackend() {
  execSync('docker compose stop backend', { cwd: REPO, stdio: 'ignore' });
}

export async function arrancarBackend() {
  execSync('docker compose start backend', { cwd: REPO, stdio: 'ignore' });
  await esperarApp();
}

export async function resetDb(fixture = FIXTURE_BASE) {
  execSync('docker compose stop backend', { cwd: REPO, stdio: 'ignore' });
  for (const sufijo of ['', '-wal', '-shm']) {
    fs.rmSync(path.join(REPO, `backend/data/foodware.db${sufijo}`), { force: true });
  }
  fs.copyFileSync(fixture, path.join(REPO, 'backend/data/foodware.db'));
  execSync('docker compose start backend', { cwd: REPO, stdio: 'ignore' });
  await esperarApp();
}

export async function lanzarNavegador() {
  return chromium.launch({
    headless: true,
    slowMo: 120,
    args: ['--disable-dev-shm-usage'],
  });
}

async function estadoSesion(usuario, password) {
  const api = await request.newContext({ baseURL: API });
  const respuesta = await api.post('/api/auth/login', {
    data: { usuario, password },
  });
  if (!respuesta.ok()) {
    throw new Error(`No se pudo iniciar sesión como ${usuario}: ${respuesta.status()}`);
  }
  const estado = await api.storageState();
  await api.dispose();
  return estado;
}

export async function crearContexto({
  nombre,
  usuario = null,
  password = 'demo1234',
  anonimo = false,
  ancho = 1600,
  alto = 900,
} = {}) {
  const estado = anonimo ? undefined : await estadoSesion(usuario, password);
  const dir = path.join(VIDEO_DIR, `tmp-${nombre}`);
  fs.mkdirSync(dir, { recursive: true });
  const context = await contextGlobal.newContext({
    storageState: estado,
    viewport: { width: ancho, height: alto },
    locale: 'es-ES',
    timezoneId: 'Europe/Madrid',
    recordVideo: { dir, size: { width: ancho, height: alto } },
  });
  await context.addInitScript(CURSOR_SCRIPT);
  return { context, dir, nombre };
}

let contextGlobal = null;

export async function iniciarGrabacion() {
  contextGlobal = await lanzarNavegador();
}

export async function terminarGrabacion() {
  if (contextGlobal) await contextGlobal.close();
  contextGlobal = null;
}

export async function cerrarContexto(handle) {
  await handle.context.close();
  const archivos = fs
    .readdirSync(handle.dir)
    .filter((archivo) => archivo.endsWith('.webm'))
    .sort((a, b) => {
      const fa = fs.statSync(path.join(handle.dir, a)).mtimeMs;
      const fb = fs.statSync(path.join(handle.dir, b)).mtimeMs;
      return fa - fb;
    });
  if (archivos.length === 0) {
    console.warn(`Sin vídeo para ${handle.nombre}`);
    return null;
  }
  const origen = path.join(handle.dir, archivos.at(-1));
  const destino = path.join(VIDEO_DIR, `${handle.nombre}.webm`);
  fs.rmSync(destino, { force: true });
  fs.renameSync(origen, destino);
  fs.rmSync(handle.dir, { recursive: true, force: true });
  return destino;
}

export async function nuevaPagina(handle, ruta = '/login') {
  const page = await handle.context.newPage();
  await page.goto(`${BASE}${ruta}`);
  await pausa(page, 1200);
  return page;
}

export async function loginUI(page, usuario, password = 'demo1234') {
  await page.goto(`${BASE}/login`);
  await pausa(page, 800);
  await page.fill('#login-usuario', usuario);
  await pausa(page, 350);
  await page.fill('#login-password', password);
  await pausa(page, 350);
  await page.click('button[type="submit"]');
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 15000 });
  await pausa(page, 1200);
}

export async function logoutUI(page) {
  await page.getByRole('button', { name: 'Cerrar sesión' }).click();
  await page.waitForURL('**/login');
  await pausa(page, 900);
}

export async function seleccionarMesa(page, numero) {
  await page.getByRole('button', { name: new RegExp(`^Mesa ${numero}\\b`) }).click();
  await pausa(page, 700);
}

export async function abrirMesa(page, numero) {
  await seleccionarMesa(page, numero);
  await page.getByRole('button', { name: `Abrir Mesa ${numero}` }).click();
  await pausa(page, 1100);
}

export async function anadirPlato(page, nombre, cantidad = 1, indicaciones = '') {
  const cantidadInput = page.getByLabel(`Cantidad para ${nombre}`);
  await cantidadInput.fill(String(cantidad));
  await pausa(page, 250);
  const indicacionesInput = page.getByLabel(`Indicaciones para ${nombre}`);
  await indicacionesInput.fill(indicaciones);
  await pausa(page, 250);
  await page.getByRole('button', { name: `Añadir ${nombre}` }).click();
  await pausa(page, 950);
}

export async function ir(page, ruta) {
  await page.goto(`${BASE}${ruta}`);
  await pausa(page, 1300);
}

export async function captura(page, nombre) {
  await page.screenshot({ path: path.join(VIDEO_DIR, `${nombre}.png`), fullPage: true });
}

export function tarjetaEditor(page) {
  return page
    .locator('div.chakra-card')
    .filter({ has: page.getByRole('heading', { name: /Editar pedido/ }) })
    .last();
}

export function tarjetaPedidoCocina(page, numeroMesa) {
  return page
    .locator('[data-testid^="pedido-"]')
    .filter({ has: page.getByText(`Mesa ${numeroMesa}`, { exact: true }) });
}


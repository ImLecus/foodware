# Guía para que un agente de IA grabe el vídeo

> Resumen: para esta aplicación lo más fiable es **Playwright + Chromium + ffmpeg**.
> Playwright ejecuta las acciones y graba el navegador; ffmpeg monta el vídeo final.
> No hace falta un agente que controle un escritorio completo.

## 1. Qué hay ya instalado en este equipo

| Herramienta | Estado |
| --- | --- |
| Docker | Instalado (`/usr/bin/docker`). |
| Node.js | Instalado (v22.23.2). |
| npm | Instalado (10.9.8). |
| ffmpeg | Instalado (`/usr/bin/ffmpeg`). |
| Chromium / Chrome | **No instalado.** |
| Playwright | **No instalado.** |
| Xvfb / escritorio virtual | No instalado, y no es necesario para la opción recomendada. |

## 2. Opción recomendada: Playwright grabando el navegador

### 2.1. Instalación local

Desde la raíz del repositorio:

```bash
cd /home/lecus/Escritorio/IWEB/foodware
npm install -D playwright
npx playwright install chromium
npx playwright install-deps chromium
```

`install-deps` instala librerías del sistema y puede pedir la contraseña de `sudo`:

```bash
sudo npx playwright install-deps chromium
```

Si no quieres tocar el `package.json` de la aplicación, crea un proyecto aparte:

```bash
mkdir -p /home/lecus/Escritorio/IWEB/foodware/tools/video
cd /home/lecus/Escritorio/IWEB/foodware/tools/video
npm init -y
npm install playwright
npx playwright install chromium
```

### 2.2. Instalación con Docker, si no hay `sudo`

La imagen oficial de Playwright ya trae Chromium y las dependencias:

```bash
docker run --rm -it \
  --network host \
  -v /home/lecus/Escritorio/IWEB/foodware:/work \
  -w /work \
  mcr.microsoft.com/playwright:latest \
  bash
```

Dentro del contenedor:

```bash
npx playwright --version
```

En Linux, `--network host` permite que el contenedor llegue a
`http://localhost:5173` y `http://localhost:3000`. Si usas Docker Desktop, cambia
`localhost` por `host.docker.internal` en las URLs del script.

### 2.3. Arrancar la aplicación

En otra terminal:

```bash
cd /home/lecus/Escritorio/IWEB/foodware
docker compose up --build -d
docker compose exec backend npm run seed
```

Comprobar:

```bash
curl http://localhost:3000/api/health
```

Abrir en el navegador normal:

```text
http://localhost:5173
```

### 2.4. Resetear los datos entre tomas

```bash
cd /home/lecus/Escritorio/IWEB/foodware
docker compose stop backend
rm -f backend/data/foodware.db
docker compose start backend
docker compose exec backend npm run seed
```

Antes de grabar, aplicar las correcciones de datos indicadas en
[`casos-y-caminos.md`](./casos-y-caminos.md), sección 2.4.

## 3. Script mínimo de grabación

Crea `tools/video/grabar.mjs`:

```js
import { chromium } from 'playwright';
import { mkdir } from 'node:fs/promises';

await mkdir('grabaciones', { recursive: true });

const browser = await chromium.launch({
  headless: true,
  slowMo: 250, // pausa entre acciones para que el vídeo sea legible
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  locale: 'es-ES',
  timezoneId: 'Europe/Madrid',
  recordVideo: {
    dir: 'grabaciones',
    size: { width: 1920, height: 1080 },
  },
});

const page = await context.newPage();

// Cursor visible y resaltado de clics dentro del vídeo.
await page.addInitScript(() => {
  function crearCursor() {
    if (document.getElementById('cursor-grabacion')) return;

    const cursor = document.createElement('div');
    cursor.id = 'cursor-grabacion';
    cursor.style.cssText = `
      position: fixed;
      width: 22px;
      height: 22px;
      border: 2px solid #e53e3e;
      border-radius: 50%;
      background: rgba(229, 62, 62, 0.25);
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-50%, -50%);
      transition: left 80ms linear, top 80ms linear;
    `;
    document.body.appendChild(cursor);

    document.addEventListener('mousemove', (evento) => {
      cursor.style.left = `${evento.clientX}px`;
      cursor.style.top = `${evento.clientY}px`;
    });

    document.addEventListener('click', (evento) => {
      const onda = document.createElement('div');
      onda.style.cssText = `
        position: fixed;
        left: ${evento.clientX}px;
        top: ${evento.clientY}px;
        width: 12px;
        height: 12px;
        border: 2px solid #e53e3e;
        border-radius: 50%;
        pointer-events: none;
        z-index: 2147483647;
        transform: translate(-50%, -50%);
        animation: onda-click 450ms ease-out forwards;
      `;
      document.body.appendChild(onda);
      setTimeout(() => onda.remove(), 500);
    });

    const estilo = document.createElement('style');
    estilo.textContent = `
      @keyframes onda-click {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(4); }
      }
    `;
    document.head.appendChild(estilo);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', crearCursor);
  } else {
    crearCursor();
  }
});

async function pausa(ms = 600) {
  await page.waitForTimeout(ms);
}

async function login(usuario, password) {
  await page.goto('http://localhost:5173/login');
  await pausa();
  await page.fill('#login-usuario', usuario);
  await pausa(300);
  await page.fill('#login-password', password);
  await pausa(300);
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await pausa();
}

// Escena de ejemplo: login incorrecto, login correcto y abrir Mesa 10.
await page.goto('http://localhost:5173/login');
await pausa();

await page.fill('#login-usuario', 'camarero-1');
await page.fill('#login-password', 'incorrecta');
await page.click('button[type="submit"]');
await page.waitForSelector('[role="alert"]');
await pausa(1200);

await page.fill('#login-password', 'demo1234');
await page.click('button[type="submit"]');
await page.waitForURL('**/sala');
await pausa(1000);

await page.getByRole('button', { name: 'Mesa 10' }).click();
await pausa();
await page.getByRole('button', { name: 'Abrir Mesa 10' }).click();
await pausa(1200);

// Guardar el vídeo: Playwright lo escribe al cerrar el contexto.
await context.close();
await browser.close();
```

Ejecutar:

```bash
cd /home/lecus/Escritorio/IWEB/foodware/tools/video
node grabar.mjs
```

El vídeo aparece en `tools/video/grabaciones/` como `.webm`.

## 4. Grabar varios roles a la vez

Cada rol necesita un **contexto de navegador distinto** para que las cookies no se
mezclen. Cada contexto genera su propio vídeo:

```js
const camarero = await browser.newContext({ recordVideo: { dir: 'camarero' } });
const cocina = await browser.newContext({ recordVideo: { dir: 'cocina' } });

const paginaCamarero = await camarero.newPage();
const paginaCocina = await cocina.newPage();
```

Para una escena de pantalla dividida, graba los dos vídeos por separado y únelos con
ffmpeg:

```bash
ffmpeg \
  -i camarero.webm \
  -i cocina.webm \
  -filter_complex "[0:v]scale=960:1080[l];[1:v]scale=960:1080[r];[l][r]hstack=inputs=2" \
  -c:v libx264 -pix_fmt yuv420p -crf 23 \
  pantalla-dividida.mp4
```

Para una secuencia normal, graba cada escena en un archivo y concatena:

```bash
# lista.txt
file 'escena-01.webm'
file 'escena-02.webm'
file 'escena-03.webm'

ffmpeg -f concat -safe 0 -i lista.txt -c copy video-completo.mp4
```

## 5. Convertir el `.webm` a `.mp4`

```bash
ffmpeg -i grabacion.webm \
  -c:v libx264 -pix_fmt yuv420p -crf 23 \
  -c:a aac -b:a 160k \
  video-final.mp4
```

Si no hay audio:

```bash
ffmpeg -i grabacion.webm -c:v libx264 -pix_fmt yuv420p -crf 23 -an video-final.mp4
```

## 6. Sonido del aviso y voz en off

**Importante:** el vídeo de Playwright graba la pantalla, pero **no graba audio del
navegador**. El pitido del aviso de mesa completa no quedará en el `.webm`.

Opciones:

1. **Añadir el pitido en postproducción** con ffmpeg, en el momento exacto del aviso.
   Es lo más sencillo y repetible.
2. **Grabar el audio del sistema** con OBS o con el monitor de PulseAudio, mientras
   Playwright ejecuta las acciones. Es más frágil.
3. **Grabar la voz en off aparte** y montarla con ffmpeg. Para voz sintética:
   - `edge-tts` (online, voces españolas de Microsoft);
   - Piper (offline, requiere descargar una voz);
   - ElevenLabs, Azure Speech u otro servicio.

Ejemplo de audio de un pitido:

```bash
ffmpeg -f lavfi -i "sine=frequency=880:duration=0.4" pitido.wav
```

Mezclar voz y vídeo:

```bash
ffmpeg -i video-sin-audio.mp4 -i voz.wav -c:v copy -c:a aac -shortest video-con-voz.mp4
```

## 7. Subtítulos

Genera un `.srt` con los textos del guion y quémalos en el vídeo:

```bash
ffmpeg -i video.mp4 \
  -vf "subtitles=guion.srt:force_style='FontName=DejaVu Sans,FontSize=20'" \
  -c:a copy video-con-subtitulos.mp4
```

## 8. Si de verdad quieres un agente de escritorio

Solo tiene sentido si no quieres escribir un script y prefieres que el agente vea la
pantalla y decida clics. Necesitarías:

```bash
sudo apt install xvfb x11vnc novnc ffmpeg xdotool
```

Y arrancar un escritorio virtual:

```bash
Xvfb :99 -screen 0 1920x1080x24 &
export DISPLAY=:99
```

Grabar la pantalla:

```bash
ffmpeg -f x11grab -video_size 1920x1080 -framerate 30 -i :99 salida.mp4
```

Problemas:

- necesitas un modelo con control de ratón/teclado o un framework tipo computer-use;
- es más lento y menos reproducible;
- los clics pueden fallar por coordenadas, scroll o animaciones;
- el cursor sí se ve, pero el montaje es más complicado.

Para esta aplicación no lo recomiendo: el 95 % del trabajo se hace mejor con
Playwright.

## 9. Qué necesita el agente para trabajar

- Acceso de shell al repositorio.
- La aplicación arrancada en `http://localhost:5173`.
- Credenciales demo (`camarero-1` / `demo1234`, etc.).
- Playwright con Chromium instalado.
- ffmpeg para montar el vídeo.
- Una carpeta de salida, por ejemplo `tools/video/grabaciones/`.
- El estado de datos preparado y reseteable.
- Un guion con los pasos y los textos: el documento
  [`casos-y-caminos.md`](./casos-y-caminos.md).

## 10. Orden mínimo para empezar hoy

```bash
# 1. Dependencias del agente
cd /home/lecus/Escritorio/IWEB/foodware
npm install -D playwright
npx playwright install chromium
sudo npx playwright install-deps chromium

# 2. Aplicación
docker compose up --build -d
docker compose exec backend npm run seed

# 3. Comprobar
curl http://localhost:3000/api/health

# 4. Grabar una prueba
node tools/video/grabar.mjs

# 5. Convertir
ffmpeg -i tools/video/grabaciones/*.webm -c:v libx264 -pix_fmt yuv420p -crf 23 prueba.mp4
```

Si no hay `sudo`, usa la imagen Docker de Playwright del apartado 2.2.

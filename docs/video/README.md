# Vídeo de demostración de Foodware

## Resultado

- **Vídeo final:** [`salida/foodware-demo.mp4`](./salida/foodware-demo.mp4)
- **Duración:** 44 min 30 s
- **Resolución:** 1600 × 900
- **Formato:** MP4 H.264 con pista de audio (pitidos de aviso)
- **Contenido:** historias 000 a 008 y bloque final de casos técnicos y de borde.

El vídeo está dividido en capítulos con portadas. Dentro de cada capítulo aparecen
rótulos explicativos con el caso que se está demostrando.

## Índice de capítulos

| Hora  | Contenido                                                       |
| ----- | --------------------------------------------------------------- |
| 00:00 | Introducción                                                    |
| 00:12 | Historia 000 · Autenticación, sesión, roles y control de acceso |
| 03:22 | Historia 001 · Sala: abrir mesa, tomar pedido y confirmar       |
| 05:56 | Historia 002 · Editar un pedido enviado y cancelarlo            |
| 11:36 | Historia 003 · Cocina: pedidos pendientes por partida           |
| 14:38 | Historias 004 y 005 · Platos listos y señales de mesa completa  |
| 21:04 | Historia 006 · Cierre, división de cuenta y ticket              |
| 27:40 | Historia 007 · Dashboard de estadísticas                        |
| 33:20 | Historia 008 · Gestión de la carta                              |
| 38:12 | Casos técnicos y de borde                                       |
| 44:20 | Cierre                                                          |

## Qué se demuestra

- Login incorrecto, usuario inexistente, campos vacíos y login correcto.
- Sesión persistente, logout, acceso denegado por rol y ruta inexistente.
- Matriz de roles: camarero, cocinero, encargado y administrador.
- Cocinero sin partida asignada.
- Abrir mesa, añadir platos, cantidades, indicaciones, repeticiones, agrupación por
  partidas, ajustes, retirada de líneas, confirmación y anulación.
- Cocina filtrada por partida, orden por espera, empate, aviso «Modificado», espera
  superior a una hora y actualización por SSE.
- Marcar platos listos, deshacer, aviso temporal «Pedido completado» y momento de
  preparación.
- Estado de platos por mesa, aviso visual y sonoro de mesa completa, silencio
  persistente, descarte y recálculo tras editar.
- Edición de pedidos enviados, cambios pendientes, envío explícito a cocina, bloqueo
  entre camareros, expiración del bloqueo, última línea protegida y cancelación total.
- Cuenta a cero, cierre bloqueado por platos pendientes, cobro único, ticket, división
  en partes iguales con redondeo, división por consumo, plato compartido, pago por
  partes, reversión, ticket único y reutilización de mesa.
- Cuenta modificada tras confirmar la división y bloqueo por partes pagadas.
- Dashboard: total del día completado, fecha, desgloses, comparación, subida, bajada,
  sin variación, sin base de comparación, sin historial, atribución al camarero que
  abrió la cuenta, cuenta dividida, nombre histórico y cierres de hoy.
- Carta: crear y editar platos, precios, ingredientes, asociaciones, baja manual,
  agotamiento, disponibilidad combinada, reflejo en sala y conservación de pedidos ya
  enviados.
- Casos técnicos: sin conexión en sala, editor, cocina, señales y cuentas; errores de
  carga; sesión caducada; bloqueo expirado; estados vacíos.

## Casos verificados fuera de cámara

Por su naturaleza no se graban en la interfaz, pero están cubiertos por la API y las
pruebas automatizadas:

- `401` sin sesión y `403` con rol incorrecto.
- Rechazo de escrituras con `Origin` no permitido.
- Contraseñas con hash no reversible.
- Autenticación de los canales SSE.
- Apertura duplicada de una mesa.
- Comprobaciones de contrato de cuentas, dashboard y carta.
- Migraciones, seed y pruebas de backend y frontend.

Se puede ejecutar:

```bash
cd /home/lecus/Escritorio/IWEB/foodware
npm test
```

## Cómo se ha generado

Herramientas:

- Docker Compose para backend y frontend.
- Playwright con Chromium para automatizar y grabar el navegador.
- ffmpeg para convertir, unir, generar portadas y añadir los pitidos.

Scripts en `tools/video/`:

| Archivo                                 | Uso                                                           |
| --------------------------------------- | ------------------------------------------------------------- |
| `lib.mjs`                               | Utilidades de Playwright, sesiones, vídeo, rótulos y SQL.     |
| `preparar-db.mjs`                       | Limpia los pedidos históricos del seed y deja el estado base. |
| `preparar-fixtures.mjs`                 | Genera las copias de base de datos para los casos especiales. |
| `cap01-auth.mjs` … `cap09-tecnicos.mjs` | Grabación de cada capítulo.                                   |
| `ensamblar.mjs`                         | Genera portadas, convierte clips y monta el MP4 final.        |

## Reproducir

```bash
cd /home/lecus/Escritorio/IWEB/foodware

# Aplicación
docker compose up --build -d
docker compose exec backend npm run seed
node tools/video/preparar-db.mjs

# Playwright
cd tools/video
npm install
npx playwright install chromium

# Grabación por capítulos
node cap01-auth.mjs
node cap02-sala.mjs
node cap03-cocina.mjs
node cap04-listos-senales.mjs
node cap05-edicion.mjs
node cap05k-aviso.mjs
node cap06-cuentas.mjs
node cap07-dashboard.mjs
node cap08-admin.mjs
node cap09-tecnicos.mjs
node cap09b-offline.mjs
node cap09k-cuenta-cambiada.mjs
node cap01g-denegado.mjs

# Montaje
node ensamblar.mjs
```

El resultado se guarda en `docs/video/salida/foodware-demo.mp4`.

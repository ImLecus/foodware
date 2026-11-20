import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const REPO = '/home/lecus/Escritorio/IWEB/foodware';
const GRAB = path.join(REPO, 'tools/video/grabaciones');
const OUT = path.join(REPO, 'docs/video/salida');
const FONT_BOLD = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';
const FONT = '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf';

fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(path.join(OUT, 'intermedios'), { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'intermedios'), { recursive: true });

function ff(args, opts = {}) {
  execFileSync('ffmpeg', args, { stdio: 'inherit', ...opts });
}

function tarjeta(nombre, titulo, subtitulo, duracion = 4) {
  const archivoTitulo = path.join(OUT, `titulo-${nombre}.txt`);
  const archivoSub = path.join(OUT, `subtitulo-${nombre}.txt`);
  fs.writeFileSync(archivoTitulo, titulo, 'utf8');
  fs.writeFileSync(archivoSub, subtitulo, 'utf8');
  const salida = path.join(OUT, 'intermedios', `${nombre}.mp4`);
  const filtro = [
    'drawbox=x=0:y=0:w=1600:h=8:color=0d9488:t=fill',
    'drawbox=x=0:y=892:w=1600:h=8:color=0d9488:t=fill',
    `drawtext=fontfile=${FONT}:text='FOODWARE · DEMO FUNCIONAL':fontcolor=94a3b8:fontsize=22:x=(w-text_w)/2:y=130`,
    `drawtext=fontfile=${FONT_BOLD}:textfile=${archivoTitulo}:fontcolor=ffffff:fontsize=58:x=(w-text_w)/2:y=(h-text_h)/2-40`,
    `drawtext=fontfile=${FONT}:textfile=${archivoSub}:fontcolor=cbd5e1:fontsize=30:x=(w-text_w)/2:y=(h-text_h)/2+55`,
  ].join(',');
  ff([
    '-y',
    '-f', 'lavfi',
    '-i', `color=c=0b1220:s=1600x900:d=${duracion}:r=25`,
    '-vf', filtro,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', '20',
    '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    salida,
  ]);
  return salida;
}

function convertir(origen, nombre) {
  const salida = path.join(OUT, 'intermedios', `${nombre}.mp4`);
  ff([
    '-y',
    '-i', origen,
    '-vf', 'scale=1600:900:force_original_aspect_ratio=decrease,pad=1600:900:(ow-iw)/2:(oh-ih)/2,fps=25,format=yuv420p',
    '-c:v', 'libx264',
    '-preset', 'veryfast',
    '-crf', '21',
    '-an',
    '-movflags', '+faststart',
    salida,
  ]);
  return salida;
}

const introduccion = tarjeta(
  'intro',
  'FOODWARE',
  'Sistema de comandas para restaurante · Demostración funcional de las historias 000–008',
  6,
);

const capitulos = [
  {
    titulo: tarjeta('cap000', 'Historia 000', 'Autenticación, sesión, roles y control de acceso'),
    clips: [
      '01a-login',
      '01b-rol-camarero',
      '01c-rol-cocinero',
      '01d-rol-encargado',
      '01e-rol-admin',
      '01f-sin-partida',
      '01g-acceso-denegado',
    ],
  },
  {
    titulo: tarjeta('cap001', 'Historia 001', 'Sala: abrir mesa, tomar el pedido y confirmarlo'),
    clips: ['02-sala-001'],
  },
  {
    titulo: tarjeta('cap002', 'Historia 002', 'Editar un pedido ya enviado y cancelarlo'),
    clips: [
      '05a-editar-pedido',
      '05b-cocina-tras-editar',
      '05c-bloqueo-a',
      '05d-bloqueo-b',
      '05e-ultima-linea',
      '05f-cancelar-enviado',
      '05g-prepara-cantidad',
      '05h-cantidad-cocina',
      '05i-cantidad-editor',
      '05j-cantidad-cocina-final',
    ],
  },
  {
    titulo: tarjeta('cap003', 'Historia 003', 'Cocina: pedidos pendientes por partida y tiempo de espera'),
    clips: [
      '03a-cocina-entrantes',
      '03b-cocina-principales',
      '03c-cocina-postres',
      '03d-camarero-nuevo-pedido',
      '03e-cocina-nuevo-pedido',
    ],
  },
  {
    titulo: tarjeta('cap004005', 'Historias 004 y 005', 'Marcar platos listos y señales de mesa completa'),
    clips: [
      '04a-camarero-prepara',
      '04b-listos-entrantes',
      '04c-listos-principales',
      '04d-listos-postres',
      '04e-senales',
      '05k-recalculo-aviso',
      '05k-estado-sin-aviso',
      '05k-cocina-completa',
      '05k-cocina-postres',
      '05k-estado-nuevo-aviso',
      '05l-cierre-aviso',
    ],
  },
  {
    titulo: tarjeta('cap006', 'Historia 006', 'Cierre, división de cuenta, pagos por partes y ticket final'),
    clips: [
      '06a-revisar-cuenta',
      '06b-prepara-mesa10',
      '06c-cobro-unico',
      '06d-ticket-cerrado',
      '06e-reutilizar-mesa',
      '06f-cuenta-vacia',
      '06g-division-consumo',
      '06h-division-igual',
      '06i-prepara-una-parte',
      '06j-una-parte',
    ],
  },
  {
    titulo: tarjeta('cap007', 'Historia 007', 'Dashboard: totales, desgloses y comparación con días anteriores'),
    clips: [
      '07a-dashboard-general',
      '07b-sin-datos',
      '07c-sin-base',
      '07d-atribucion',
      '07e-dividida',
      '07f-historico',
      '07g-cierre-hoy',
      '07h-error-servidor',
      '07i-sin-conexion',
    ],
  },
  {
    titulo: tarjeta('cap008', 'Historia 008', 'Gestión de la carta, precios, ingredientes y disponibilidad'),
    clips: [
      '08a-pedido-previo',
      '08b-admin-carta',
      '08c-sala-carta',
      '08d-pedido-historico',
      '08e-admin-historico',
    ],
  },
  {
    titulo: tarjeta('cap009', 'Casos técnicos y de borde', 'Sin conexión, errores, caducidades, concurrencia y estados vacíos'),
    clips: [
      '09a-sala-offline',
      '09b-editor-offline',
      '09c-cocina-offline',
      '09d-cocina-error',
      '09e-senales-offline',
      '09f-cuentas-offline',
      '09g-cuentas-error',
      '09h-admin-error',
      '09i-sesion-expirada',
      '09j-bloqueo-expirado',
      '09k-cuenta-cambiada',
      '09l-cocina-vacia',
      '09m-senales-vacias',
      '09n-cuentas-vacias',
    ],
  },
];

const cierre = tarjeta(
  'outro',
  'FIN DE LA DEMOSTRACIÓN',
  'Foodware · Historias 000–008 y casos de borde',
  5,
);

const lista = [];
lista.push(introduccion);
for (const capitulo of capitulos) {
  lista.push(capitulo.titulo);
  for (const clip of capitulo.clips) {
    const origen = path.join(GRAB, `${clip}.webm`);
    if (!fs.existsSync(origen)) {
      console.warn('Falta el clip', origen);
      continue;
    }
    console.log('Convirtiendo', clip);
    lista.push(convertir(origen, clip));
  }
}
lista.push(cierre);

const archivoLista = path.join(OUT, 'lista.txt');
fs.writeFileSync(
  archivoLista,
  lista.map((archivo) => `file '${archivo.replaceAll("'", "'\\''")}'`).join('\n'),
  'utf8',
);

const final = path.join(OUT, 'foodware-demo.mp4');
ff([
  '-y',
  '-f', 'concat',
  '-safe', '0',
  '-i', archivoLista,
  '-c', 'copy',
  '-movflags', '+faststart',
  final,
]);

console.log('Vídeo final:', final);

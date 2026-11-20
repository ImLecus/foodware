const ZONA = 'Europe/Madrid';

const formatoFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const formatoDesfase = new Intl.DateTimeFormat('en-US', {
  timeZone: ZONA,
  timeZoneName: 'longOffset',
});

function desfaseMinutos(instante) {
  const zona = formatoDesfase
    .formatToParts(instante)
    .find((parte) => parte.type === 'timeZoneName')?.value;
  const coincidencia = /GMT([+-])(\d{2}):(\d{2})/.exec(zona ?? '');
  if (!coincidencia) return 0;
  const signo = coincidencia[1] === '-' ? -1 : 1;
  return signo * (Number(coincidencia[2]) * 60 + Number(coincidencia[3]));
}

function aTextoUtc(milisegundos) {
  return new Date(milisegundos).toISOString().slice(0, 19).replace('T', ' ');
}

function aMilisegundos(isoFecha) {
  const [anio, mes, dia] = isoFecha.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

/**
 * Fecha natural (`YYYY-MM-DD`) en Europe/Madrid del instante indicado.
 */
export function fechaEnMadrid(instante = new Date()) {
  return formatoFecha.format(instante);
}

/**
 * Límites UTC del día natural Europe/Madrid indicado: `inicio` inclusivo y
 * `fin` exclusivo, en formato `YYYY-MM-DD HH:MM:SS` (UTC), comparable con los
 * valores que genera `datetime('now')` de SQLite. Maneja los cambios de hora.
 */
export function limitesDelDia(isoFecha) {
  const inicio = inicioDelDia(isoFecha);
  const fin = inicioDelDia(fechaSiguiente(isoFecha));
  return { inicio: aTextoUtc(inicio), fin: aTextoUtc(fin) };
}

/**
 * Día natural inmediatamente anterior (`YYYY-MM-DD`).
 */
export function diaAnterior(isoFecha) {
  const dias = 24 * 60 * 60 * 1000;
  return new Date(aMilisegundos(isoFecha) - dias).toISOString().slice(0, 10);
}

function fechaSiguiente(isoFecha) {
  const dias = 24 * 60 * 60 * 1000;
  return new Date(aMilisegundos(isoFecha) + dias).toISOString().slice(0, 10);
}

function inicioDelDia(isoFecha) {
  const ingenuo = aMilisegundos(isoFecha);
  const desfase = desfaseMinutos(new Date(ingenuo));
  const inicio = ingenuo - desfase * 60 * 1000;
  // Segunda pasada: el desfase puede variar si el día cruza un cambio de hora.
  return ingenuo - desfaseMinutos(new Date(inicio)) * 60 * 1000;
}

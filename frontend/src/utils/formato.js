const formatoEuro = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
});

const formatoFecha = new Intl.DateTimeFormat('es-ES', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
});

const formatoHora = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
});

/** Importe en céntimos a texto en euros con formato español. */
export function formatearEuros(centimos) {
  return formatoEuro.format((centimos ?? 0) / 100);
}

export function formatearFecha(fecha) {
  return formatoFecha.format(new Date(fecha));
}

export function formatearHora(fecha) {
  return formatoHora.format(new Date(fecha));
}

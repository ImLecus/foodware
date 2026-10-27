export function formatearEuros(centimos) {
  const euros = centimos / 100;
  return euros.toLocaleString('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function formatearFecha(isoFecha) {
  if (!isoFecha) return '';
  const fecha = new Date(`${isoFecha}T00:00:00`);
  return fecha.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export function formatearFechaLarga(isoFecha) {
  if (!isoFecha) return '';
  const fecha = new Date(`${isoFecha}T00:00:00`);
  return fecha.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

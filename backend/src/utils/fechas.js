/** Convierte una fecha de SQLite (UTC) o ISO a ISO 8601. */
export function aISO(valor) {
  if (!valor) return null;
  if (valor.includes('T')) return new Date(valor).toISOString();
  return new Date(`${valor.replace(' ', 'T')}Z`).toISOString();
}

function leerBloqueoInactividad(valor) {
  const minutos = Number(valor ?? 15);
  return Number.isInteger(minutos) && minutos > 0 ? minutos : 15;
}

function leerMinutosSesion(valor) {
  const minutos = Number(valor ?? 720);
  return Number.isInteger(minutos) && minutos > 0 ? minutos : 720;
}

export const config = {
  port: Number(process.env.PORT ?? 3000),
  dbPath: process.env.DB_PATH ?? './data/foodware.db',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  bloqueoInactividadMinutos: leerBloqueoInactividad(process.env.BLOQUEO_INACTIVIDAD_MINUTOS),
  sessionTtlMinutes: leerMinutosSesion(process.env.SESSION_TTL_MINUTES),
  sessionCookieName: process.env.SESSION_COOKIE_NAME ?? 'foodware_session',
  sessionCookieSecure: process.env.SESSION_COOKIE_SECURE === 'true',
};

import { config } from '../config.js';

export function leerCookie(req, nombre = config.sessionCookieName) {
  const cabecera = req.headers?.cookie;
  if (!cabecera) return null;

  for (const parte of cabecera.split(';')) {
    const indice = parte.indexOf('=');
    if (indice === -1) continue;
    const clave = parte.slice(0, indice).trim();
    if (clave !== nombre) continue;
    try {
      return decodeURIComponent(parte.slice(indice + 1).trim());
    } catch {
      return null;
    }
  }

  return null;
}

export function cookieSesion(token, { maxAgeSegundos = config.sessionTtlMinutes * 60 } = {}) {
  const atributos = [
    `${config.sessionCookieName}=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSegundos}`,
  ];
  if (config.sessionCookieSecure) atributos.push('Secure');
  return atributos.join('; ');
}

export function cookieSesionBorrada() {
  const atributos = [
    `${config.sessionCookieName}=`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    'Max-Age=0',
    'Expires=Thu, 01 Jan 1970 00:00:00 GMT',
  ];
  if (config.sessionCookieSecure) atributos.push('Secure');
  return atributos.join('; ');
}

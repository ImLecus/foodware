import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

const COSTE = 16_384;
const BLOQUE = 8;
const PARALELISMO = 1;
const LONGITUD_CLAVE = 64;

/** Hash versionado: `scrypt$N$r$p$salt$hash`. */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, LONGITUD_CLAVE, {
    N: COSTE,
    r: BLOQUE,
    p: PARALELISMO,
  }).toString('hex');

  return `scrypt$${COSTE}$${BLOQUE}$${PARALELISMO}$${salt}$${hash}`;
}

export function verifyPassword(password, almacenado) {
  if (typeof almacenado !== 'string') return false;

  const [algoritmo, coste, bloque, paralelismo, salt, hash] = almacenado.split('$');
  if (algoritmo !== 'scrypt' || !salt || !hash) return false;

  try {
    const esperado = Buffer.from(hash, 'hex');
    const calculado = scryptSync(password, salt, esperado.length, {
      N: Number(coste),
      r: Number(bloque),
      p: Number(paralelismo),
    });

    return esperado.length === calculado.length && timingSafeEqual(esperado, calculado);
  } catch {
    return false;
  }
}

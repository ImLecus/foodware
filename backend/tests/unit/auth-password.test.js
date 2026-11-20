import { describe, expect, it } from 'vitest';
import { hashPassword, verifyPassword } from '../../src/auth/password.js';

describe('hash y verificación de contraseñas', () => {
  it('genera un hash scrypt con salt y nunca guarda la contraseña en claro', () => {
    const hash = hashPassword('demo1234');

    expect(hash).toMatch(/^scrypt\$\d+\$\d+\$\d+\$[0-9a-f]+\$[0-9a-f]+$/);
    expect(hash).not.toContain('demo1234');
  });

  it('usa salts distintos para la misma contraseña', () => {
    expect(hashPassword('demo1234')).not.toBe(hashPassword('demo1234'));
  });

  it('verifica la contraseña correcta y rechaza la incorrecta', () => {
    const hash = hashPassword('demo1234');

    expect(verifyPassword('demo1234', hash)).toBe(true);
    expect(verifyPassword('incorrecta', hash)).toBe(false);
  });

  it('rechaza hashes malformados sin lanzar', () => {
    expect(verifyPassword('demo1234', null)).toBe(false);
    expect(verifyPassword('demo1234', 'texto')).toBe(false);
    expect(verifyPassword('demo1234', 'scrypt$1$2$3$salt$zz')).toBe(false);
  });
});

import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

async function renderizarConRol(rol) {
  vi.resetModules();
  vi.stubEnv('VITE_ROL', rol);
  const { default: RutaEncargado } = await import('../../src/components/RutaEncargado.jsx');
  return render(
    <RutaEncargado>
      <p>contenido protegido</p>
    </RutaEncargado>,
  );
}

describe('RutaEncargado', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('muestra el contenido cuando el rol es encargado', async () => {
    await renderizarConRol('encargado');

    expect(screen.getByText('contenido protegido')).toBeInTheDocument();
  });

  it('muestra acceso restringido cuando el rol no es encargado', async () => {
    await renderizarConRol('camarero');

    expect(screen.getByText('Acceso restringido')).toBeInTheDocument();
    expect(screen.queryByText('contenido protegido')).not.toBeInTheDocument();
  });
});

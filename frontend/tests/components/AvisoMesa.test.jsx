import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AvisoMesa from '../../src/components/AvisoMesa.jsx';

function crearMesa(identificador = 'Mesa 1', id = 'mesa-1') {
  return {
    id,
    identificador,
    completa: true,
    aviso: {
      id: `aviso-${id}`,
      mesa_id: id,
      estado: 'activo',
      generado_en: '2026-10-27T09:00:00.000Z',
    },
    platos: [],
  };
}

function renderizar(props = {}) {
  const utilidades = {
    silenciado: false,
    onAlternarSonido: vi.fn(),
    onDescartar: vi.fn(),
  };

  render(
    <ChakraProvider>
      <AvisoMesa mesa={crearMesa()} {...utilidades} {...props} />
    </ChakraProvider>,
  );

  return utilidades;
}

describe('AvisoMesa', () => {
  it('muestra una señal visual que identifica inequívocamente la mesa', () => {
    renderizar();

    const alerta = screen.getByRole('alert');
    expect(alerta).toHaveTextContent('Mesa completa');
    expect(alerta).toHaveTextContent('Mesa 1');
  });

  it('mantiene la señal visible sin desaparecer por sí sola', () => {
    vi.useFakeTimers();
    try {
      renderizar();

      vi.advanceTimersByTime(5 * 60 * 1000);

      expect(screen.getByRole('alert')).toHaveTextContent('Mesa 1');
    } finally {
      vi.useRealTimers();
    }
  });

  it('distingue los avisos de varias mesas completas a la vez', () => {
    render(
      <ChakraProvider>
        <AvisoMesa mesa={crearMesa('Mesa 1', 'mesa-1')} silenciado={false} />
        <AvisoMesa mesa={crearMesa('Mesa 2', 'mesa-2')} silenciado={false} />
      </ChakraProvider>,
    );

    const alertas = screen.getAllByRole('alert');
    expect(alertas).toHaveLength(2);
    expect(alertas[0]).toHaveTextContent('Mesa 1');
    expect(alertas[1]).toHaveTextContent('Mesa 2');
  });

  it('ofrece el control de sonido activado y permite silenciarlo', () => {
    const { onAlternarSonido } = renderizar({ silenciado: false });

    const control = screen.getByRole('button', { name: 'Silenciar sonido' });
    expect(control).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(control);
    expect(onAlternarSonido).toHaveBeenCalledTimes(1);
  });

  it('muestra el control para reactivar el sonido cuando está silenciado', () => {
    const { onAlternarSonido } = renderizar({ silenciado: true });

    const control = screen.getByRole('button', { name: 'Activar sonido' });
    expect(control).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(control);
    expect(onAlternarSonido).toHaveBeenCalledTimes(1);
  });

  it('permite descartar el aviso con una sola acción', () => {
    const { onDescartar } = renderizar();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar aviso' }));

    expect(onDescartar).toHaveBeenCalledTimes(1);
  });
});

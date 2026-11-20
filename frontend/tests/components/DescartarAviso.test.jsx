import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AvisoMesa from '../../src/components/AvisoMesa.jsx';

const mesa = {
  id: 'mesa-1',
  identificador: 'Mesa 1',
  completa: true,
  aviso: {
    id: 'aviso-1',
    mesa_id: 'mesa-1',
    estado: 'activo',
    generado_en: '2026-10-27T09:00:00.000Z',
  },
  platos: [],
};

function renderizar(props = {}) {
  const onDescartar = vi.fn();

  render(
    <ChakraProvider>
      <AvisoMesa mesa={mesa} onDescartar={onDescartar} {...props} />
    </ChakraProvider>,
  );

  return { onDescartar };
}

describe('acción de descartar el aviso', () => {
  it('descarta el aviso con una sola acción', () => {
    const { onDescartar } = renderizar();

    fireEvent.click(screen.getByRole('button', { name: 'Descartar aviso' }));

    expect(onDescartar).toHaveBeenCalledTimes(1);
  });

  it('deshabilita la acción sin conexión y no envía la petición', () => {
    const { onDescartar } = renderizar({ descartarDeshabilitado: true });

    const boton = screen.getByRole('button', { name: 'Descartar aviso' });
    expect(boton).toBeDisabled();

    fireEvent.click(boton);
    expect(onDescartar).not.toHaveBeenCalled();
  });
});

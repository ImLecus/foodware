import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EditorPedido from '../src/components/EditorPedido.jsx';
import { tema } from '../src/theme/index.js';

vi.mock('../src/services/api.js', () => ({
  obtenerPedido: vi.fn(),
  listarPlatos: vi.fn(),
  abrirEdicion: vi.fn(),
  cerrarEdicion: vi.fn(),
  enviarCambios: vi.fn(),
  anadirLinea: vi.fn(),
  modificarLinea: vi.fn(),
  retirarLinea: vi.fn(),
}));

import {
  abrirEdicion,
  anadirLinea,
  cerrarEdicion,
  enviarCambios,
  listarPlatos,
  modificarLinea,
  obtenerPedido,
  retirarLinea,
} from '../src/services/api.js';

const linea = {
  id: 'linea-1',
  plato_id: 'plato-entrante',
  plato_nombre: 'Croquetas de jamón',
  cantidad: 2,
  precio_centimos: 850,
  indicaciones: '',
  partida: 'entrantes',
};

const pedidoEnviado = {
  id: 'pedido-1',
  mesa_id: 'mesa-1',
  estado: 'enviada',
  modificada: false,
  cambios_pendientes: false,
  lineas: [linea],
  por_partida: { entrantes: [linea], principales: [], postres: [] },
  bloqueo: { estado: 'libre', camarero_id: null, inactividad_minutos: 15 },
};

const platos = [
  {
    id: 'plato-entrante-2',
    nombre: 'Ensalada mixta',
    partida: 'entrantes',
    precio_centimos: 700,
    disponible: true,
  },
];

const mesa = { id: 'mesa-1', identificador: 'Mesa 1' };

function renderizar(props = {}) {
  const onCerrar = vi.fn();
  render(
    <ChakraProvider theme={tema}>
      <EditorPedido pedidoId="pedido-1" mesa={mesa} enLinea onCerrar={onCerrar} {...props} />
    </ChakraProvider>,
  );
  return { onCerrar };
}

function errorConCodigo(codigo, mensaje) {
  const error = new Error(mensaje);
  error.codigo = codigo;
  return error;
}

describe('Editor de pedido · bloqueo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    obtenerPedido.mockResolvedValue(pedidoEnviado);
    listarPlatos.mockResolvedValue(platos);
    abrirEdicion.mockResolvedValue({
      ...pedidoEnviado,
      bloqueo: { estado: 'bloqueado', camarero_id: 'camarero-1', inactividad_minutos: 15 },
    });
    cerrarEdicion.mockResolvedValue(null);
    enviarCambios.mockResolvedValue(null);
    anadirLinea.mockResolvedValue(null);
    modificarLinea.mockResolvedValue(null);
    retirarLinea.mockResolvedValue(null);
  });

  it('toma el bloqueo al abrir el editor', async () => {
    renderizar();

    expect(await screen.findByText('Croquetas de jamón')).toBeInTheDocument();
    expect(abrirEdicion).toHaveBeenCalledWith('pedido-1');
  });

  it('libera el bloqueo y cierra al cancelar la edición', async () => {
    const { onCerrar } = renderizar();
    await screen.findByText('Croquetas de jamón');

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar edición' }));

    await waitFor(() => {
      expect(cerrarEdicion).toHaveBeenCalledWith('pedido-1');
    });
    expect(onCerrar).toHaveBeenCalled();
  });

  it('avisa cuando el pedido está bloqueado por otro camarero', async () => {
    abrirEdicion.mockRejectedValue(
      errorConCodigo('pedido_bloqueado', 'El pedido está siendo editado por otro camarero'),
    );

    renderizar();

    expect(await screen.findByText(/bloqueado por otro camarero/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Volver' })).toBeInTheDocument();
  });

  it('avisa cuando el bloqueo ha expirado y permite reabrir', async () => {
    renderizar();
    await screen.findByText('Croquetas de jamón');
    modificarLinea.mockRejectedValue(
      errorConCodigo('bloqueo_expirado', 'El bloqueo de edición ha expirado'),
    );

    fireEvent.change(screen.getByLabelText('Cantidad de Croquetas de jamón'), {
      target: { value: '3' },
    });

    expect(await screen.findByText(/ha expirado/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Reabrir edición' }));

    await waitFor(() => {
      expect(abrirEdicion).toHaveBeenCalledTimes(2);
    });
  });
});

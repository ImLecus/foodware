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

const lineas = [
  {
    id: 'linea-1',
    plato_id: 'plato-entrante',
    plato_nombre: 'Croquetas de jamón',
    cantidad: 2,
    precio_centimos: 850,
    indicaciones: '',
    partida: 'entrantes',
  },
  {
    id: 'linea-2',
    plato_id: 'plato-principal',
    plato_nombre: 'Paella de marisco',
    cantidad: 1,
    precio_centimos: 1800,
    indicaciones: 'Sin marisco',
    partida: 'principales',
  },
];

const pedidoEnviado = {
  id: 'pedido-1',
  mesa_id: 'mesa-1',
  estado: 'enviada',
  modificada: false,
  cambios_pendientes: false,
  lineas,
  por_partida: { entrantes: [lineas[0]], principales: [lineas[1]], postres: [] },
  bloqueo: { estado: 'libre', camarero_id: null, inactividad_minutos: 15 },
};

const pedidoModificado = {
  ...pedidoEnviado,
  modificada: true,
  cambios_pendientes: true,
  bloqueo: { estado: 'bloqueado', camarero_id: 'camarero-1', inactividad_minutos: 15 },
};

const platos = [
  {
    id: 'plato-postre',
    nombre: 'Tarta de queso',
    partida: 'postres',
    precio_centimos: 600,
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

describe('Editor de pedido', () => {
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

  it('muestra las líneas del pedido enviado listas para editar', async () => {
    renderizar();

    expect(await screen.findByText('Croquetas de jamón')).toBeInTheDocument();
    expect(screen.getByText('Paella de marisco')).toBeInTheDocument();
    expect(screen.getByLabelText('Cantidad de Croquetas de jamón')).not.toBeDisabled();
    expect(screen.getByLabelText('Indicaciones de Croquetas de jamón')).not.toBeDisabled();
  });

  it('ajusta la cantidad y las indicaciones de una línea', async () => {
    renderizar();
    await screen.findByText('Croquetas de jamón');

    fireEvent.change(screen.getByLabelText('Cantidad de Croquetas de jamón'), {
      target: { value: '4' },
    });
    await waitFor(() => {
      expect(modificarLinea).toHaveBeenCalledWith('pedido-1', 'linea-1', { cantidad: 4 });
    });

    const indicaciones = screen.getByLabelText('Indicaciones de Croquetas de jamón');
    fireEvent.change(indicaciones, { target: { value: 'Sin sal' } });
    fireEvent.blur(indicaciones);

    await waitFor(() => {
      expect(modificarLinea).toHaveBeenCalledWith('pedido-1', 'linea-1', {
        indicaciones: 'Sin sal',
      });
    });
  });

  it('añade y retira platos sobre el pedido existente', async () => {
    renderizar();
    await screen.findByText('Croquetas de jamón');

    fireEvent.click(screen.getByRole('button', { name: 'Añadir Tarta de queso' }));
    await waitFor(() => {
      expect(anadirLinea).toHaveBeenCalledWith('pedido-1', 'plato-postre', 1);
    });

    fireEvent.click(screen.getAllByRole('button', { name: 'Quitar' })[0]);
    await waitFor(() => {
      expect(retirarLinea).toHaveBeenCalledWith('pedido-1', 'linea-1');
    });
  });

  it('muestra las marcas de modificada y cambios pendientes', async () => {
    obtenerPedido.mockResolvedValue(pedidoModificado);

    renderizar();

    expect(await screen.findByText('Modificada')).toBeInTheDocument();
    expect(screen.getByText('Cambios pendientes')).toBeInTheDocument();
  });

  it('envía los cambios de forma explícita y cierra el editor', async () => {
    obtenerPedido.mockResolvedValue(pedidoModificado);
    const { onCerrar } = renderizar();
    await screen.findByText('Modificada');

    fireEvent.click(screen.getByRole('button', { name: 'Enviar cambios' }));

    await waitFor(() => {
      expect(enviarCambios).toHaveBeenCalledWith('pedido-1');
    });
    expect(onCerrar).toHaveBeenCalled();
  });

  it('no permite enviar cambios sin conexión', async () => {
    obtenerPedido.mockResolvedValue(pedidoModificado);

    renderizar({ enLinea: false });

    expect(await screen.findByRole('button', { name: 'Enviar cambios' })).toBeDisabled();
    expect(screen.getByText(/Sin conexión/i)).toBeInTheDocument();
  });
});

import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Pedido from '../src/components/Pedido.jsx';
import SelectorPlatos from '../src/components/SelectorPlatos.jsx';
import { tema } from '../src/theme/index.js';

const lineas = [
  {
    id: 'linea-1',
    plato_id: 'plato-entrante',
    plato_nombre: 'Croquetas de jamón',
    cantidad: 2,
    precio_centimos: 850,
    partida: 'entrantes',
  },
  {
    id: 'linea-2',
    plato_id: 'plato-principal',
    plato_nombre: 'Paella de marisco',
    cantidad: 1,
    precio_centimos: 1800,
    partida: 'principales',
  },
  {
    id: 'linea-3',
    plato_id: 'plato-postre',
    plato_nombre: 'Tarta de queso',
    cantidad: 3,
    precio_centimos: 600,
    partida: 'postres',
  },
];

const pedido = {
  id: 'pedido-1',
  mesa_id: 'mesa-1',
  estado: 'en_curso',
  lineas,
  por_partida: {
    entrantes: [lineas[0]],
    principales: [lineas[1]],
    postres: [lineas[2]],
  },
};

const pedidoVacio = {
  ...pedido,
  lineas: [],
  por_partida: { entrantes: [], principales: [], postres: [] },
};

const mesa = { id: 'mesa-1', identificador: 'Mesa 1' };

function renderizar(ui) {
  return render(<ChakraProvider theme={tema}>{ui}</ChakraProvider>);
}

function propsPedido(extra = {}) {
  return {
    pedido,
    mesa,
    enLinea: true,
    onCambiarCantidad: () => {},
    onRetirarLinea: () => {},
    onConfirmar: () => {},
    onAnular: () => {},
    ...extra,
  };
}

describe('Pedido', () => {
  it('muestra los platos agrupados por entrantes, principales y postres', () => {
    renderizar(<Pedido {...propsPedido()} />);

    expect(screen.getByText('Entrantes')).toBeInTheDocument();
    expect(screen.getByText('Principales')).toBeInTheDocument();
    expect(screen.getByText('Postres')).toBeInTheDocument();
    expect(screen.getByText('Croquetas de jamón')).toBeInTheDocument();
    expect(screen.getByText('Paella de marisco')).toBeInTheDocument();
    expect(screen.getByText('Tarta de queso')).toBeInTheDocument();
  });

  it('ajusta la cantidad de una línea antes de confirmar', () => {
    const onCambiarCantidad = vi.fn();
    renderizar(<Pedido {...propsPedido({ onCambiarCantidad })} />);

    fireEvent.change(screen.getByLabelText('Cantidad de Croquetas de jamón'), {
      target: { value: '4' },
    });

    expect(onCambiarCantidad).toHaveBeenCalledWith('linea-1', 4);
  });

  it('retira una línea del pedido', () => {
    const onRetirarLinea = vi.fn();
    renderizar(<Pedido {...propsPedido({ onRetirarLinea })} />);

    fireEvent.click(screen.getAllByRole('button', { name: 'Quitar' })[0]);

    expect(onRetirarLinea).toHaveBeenCalledWith('linea-1');
  });

  it('confirma el pedido y muestra el total en euros', () => {
    const onConfirmar = vi.fn();
    renderizar(<Pedido {...propsPedido({ onConfirmar })} />);

    expect(screen.getByText(/53,00/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmar pedido' }));

    expect(onConfirmar).toHaveBeenCalledTimes(1);
  });

  it('impide confirmar un pedido vacío', () => {
    renderizar(<Pedido {...propsPedido({ pedido: pedidoVacio })} />);

    expect(screen.getByRole('button', { name: 'Confirmar pedido' })).toBeDisabled();
  });

  it('bloquea la edición cuando no hay conexión', () => {
    renderizar(<Pedido {...propsPedido({ enLinea: false })} />);

    expect(screen.getByLabelText('Cantidad de Croquetas de jamón')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Confirmar pedido' })).toBeDisabled();
  });
});

describe('SelectorPlatos', () => {
  const platos = [
    {
      id: 'plato-entrante',
      nombre: 'Croquetas de jamón',
      partida: 'entrantes',
      precio_centimos: 850,
      disponible: true,
    },
    {
      id: 'plato-principal',
      nombre: 'Paella de marisco',
      partida: 'principales',
      precio_centimos: 1800,
      disponible: true,
    },
  ];

  it('añade un plato de la carta con la cantidad indicada', () => {
    const onAnadir = vi.fn();
    renderizar(<SelectorPlatos platos={platos} puedeEditar onAnadir={onAnadir} />);

    fireEvent.change(screen.getByLabelText('Cantidad para Croquetas de jamón'), {
      target: { value: '2' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Añadir Croquetas de jamón' }));

    expect(onAnadir).toHaveBeenCalledWith('plato-entrante', 2);
  });

  it('no permite añadir platos si no hay un pedido en curso', () => {
    renderizar(<SelectorPlatos platos={platos} puedeEditar={false} onAnadir={() => {}} />);

    expect(screen.getByRole('button', { name: 'Añadir Croquetas de jamón' })).toBeDisabled();
  });
});

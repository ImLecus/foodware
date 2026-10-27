import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AvisoModificado from '../../src/components/AvisoModificado.jsx';
import AvisoSinConexion from '../../src/components/AvisoSinConexion.jsx';
import EstadoCarga from '../../src/components/EstadoCarga.jsx';
import EstadoError from '../../src/components/EstadoError.jsx';
import EstadoSinPartida from '../../src/components/EstadoSinPartida.jsx';
import EstadoVacio from '../../src/components/EstadoVacio.jsx';
import LineaPlato from '../../src/components/LineaPlato.jsx';

function renderizar(ui) {
  return render(<ChakraProvider>{ui}</ChakraProvider>);
}

describe('textos visibles en español de España', () => {
  it('usa textos en español en los estados de la vista', () => {
    const { unmount } = renderizar(<EstadoCarga />);
    expect(screen.getByText('Cargando pedidos…')).toBeInTheDocument();
    unmount();

    renderizar(<EstadoVacio />);
    expect(screen.getByText('No hay pedidos pendientes')).toBeInTheDocument();
  });

  it('usa textos en español en el estado sin partida y los avisos', () => {
    const { unmount } = renderizar(<EstadoSinPartida />);
    expect(screen.getByText('No tienes una partida asignada')).toBeInTheDocument();
    unmount();

    renderizar(<AvisoSinConexion />);
    expect(screen.getByText('Sin conexión')).toBeInTheDocument();

    renderizar(<AvisoModificado />);
    expect(screen.getByText('Modificado')).toBeInTheDocument();
  });

  it('muestra el mensaje de error en español', () => {
    const { unmount } = renderizar(
      <EstadoError
        mensaje="No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo."
        onReintentar={() => {}}
      />,
    );
    expect(screen.getByText('No se pudieron cargar los pedidos')).toBeInTheDocument();
    expect(
      screen.getByText(
        'No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.',
      ),
    ).toBeInTheDocument();
    unmount();
  });

  it('usa las etiquetas listo y pendiente en las líneas de plato', () => {
    const { unmount } = renderizar(
      <LineaPlato
        linea={{
          id: 'linea-1',
          nombrePlato: 'Croquetas',
          cantidad: 1,
          estado: 'listo',
          listoEn: null,
        }}
      />,
    );
    expect(screen.getByText('listo')).toBeInTheDocument();
    unmount();

    renderizar(
      <LineaPlato
        linea={{
          id: 'linea-2',
          nombrePlato: 'Ensalada',
          cantidad: 1,
          estado: 'pendiente',
          listoEn: null,
        }}
      />,
    );
    expect(screen.getByText('pendiente')).toBeInTheDocument();
  });
});

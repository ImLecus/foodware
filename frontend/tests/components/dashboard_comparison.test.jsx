import { render, screen, waitFor, within } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import PaginaDashboard from '../../src/pages/PaginaDashboard.jsx';
import { obtenerInformeDiario } from '../../src/services/reports.js';

vi.mock('../../src/services/reports.js', () => ({
  obtenerInformeDiario: vi.fn(),
}));

function renderizarComponente() {
  return render(
    <ChakraProvider>
      <PaginaDashboard />
    </ChakraProvider>,
  );
}

describe('PaginaDashboard - comparación US3', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra indicador de tendencia y comparación', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 150,
      numeroCuentas: 2,
      porCamarero: [],
      porPlato: [],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: '2026-10-18',
        importeActual: 150,
        importeAnterior: 100,
        diferenciaImporte: 50,
        diferenciaPorcentaje: 50,
        sinBaseComparacion: false,
        tendencia: 'subida',
        porCamarero: [
          {
            camareroId: 'camarero-1',
            nombre: 'Ana',
            diferenciaImporte: 50,
            tendencia: 'subida',
          },
        ],
        porPlato: [
          {
            platoId: 'plato-1',
            nombre: 'Croquetas',
            diferenciaImporte: 50,
            tendencia: 'subida',
          },
        ],
      },
    });
    renderizarComponente();
    await waitFor(() => {
      expect(screen.getByText(/Comparación con el día anterior/i)).toBeInTheDocument();
    });
    expect(screen.getAllByText(/subida/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Diferencia por camarero')).toBeInTheDocument();
    expect(screen.getByText('Diferencia por plato')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Croquetas')).toBeInTheDocument();
  });

  it('muestra sin datos anteriores cuando no existe día anterior', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 35,
      numeroCuentas: 1,
      porCamarero: [],
      porPlato: [],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: null,
        importeActual: 35,
        importeAnterior: null,
        diferenciaImporte: null,
        diferenciaPorcentaje: null,
        sinBaseComparacion: false,
        tendencia: 'sin_variacion',
        porCamarero: [],
        porPlato: [],
      },
    });

    renderizarComponente();

    expect(await screen.findByText(/sin datos anteriores/i)).toBeInTheDocument();
  });

  it('muestra sin base de comparación cuando día anterior sin ventas', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 35,
      numeroCuentas: 1,
      porCamarero: [],
      porPlato: [],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: '2026-10-18',
        importeActual: 35,
        importeAnterior: 0,
        diferenciaImporte: 35,
        diferenciaPorcentaje: null,
        sinBaseComparacion: true,
        tendencia: 'subida',
        porCamarero: [],
        porPlato: [],
      },
    });
    renderizarComponente();
    await waitFor(() => {
      expect(screen.getByText(/sin base de comparación/i)).toBeInTheDocument();
    });
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
  });

  it('muestra sin base de comparación en cada fila sin ventas el día anterior', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 35,
      numeroCuentas: 1,
      porCamarero: [],
      porPlato: [],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: '2026-10-18',
        importeActual: 35,
        importeAnterior: 0,
        diferenciaImporte: 35,
        diferenciaPorcentaje: null,
        sinBaseComparacion: true,
        tendencia: 'subida',
        porCamarero: [
          {
            camareroId: 'camarero-1',
            nombre: 'Ana',
            importeActual: 35,
            importeAnterior: 0,
            diferenciaImporte: 35,
            diferenciaPorcentaje: null,
            sinBaseComparacion: true,
            tendencia: 'subida',
          },
        ],
        porPlato: [
          {
            platoId: 'plato-1',
            nombre: 'Croquetas',
            importeActual: 35,
            importeAnterior: 0,
            diferenciaImporte: 35,
            diferenciaPorcentaje: null,
            sinBaseComparacion: true,
            tendencia: 'subida',
          },
        ],
      },
    });

    renderizarComponente();
    await waitFor(() => {
      expect(screen.getByText('Diferencia por camarero')).toBeInTheDocument();
    });

    const filasCamarero = within(
      screen.getByText('Diferencia por camarero').parentElement,
    ).getAllByRole('row');
    expect(filasCamarero[1]).toHaveTextContent('Ana');
    expect(filasCamarero[1]).toHaveTextContent('sin base de comparación');
    expect(filasCamarero[1]).not.toHaveTextContent('%');

    const filasPlato = within(
      screen.getByText('Diferencia por plato').parentElement,
    ).getAllByRole('row');
    expect(filasPlato[1]).toHaveTextContent('Croquetas');
    expect(filasPlato[1]).toHaveTextContent('sin base de comparación');
    expect(filasPlato[1]).not.toHaveTextContent('%');
  });
});

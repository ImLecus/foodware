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

    const filaAna = within(
      screen.getByText('Diferencia por camarero').parentElement,
    ).getAllByRole('row')[1];
    expect(within(filaAna).getByLabelText('subida')).toBeInTheDocument();
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
    expect(within(filasCamarero[1]).getByLabelText('subida')).toBeInTheDocument();

    const filasPlato = within(
      screen.getByText('Diferencia por plato').parentElement,
    ).getAllByRole('row');
    expect(filasPlato[1]).toHaveTextContent('Croquetas');
    expect(filasPlato[1]).toHaveTextContent('sin base de comparación');
    expect(filasPlato[1]).not.toHaveTextContent('%');
    expect(within(filasPlato[1]).getByLabelText('subida')).toBeInTheDocument();
  });

  it('formatea los porcentajes con coma decimal en el total y por fila', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 120,
      numeroCuentas: 2,
      porCamarero: [],
      porPlato: [],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: '2026-10-18',
        importeActual: 120,
        importeAnterior: 110,
        diferenciaImporte: 10,
        diferenciaPorcentaje: 9.11,
        sinBaseComparacion: false,
        tendencia: 'subida',
        porCamarero: [
          {
            camareroId: 'camarero-1',
            nombre: 'Ana',
            importeActual: 120,
            importeAnterior: 110,
            diferenciaImporte: 10,
            diferenciaPorcentaje: 9.11,
            sinBaseComparacion: false,
            tendencia: 'subida',
          },
        ],
        porPlato: [
          {
            platoId: 'plato-1',
            nombre: 'Croquetas',
            importeActual: 120,
            importeAnterior: 125,
            diferenciaImporte: -5,
            diferenciaPorcentaje: -4.76,
            sinBaseComparacion: false,
            tendencia: 'bajada',
          },
        ],
      },
    });

    renderizarComponente();
    await waitFor(() => {
      expect(screen.getByText(/Comparación con el día anterior/i)).toBeInTheDocument();
    });

    expect(screen.getAllByText(/\+9,11 %/).length).toBeGreaterThan(0);
    expect(screen.getByText(/-4,76 %/)).toBeInTheDocument();
    expect(screen.queryByText(/9\.11/)).not.toBeInTheDocument();
    expect(screen.queryByText(/-4\.76/)).not.toBeInTheDocument();
  });

  it('muestra la comparación en un día sin ventas', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 0,
      numeroCuentas: 0,
      porCamarero: [
        { camareroId: 'camarero-1', nombre: 'Ana', importe: 0, numeroCuentas: 0 },
      ],
      porPlato: [
        {
          platoId: 'plato-1',
          nombre: 'Croquetas',
          partida: 'entrantes',
          cantidad: 0,
          importe: 0,
        },
      ],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: '2026-10-18',
        importeActual: 0,
        importeAnterior: 35,
        diferenciaImporte: -35,
        diferenciaPorcentaje: -100,
        sinBaseComparacion: false,
        tendencia: 'bajada',
        porCamarero: [
          {
            camareroId: 'camarero-1',
            nombre: 'Ana',
            importeActual: 0,
            importeAnterior: 35,
            diferenciaImporte: -35,
            diferenciaPorcentaje: -100,
            sinBaseComparacion: false,
            tendencia: 'bajada',
          },
        ],
        porPlato: [
          {
            platoId: 'plato-1',
            nombre: 'Croquetas',
            importeActual: 0,
            importeAnterior: 35,
            diferenciaImporte: -35,
            diferenciaPorcentaje: -100,
            sinBaseComparacion: false,
            tendencia: 'bajada',
          },
        ],
      },
    });

    renderizarComponente();
    await waitFor(() => {
      expect(screen.getByText(/Comparación con el día anterior/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/no hay ventas registradas/i)).toBeInTheDocument();
    expect(screen.getAllByText(/bajada/i).length).toBeGreaterThan(0);
    expect(screen.getByText('Ventas por camarero')).toBeInTheDocument();
    expect(screen.getByText('Ventas por plato')).toBeInTheDocument();
  });
});

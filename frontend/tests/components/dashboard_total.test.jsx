import { render, screen, waitFor } from '@testing-library/react';
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

describe('PaginaDashboard - total', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra el indicador de carga mientras se obtiene el informe', () => {
    obtenerInformeDiario.mockReturnValue(new Promise(() => {}));
    renderizarComponente();
    expect(screen.getByText('Cargando informe...')).toBeInTheDocument();
  });

  it('muestra el total del día en euros cuando hay datos', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 25.5,
      numeroCuentas: 2,
      porCamarero: [],
      porPlato: [],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: null,
        importeActual: 25.5,
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
    await waitFor(() => {
      expect(screen.getByText(/25,50 €/)).toBeInTheDocument();
    });
  });

  it('muestra la fecha del día consultado junto al total', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 25.5,
      numeroCuentas: 2,
      porCamarero: [],
      porPlato: [],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: null,
        importeActual: 25.5,
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
    await waitFor(() => {
      expect(screen.getByText(/25,50 €/)).toBeInTheDocument();
    });
    expect(screen.getByText(/día consultado/i)).toBeInTheDocument();
    expect(screen.getByText(/19 de octubre de 2026/i)).toBeInTheDocument();
  });

  it('muestra 0,00 € cuando no hay ventas', async () => {
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
        diaAnterior: null,
        importeActual: 0,
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
    await waitFor(() => {
      expect(screen.getAllByText(/0,00 €/).length).toBeGreaterThan(0);
    });
    expect(screen.getByText(/no hay ventas registradas/i)).toBeInTheDocument();
    expect(screen.getByText('Ventas por camarero')).toBeInTheDocument();
    expect(screen.getByText('Ventas por plato')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Croquetas')).toBeInTheDocument();
  });

  it('muestra el error real del servidor y no lo confunde con falta de conexión', async () => {
    const error = new Error('Solo se permiten días naturales completados');
    error.status = 400;
    error.codigo = 'solicitud_invalida';
    obtenerInformeDiario.mockRejectedValue(error);

    renderizarComponente();

    expect(
      await screen.findByText(/solo se permiten días naturales completados/i),
    ).toBeInTheDocument();
    expect(screen.queryByText(/sin conexión/i)).not.toBeInTheDocument();
  });

  it('muestra mensaje de acceso restringido en 403', async () => {
    const error = new Error('403: Acceso restringido');
    error.status = 403;
    obtenerInformeDiario.mockRejectedValue(error);
    renderizarComponente();
    await waitFor(() => {
      expect(screen.getByText(/acceso restringido al encargado/i)).toBeInTheDocument();
    });
  });

  it('muestra estado sin conexión en error de red', async () => {
    obtenerInformeDiario.mockRejectedValue(new Error('Network error'));
    renderizarComponente();
    await waitFor(() => {
      expect(screen.getByText(/sin conexión/i)).toBeInTheDocument();
    });
  });
});

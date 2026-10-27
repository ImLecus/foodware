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

describe('PaginaDashboard - desgloses US2', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('muestra las tablas por camarero y por plato', async () => {
    obtenerInformeDiario.mockResolvedValue({
      fecha: '2026-10-19',
      totalVendido: 30.5,
      numeroCuentas: 2,
      porCamarero: [
        { camareroId: 'camarero-1', nombre: 'Ana', importe: 8.5, numeroCuentas: 1 },
        { camareroId: 'camarero-2', nombre: 'Luis', importe: 22.0, numeroCuentas: 1 },
      ],
      porPlato: [
        { platoId: 'plato-1', nombre: 'Croquetas', partida: 'entrantes', cantidad: 1, importe: 8.5 },
        { platoId: 'plato-2', nombre: 'Entrecot', partida: 'principales', cantidad: 1, importe: 22.0 },
      ],
      comparacion: {
        diaActual: '2026-10-19',
        diaAnterior: null,
        importeActual: 30.5,
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
      expect(screen.getByText('Ventas por camarero')).toBeInTheDocument();
    });
    expect(screen.getByText('Ventas por plato')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('Croquetas')).toBeInTheDocument();
  });
});

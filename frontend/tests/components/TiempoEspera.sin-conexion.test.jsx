import { ChakraProvider } from '@chakra-ui/react';
import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TiempoEspera from '../../src/components/TiempoEspera.jsx';

describe('TiempoEspera sin conexión', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-20T10:35:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('sigue avanzando con el reloj local aunque la lista esté marcada como no actualizada', () => {
    render(
      <ChakraProvider>
        <TiempoEspera enviadoEn="2026-10-20T10:00:00.000Z" />
      </ChakraProvider>,
    );

    expect(screen.getByText('35 min')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(10 * 60 * 1000);
    });

    expect(screen.getByText('45 min')).toBeInTheDocument();
  });
});

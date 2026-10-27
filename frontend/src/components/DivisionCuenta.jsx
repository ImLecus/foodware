import {
  Button,
  ButtonGroup,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useMemo, useState } from 'react';
import { repartirEnPartesIguales } from '../utils/division.js';
import { formatearEuros } from '../utils/formato.js';
import AsignarConsumos from './AsignarConsumos.jsx';
import ParteCuenta from './ParteCuenta.jsx';

function comensalPorDefecto(indice) {
  return `Comensal ${indice + 1}`;
}

/**
 * Prepara la división de la cuenta en partes iguales o por consumo. En modo por
 * consumo cada plato puede repartirse en porciones entre varias partes.
 */
export default function DivisionCuenta({
  cuenta,
  onConfirmar,
  confirmando = false,
  deshabilitado = false,
}) {
  const total = cuenta?.total_centimos ?? 0;
  const consumos = useMemo(() => cuenta?.consumos ?? [], [cuenta]);

  const [modo, setModo] = useState('iguales');
  const [numeroPartes, setNumeroPartes] = useState(2);
  const [comensales, setComensales] = useState(() => [
    comensalPorDefecto(0),
    comensalPorDefecto(1),
  ]);
  const [seleccion, setSeleccion] = useState({});
  const [error, setError] = useState(null);

  useEffect(() => {
    setComensales((actual) =>
      Array.from(
        { length: numeroPartes },
        (_, indice) => actual[indice] ?? comensalPorDefecto(indice),
      ),
    );
    setSeleccion((actual) =>
      Object.fromEntries(
        Object.entries(actual).map(([lineaId, ordenes]) => [
          lineaId,
          ordenes.filter((orden) => orden <= numeroPartes),
        ]),
      ),
    );
  }, [numeroPartes]);

  useEffect(() => {
    if (modo !== 'por_consumo') return;

    setSeleccion((actual) => {
      const siguiente = { ...actual };
      for (const consumo of consumos) {
        if (!siguiente[consumo.linea_id]?.length) {
          siguiente[consumo.linea_id] = [1];
        }
      }
      return siguiente;
    });
  }, [modo, consumos]);

  function cambiarModo(nuevoModo) {
    setError(null);
    setModo(nuevoModo);
  }

  function cambiarComensal(orden, valor) {
    setComensales((actual) =>
      actual.map((comensal, indice) => (indice === orden - 1 ? valor : comensal)),
    );
  }

  function alternarConsumo(lineaId, orden) {
    setError(null);
    setSeleccion((actual) => {
      const elegidas = actual[lineaId] ?? [];
      const siguiente = elegidas.includes(orden)
        ? elegidas.filter((valor) => valor !== orden)
        : [...elegidas, orden].sort((a, b) => a - b);

      return { ...actual, [lineaId]: siguiente };
    });
  }

  const partes = useMemo(() => {
    if (modo === 'iguales') {
      return repartirEnPartesIguales(total, numeroPartes).map((importe, indice) => ({
        orden: indice + 1,
        comensal: comensales[indice] ?? comensalPorDefecto(indice),
        importe_centimos: importe,
      }));
    }

    const importes = Array.from({ length: numeroPartes }, () => 0);
    for (const consumo of consumos) {
      const ordenes = seleccion[consumo.linea_id]?.length ? seleccion[consumo.linea_id] : [1];
      const reparto = repartirEnPartesIguales(consumo.importe_centimos, ordenes.length);
      ordenes.forEach((orden, indice) => {
        importes[orden - 1] += reparto[indice];
      });
    }

    return importes.map((importe, indice) => ({
      orden: indice + 1,
      comensal: comensales[indice] ?? comensalPorDefecto(indice),
      importe_centimos: importe,
    }));
  }, [modo, total, numeroPartes, comensales, consumos, seleccion]);

  const asignaciones = useMemo(() => {
    if (modo !== 'por_consumo') return [];

    return consumos.flatMap((consumo) => {
      const ordenes = seleccion[consumo.linea_id]?.length ? seleccion[consumo.linea_id] : [1];
      const reparto = repartirEnPartesIguales(consumo.importe_centimos, ordenes.length);

      return ordenes.map((orden, indice) => ({
        parte_orden: orden,
        linea_id: consumo.linea_id,
        importe_centimos: reparto[indice],
      }));
    });
  }, [modo, consumos, seleccion]);

  const suma = partes.reduce((totalParcial, parte) => totalParcial + parte.importe_centimos, 0);

  function confirmar() {
    if (partes.some((parte) => !parte.comensal.trim())) {
      setError('Cada parte necesita un comensal.');
      return;
    }
    if (partes.some((parte) => parte.importe_centimos === 0)) {
      setError('Cada parte debe tener un importe mayor que cero.');
      return;
    }

    setError(null);
    onConfirmar?.({
      modo,
      total_base_centimos: total,
      partes,
      asignaciones,
    });
  }

  return (
    <Card>
      <CardBody>
        <Stack spacing={4}>
          <Heading size="sm">Dividir la cuenta</Heading>

          <ButtonGroup isAttached variant="outline" size="sm" alignSelf="flex-start">
            <Button
              aria-pressed={modo === 'iguales'}
              colorScheme={modo === 'iguales' ? 'teal' : 'gray'}
              onClick={() => cambiarModo('iguales')}
            >
              Partes iguales
            </Button>
            <Button
              aria-pressed={modo === 'por_consumo'}
              colorScheme={modo === 'por_consumo' ? 'teal' : 'gray'}
              onClick={() => cambiarModo('por_consumo')}
            >
              Por consumo
            </Button>
          </ButtonGroup>

          <FormControl maxW="220px">
            <FormLabel htmlFor="numero-partes">Número de partes</FormLabel>
            <Input
              id="numero-partes"
              type="number"
              min={1}
              max={20}
              value={numeroPartes}
              onChange={(evento) =>
                setNumeroPartes(
                  Math.max(1, Math.min(20, Number(evento.target.value) || 1)),
                )
              }
            />
          </FormControl>

          {modo === 'por_consumo' && (
            <AsignarConsumos
              consumos={consumos}
              numeroPartes={numeroPartes}
              seleccion={seleccion}
              onAlternar={alternarConsumo}
            />
          )}

          <Stack spacing={2}>
            {partes.map((parte) => (
              <ParteCuenta
                key={parte.orden}
                parte={parte}
                onCambiarComensal={(valor) => cambiarComensal(parte.orden, valor)}
              />
            ))}
          </Stack>

          <Text fontWeight="semibold">
            {`Suma de las partes: ${formatearEuros(suma)} de ${formatearEuros(total)}`}
          </Text>

          {error && (
            <Text color="red.600" role="alert">
              {error}
            </Text>
          )}

          <Button
            alignSelf="flex-start"
            colorScheme="teal"
            onClick={confirmar}
            isLoading={confirmando}
            isDisabled={deshabilitado || total === 0}
          >
            Confirmar división
          </Button>
        </Stack>
      </CardBody>
    </Card>
  );
}

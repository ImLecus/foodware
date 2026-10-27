import { Button, FormControl, FormLabel, Input, Select, Stack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import SelectorIngredientes from './SelectorIngredientes.jsx';

export default function FormularioPlato({ plato, onSubmit, onCancelar, ingredientes = [] }) {
  const [nombre, setNombre] = useState(plato?.nombre || '');
  const [partida, setPartida] = useState(plato?.partida_codigo || plato?.partida || 'entrantes');
  const [precio, setPrecio] = useState('');
  const [seleccionados, setSeleccionados] = useState([]);

  useEffect(() => {
    setNombre(plato?.nombre || '');
    setPartida(plato?.partida_codigo || plato?.partida || 'entrantes');
    if (plato?.precio_centimos !== undefined && plato?.precio_centimos !== null) {
      setPrecio((plato.precio_centimos / 100).toString().replace('.', ','));
    } else if (typeof plato?.precio === 'number') {
      setPrecio(plato.precio.toString().replace('.', ','));
    } else {
      setPrecio('');
    }
    if (plato?.ingredientes) {
      setSeleccionados(plato.ingredientes.map((i) => i.id));
    } else {
      setSeleccionados([]);
    }
  }, [plato]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (precio === '' || precio === null || precio === undefined) return;
    const precioNum = Number(String(precio).replace(',', '.'));
    if (Number.isNaN(precioNum) || precioNum <= 0) return;
    onSubmit({
      nombre,
      partida_codigo: partida,
      precio: precioNum,
      ingredienteIds: seleccionados,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Nombre</FormLabel>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Partida</FormLabel>
          <Select value={partida} onChange={(e) => setPartida(e.target.value)}>
            <option value="entrantes">entrantes</option>
            <option value="principales">principales</option>
            <option value="postres">postres</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel>Precio (€)</FormLabel>
          <Input value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0,00" />
        </FormControl>
        <SelectorIngredientes ingredientes={ingredientes} seleccionados={seleccionados} onChange={setSeleccionados} />
        <Stack direction="row" spacing={4}>
          <Button type="submit" colorScheme="blue">
            Guardar
          </Button>
          {onCancelar ? (
            <Button onClick={onCancelar} variant="ghost">
              Cancelar
            </Button>
          ) : null}
        </Stack>
      </Stack>
    </form>
  );
}

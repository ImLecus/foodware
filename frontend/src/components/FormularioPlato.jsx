import { Button, FormControl, FormLabel, Input, Select, Stack } from '@chakra-ui/react';
import { useState } from 'react';

export default function FormularioPlato({ plato, onSubmit, onCancelar }) {
  const [nombre, setNombre] = useState(plato?.nombre || '');
  const [partida_codigo, setPartidaCodigo] = useState(plato?.partida_codigo || 'entrantes');
  const [precio, setPrecio] = useState(plato ? (plato.precio_centimos / 100).toFixed(2) : '');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ nombre, partida_codigo, precio: Number(precio.replace(',', '.')) });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel htmlFor="nombre">Nombre</FormLabel>
          <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </FormControl>
        <FormControl isRequired>
          <FormLabel htmlFor="partida">Partida</FormLabel>
          <Select id="partida" value={partida_codigo} onChange={(e) => setPartidaCodigo(e.target.value)}>
            <option value="entrantes">Entrantes</option>
            <option value="principales">Principales</option>
            <option value="postres">Postres</option>
          </Select>
        </FormControl>
        <FormControl isRequired>
          <FormLabel htmlFor="precio">Precio (€)</FormLabel>
          <Input id="precio" value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="0,00" />
        </FormControl>
        <Stack direction="row">
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

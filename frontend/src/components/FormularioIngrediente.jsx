import { Button, FormControl, FormLabel, Input, Select, Stack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function FormularioIngrediente({ ingrediente, onSubmit, onCancelar }) {
  const [nombre, setNombre] = useState(ingrediente?.nombre || '');
  const [estado, setEstado] = useState(ingrediente?.estado || 'disponible');

  useEffect(() => {
    setNombre(ingrediente?.nombre || '');
    setEstado(ingrediente?.estado || 'disponible');
  }, [ingrediente]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nombre || nombre.trim() === '') return;
    onSubmit({ nombre: nombre.trim(), estado });
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack spacing={4}>
        <FormControl isRequired>
          <FormLabel>Nombre</FormLabel>
          <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </FormControl>
        <FormControl>
          <FormLabel>Estado</FormLabel>
          <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="disponible">disponible</option>
            <option value="agotado">agotado</option>
          </Select>
        </FormControl>
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

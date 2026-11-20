import { Box, Checkbox, CheckboxGroup, Stack, Text } from '@chakra-ui/react';

export default function SelectorIngredientes({ ingredientes = [], seleccionados = [], onChange }) {
  if (!ingredientes || ingredientes.length === 0) {
    return <Text fontSize="sm" color="gray.500">No hay ingredientes disponibles</Text>;
  }

  return (
    <Box>
      <Text fontWeight="medium" mb={2}>Ingredientes</Text>
      <CheckboxGroup value={seleccionados} onChange={(values) => onChange(values)}>
        <Stack spacing={2}>
          {ingredientes.map((ing) => (
            <Checkbox key={ing.id} value={ing.id}>
              {ing.nombre} ({ing.estado})
            </Checkbox>
          ))}
        </Stack>
      </CheckboxGroup>
    </Box>
  );
}

import { Box, Button, Heading, Spinner, Stack, Alert, AlertIcon, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import FormularioPlato from '../components/FormularioPlato.jsx';
import TablaPlatos from '../components/TablaPlatos.jsx';
import { actualizarPlato, crearPlato, obtenerCartaAdmin } from '../services/cartaClient.js';
import { USUARIO_ID } from '../services/sesion.js';

export default function PaginaGestionCarta() {
  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [platoEditando, setPlatoEditando] = useState(null);

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerCartaAdmin(cabecerasSesion());
      setPlatos(datos);
    } catch (e) {
      setError('No se pudo cargar la carta. Comprueba que el backend esté en http://localhost:3000');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargar();
  }, []);

  const handleCrear = async (datos) => {
    await crearPlato(datos, cabecerasSesion());
    setMostrarFormulario(false);
    cargar();
  };

const cabecerasSesion = () => {
  const usuarioId = import.meta.env.VITE_USUARIO_ID || USUARIO_ID || 'admin-1';
  return { 'x-usuario-id': usuarioId };
};

  if (cargando) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={6}>
        <Alert status="error">
          <AlertIcon />
          <Text>{error}</Text>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={6}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={6}>
        <Heading size="lg">Gestión de la carta</Heading>
        <Button colorScheme="blue" onClick={() => setMostrarFormulario(true)}>
          Nuevo plato
        </Button>
      </Stack>
      <TablaPlatos
        platos={platos}
        onEditar={(p) => {
          setPlatoEditando(p);
          setMostrarFormulario(true);
        }}
      />
      {(mostrarFormulario || platoEditando) && (
        <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
          <Heading size="md" mb={4}>
            {platoEditando ? 'Editar plato' : 'Nuevo plato'}
          </Heading>
          <FormularioPlato
            plato={platoEditando}
            onSubmit={platoEditando ? handleActualizar : handleCrear}
            onCancelar={() => {
              setMostrarFormulario(false);
              setPlatoEditando(null);
            }}
          />
        </Box>
      )}
    </Box>
  );
}

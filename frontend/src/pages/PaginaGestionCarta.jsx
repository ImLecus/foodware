import { Box, Button, Heading, Spinner, Stack } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import FormularioPlato from '../components/FormularioPlato.jsx';
import TablaPlatos from '../components/TablaPlatos.jsx';
import { actualizarPlato, crearPlato, obtenerCartaAdmin } from '../services/cartaClient.js';

const cabecerasSesion = () => {
  const usuarioId = import.meta.env.VITE_USUARIO_ID || 'admin-1';
  return { 'x-usuario-id': usuarioId };
};

export default function PaginaGestionCarta() {
  const [platos, setPlatos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [platoEditando, setPlatoEditando] = useState(null);

  const cargar = async () => {
    setCargando(true);
    try {
      const datos = await obtenerCartaAdmin(cabecerasSesion());
      setPlatos(datos);
    } catch (e) {
      // mantener estado
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

  const handleActualizar = async (datos) => {
    await actualizarPlato(platoEditando.id, datos, cabecerasSesion());
    setPlatoEditando(null);
    cargar();
  };

  if (cargando) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minH="200px">
        <Spinner />
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
EOF

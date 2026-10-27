import { Box, Button, Heading, Spinner, Stack, Alert, AlertIcon, Text } from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import FormularioPlato from '../components/FormularioPlato.jsx';
import FormularioIngrediente from '../components/FormularioIngrediente.jsx';
import PanelIngredientes from '../components/PanelIngredientes.jsx';
import TablaPlatos from '../components/TablaPlatos.jsx';
import { actualizarIngrediente, actualizarPlato, crearIngrediente, crearPlato, obtenerCartaAdmin, obtenerIngredientes } from '../services/cartaClient.js';
import { USUARIO_ID } from '../services/sesion.js';

export default function PaginaGestionCarta() {
  const [platos, setPlatos] = useState([]);
  const [ingredientes, setIngredientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [platoEditando, setPlatoEditando] = useState(null);
  const [mostrarFormularioIngrediente, setMostrarFormularioIngrediente] = useState(false);
  const [ingredienteEditando, setIngredienteEditando] = useState(null);

  const cabecerasSesion = () => {
    const usuarioId = import.meta.env.VITE_USUARIO_ID || USUARIO_ID || 'admin-1';
    return { 'x-usuario-id': usuarioId };
  };

  const cargar = async () => {
    setCargando(true);
    setError(null);
    try {
      const [datosPlatos, datosIngredientes] = await Promise.all([
        obtenerCartaAdmin(cabecerasSesion()),
        obtenerIngredientes(cabecerasSesion()).catch(() => []),
      ]);
      setPlatos(datosPlatos);
      setIngredientes(datosIngredientes);
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

  const handleActualizar = async (datos) => {
    if (!platoEditando) return;
    await actualizarPlato(platoEditando.id, datos, cabecerasSesion());
    setPlatoEditando(null);
    setMostrarFormulario(false);
    cargar();
  };

  const handleCambiarActivo = async (plato, activo) => {
    await actualizarPlato(plato.id, { activo }, cabecerasSesion());
    cargar();
  };

  const handleCrearIngrediente = async (datos) => {
    await crearIngrediente(datos, cabecerasSesion());
    setMostrarFormularioIngrediente(false);
    cargar();
  };

  const handleActualizarIngrediente = async (datos) => {
    if (!ingredienteEditando) return;
    await actualizarIngrediente(ingredienteEditando.id, datos, cabecerasSesion());
    setIngredienteEditando(null);
    setMostrarFormularioIngrediente(false);
    cargar();
  };

  const handleCambiarEstadoIngrediente = async (ing, estado) => {
    await actualizarIngrediente(ing.id, { estado }, cabecerasSesion());
    cargar();
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
        onCambiarActivo={handleCambiarActivo}
      />
      {(mostrarFormulario || platoEditando) && (
        <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
          <Heading size="md" mb={4}>
            {platoEditando ? 'Editar plato' : 'Nuevo plato'}
          </Heading>
          <FormularioPlato
            plato={platoEditando}
            ingredientes={ingredientes}
            onSubmit={platoEditando ? handleActualizar : handleCrear}
            onCancelar={() => {
              setMostrarFormulario(false);
              setPlatoEditando(null);
            }}
          />
        </Box>
      )}

      <PanelIngredientes
        ingredientes={ingredientes}
        onCrear={() => {
          setIngredienteEditando(null);
          setMostrarFormularioIngrediente(true);
        }}
        onEditar={(ing) => {
          setIngredienteEditando(ing);
          setMostrarFormularioIngrediente(true);
        }}
        onCambiarEstado={handleCambiarEstadoIngrediente}
      />
      {(mostrarFormularioIngrediente || ingredienteEditando) && (
        <Box mt={6} p={4} borderWidth="1px" borderRadius="md">
          <Heading size="md" mb={4}>
            {ingredienteEditando ? 'Editar ingrediente' : 'Nuevo ingrediente'}
          </Heading>
          <FormularioIngrediente
            ingrediente={ingredienteEditando}
            onSubmit={ingredienteEditando ? handleActualizarIngrediente : handleCrearIngrediente}
            onCancelar={() => {
              setMostrarFormularioIngrediente(false);
              setIngredienteEditando(null);
            }}
          />
        </Box>
      )}
    </Box>
  );
}


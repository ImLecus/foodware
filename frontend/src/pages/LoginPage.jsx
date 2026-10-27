import {
  Alert,
  AlertDescription,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { inicioPorRol } from '../auth/rutas.js';

export default function LoginPage() {
  const { usuario, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [usuarioId, setUsuarioId] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (usuario) {
      const destino = location.state?.from ?? inicioPorRol(usuario.rol);
      navigate(destino, { replace: true });
    }
  }, [usuario, navigate, location.state]);

  if (usuario) {
    return <Navigate to={location.state?.from ?? inicioPorRol(usuario.rol)} replace />;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setError(null);
    setEnviando(true);

    try {
      const datos = await login(usuarioId.trim(), password);
      navigate(location.state?.from ?? inicioPorRol(datos.rol), { replace: true });
    } catch (fallo) {
      setError(fallo?.message ?? 'No se pudo iniciar sesión');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center" bg="gray.50" p={6}>
      <Card w="100%" maxW="md">
        <CardBody>
          <Heading size="lg" mb={1} color="teal.700">
            Foodware
          </Heading>
          <Text color="gray.600" mb={6}>
            Accede con tu usuario del restaurante
          </Text>

          <form onSubmit={enviar}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel htmlFor="login-usuario">Usuario</FormLabel>
                <Input
                  id="login-usuario"
                  autoComplete="username"
                  value={usuarioId}
                  onChange={(evento) => setUsuarioId(evento.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel htmlFor="login-password">Contraseña</FormLabel>
                <Input
                  id="login-password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(evento) => setPassword(evento.target.value)}
                />
              </FormControl>

              {error && (
                <Alert status="error" borderRadius="md">
                  <AlertIcon />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button type="submit" colorScheme="teal" isLoading={enviando} isDisabled={enviando}>
                Entrar
              </Button>
            </Stack>
          </form>
        </CardBody>
      </Card>
    </Box>
  );
}

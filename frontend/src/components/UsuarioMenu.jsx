import { Badge, Button, HStack, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext.jsx';
import { NOMBRES_ROL } from '../auth/rutas.js';

export default function UsuarioMenu() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  if (!usuario) return null;

  async function salir() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <HStack spacing={3}>
      <Text fontSize="sm" fontWeight="medium">
        {usuario.nombre}
      </Text>
      <Badge colorScheme="teal" variant="subtle">
        {NOMBRES_ROL[usuario.rol] ?? usuario.rol}
      </Badge>
      <Button size="xs" variant="outline" onClick={salir}>
        Cerrar sesión
      </Button>
    </HStack>
  );
}

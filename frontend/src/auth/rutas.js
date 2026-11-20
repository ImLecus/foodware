export const INICIO_POR_ROL = {
  camarero: '/sala',
  cocinero: '/cocina',
  encargado: '/dashboard',
  administrador: '/admin',
};

export const NOMBRES_ROL = {
  camarero: 'Camarero',
  cocinero: 'Cocinero',
  encargado: 'Encargado',
  administrador: 'Administrador',
};

export const MODULOS = [
  { ruta: '/sala', nombre: 'Sala', roles: ['camarero'] },
  { ruta: '/sala/estado', nombre: 'Señales', roles: ['camarero'] },
  { ruta: '/cuentas', nombre: 'Cuentas', roles: ['camarero'] },
  { ruta: '/cocina', nombre: 'Cocina', roles: ['cocinero'] },
  { ruta: '/dashboard', nombre: 'Dashboard', roles: ['encargado'] },
  { ruta: '/admin', nombre: 'Carta', roles: ['administrador'] },
];

export function inicioPorRol(rol) {
  return INICIO_POR_ROL[rol] ?? '/login';
}

export function modulosVisibles(rol) {
  return MODULOS.filter((modulo) => modulo.roles.includes(rol));
}

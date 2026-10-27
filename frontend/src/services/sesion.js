// Identidad y rol del usuario de la sesión. Como todavía no hay login, se resuelven
// por entorno (ver specs/001-comandas/research.md §8); otra historia los sustituirá
// por la sesión real sin tocar a los consumidores.
export const USUARIO_ID = import.meta.env.VITE_USUARIO_ID ?? 'encargado-1';
export const ROL = import.meta.env.VITE_ROL ?? 'encargado';

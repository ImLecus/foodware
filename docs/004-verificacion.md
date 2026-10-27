# Verificación de la historia 004

**Fecha**: 2026-10-20
**Rama**: `feature-marcarListos`

## Suites

| Suite | Resultado |
|-------|-----------|
| Backend (Vitest + Supertest) | 33 archivos, 111 pruebas en verde |
| Frontend (Vitest + Testing Library) | 16 archivos, 53 pruebas en verde |
| ESLint | backend y frontend sin errores |
| Build de producción | correcto |

## Mapa de requisitos a evidencia

| Requisito | Evidencia |
|-----------|-----------|
| FR-001 (marcar un plato desde cocina) | `LineaPlato` con «Marcar listo», `CocinaPage`, `tests/pages/CocinaPage.test.jsx` |
| FR-002 (solo pedidos pendientes de la partida) | `services/marcarListo.js`, validación de `partida` y 403 |
| FR-003 (no otras partidas ni pedidos completados) | `tests/unit/marcar-listo-service.test.js`, `tests/contract/marcar-estado.test.js` |
| FR-004 (distinción accesible) | `LineaPlato` (color + texto + `aria-label`), `tests/components/LineaPlato.test.jsx` |
| FR-005 (los demás platos siguen pendientes) | `tests/unit/marcar-listo-service.test.js` |
| FR-006 (el pedido desaparece al completarse) | `tests/integration/pedido-completado.test.js` |
| FR-007 (registrar el momento) | `listoEn` en `lineas_pedido`, `tests/unit/momento-listo.test.js` |
| FR-008 (reflejo en sala) | `GET /api/mesas/{id}/estado-platos`, SSE `linea.actualizada`, `tests/integration/reflejo-sala.test.js`, `tests/pages/SalaPage.test.jsx` |
| FR-009 (idempotencia) | `tests/unit/marcar-listo-service.test.js`, `tests/contract/marcar-estado.test.js` |
| FR-010 (bloqueo sin conexión) | `tests/pages/CocinaPage.test.jsx` (botón deshabilitado) |
| FR-011 (coherencia cocina/sala) | una única fuente en SQLite; consultas de cocina y sala sobre las mismas líneas |
| FR-012 (textos en español) | «Marcar listo», «Deshacer», «Pedido completado», «pendiente», «listo» |
| FR-013 (marca de línea completa) | actualización por `lineaId`, no por unidad |
| FR-014 (deshacer + aviso 10 s) | `AvisoPedidoCompletado`, `tests/components/AvisoPedidoCompletado.test.jsx`, `tests/pages/CocinaPage.test.jsx` |
| FR-015 (volver a pendiente en cocina y sala) | `tests/contract/desmarcar-completado.test.js`, `tests/integration/reflejo-sala.test.js` |
| FR-016 (sin acción de marcar todo) | no existe botón de marcado masivo en `CocinaPage`/`PedidoCard` |

## Comprobaciones manuales

- `PUT /api/pedidos/{pedidoId}/lineas/{lineaId}/estado` con `listo` devuelve la línea con `listoEn`.
- Repetir la marca mantiene el mismo `listoEn`; con `pendiente` se limpia.
- Al completar todas las líneas, el pedido desaparece de `pedidos-pendientes`.
- `GET /api/mesas/{mesaId}/estado-platos` refleja el estado de cada plato.
- La pantalla `/cocina` con sesión de `cocinero-entrantes` permite marcar/deshacer y muestra el aviso.
- La pantalla `/sala/platos?mesa=mesa-1` refleja los cambios sin recargar.

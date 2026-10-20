# Verificación de la historia 003

**Fecha**: 2026-10-20
**Rama**: `feature-verPedidos`

## Suites

| Suite | Resultado |
|-------|-----------|
| Backend (Vitest + Supertest) | 11 archivos, 28 pruebas en verde |
| Frontend (Vitest + Testing Library) | 9 archivos, 20 pruebas en verde |
| ESLint | backend y frontend sin errores |
| Prettier | todos los ficheros formateados |
| Build de producción | correcto |

## Mapa de requisitos a evidencia

| Requisito | Evidencia |
|-----------|-----------|
| FR-001 (partida del cocinero) | `GET /api/cocineros/:id`, `CocinaPage` |
| FR-002 (solo pedidos de la partida) | `tests/contract/pedidos-pendientes.test.js`, `tests/unit/listar-pendientes.test.js` |
| FR-003 (no otras partidas) | consulta con `pl.partida_codigo = ?` y pruebas de filtrado |
| FR-004 (orden y desempate) | `ORDER BY enviado_en, id` + pruebas de contrato y unidad |
| FR-005 (tiempo desde el envío original) | `tests/unit/tiempo-espera.test.js`, `TiempoEspera` |
| FR-006 (tiempo al día) | `tests/components/TiempoEspera*.test.jsx` (fake timers) |
| FR-007 (todos los platos y distinción accesible) | `LineaPlato`, `tests/components/LineaPlato.test.jsx` |
| FR-008 (pendiente mientras haya línea pendiente) | consulta `listarPedidosConPendientes`, `tests/integration/lista-en-vivo.test.js` |
| FR-009 (actualización automática) | SSE `pedido.nuevo` / `pedido.pendientes-cambiado`, `events.js`, `tests/pages/CocinaPage.en-vivo.test.jsx` |
| FR-010 (inserción en su posición) | refresco de lista, `tests/integration/lista-en-vivo.test.js` |
| FR-011 (reordenación al completar) | `tests/integration/lista-en-vivo.test.js` |
| FR-012 (estado vacío) | `EstadoVacio`, `tests/pages/CocinaPage.test.jsx` |
| FR-013 (sin partida) | `EstadoSinPartida`, `tests/pages/CocinaPage.test.jsx` |
| FR-014 (textos en español) | `tests/i18n/textos.test.jsx` |
| FR-015 (edición sin reiniciar tiempo) | `tests/unit/tiempo-espera.test.js` |
| FR-016 (mesa de origen) | `tests/contract/detalle-pedido.test.js` |
| FR-017 (carga y error con reintento) | `tests/pages/CocinaPage.carga.test.jsx` |
| FR-018 (aviso «Modificado») | `tests/components/PedidoCard.modificado.test.jsx` |

## Comprobaciones manuales

- `GET /api/cocineros/cocinero-entrantes` devuelve la partida asignada.
- `GET /api/partidas/entrantes/pedidos-pendientes` devuelve pedidos ordenados; excluye los que
  solo tienen líneas listas en esa partida.
- `GET /api/partidas/entrantes/eventos` abre el stream SSE con `text/event-stream`.
- La vista `/cocina?cocinero=cocinero-entrantes` muestra la lista, los estados de carga, vacío y
  error, el aviso «Modificado» y el indicador de sin conexión.

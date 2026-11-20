# Verificación — Ver pedidos pendientes en cocina (003)

Mapa de los requisitos de `spec.md` a las pruebas automatizadas y a los escenarios de
`quickstart.md`. Este documento completa T054/T062 y no sustituye a la guía manual.

## Requisitos funcionales

| Requisito | Prueba / evidencia | Escenario manual |
|-----------|--------------------|------------------|
| FR-001 El cocinero queda identificado con su partida | `backend/tests/contract/pedidos-pendientes.test.js`, `frontend/tests/pages/CocinaPage.test.jsx` | 1 |
| FR-002 Solo pedidos pendientes de su partida | `backend/tests/contract/pedidos-pendientes.test.js`, `frontend/tests/pages/CocinaPage.test.jsx`, `backend/tests/integration/eventos-partida.test.js` | 1 |
| FR-003 No mostrar pedidos de otras partidas | `backend/tests/contract/pedidos-pendientes.test.js`, `backend/tests/integration/eventos-partida.test.js` | 1 |
| FR-004 Orden por envío y desempate por id | `backend/tests/contract/pedidos-pendientes.test.js`, `backend/tests/unit/listar-pendientes.test.js` | 2 y 12 |
| FR-005 Tiempo desde el envío original | `backend/tests/unit/tiempo-espera.test.js`, `frontend/tests/components/TiempoEspera.test.jsx` | 5 y 14 |
| FR-006 Tiempo actualizado, también sin conexión | `frontend/tests/components/TiempoEspera.test.jsx`, `frontend/tests/components/TiempoEspera.sin-conexion.test.jsx` | 6 y 18 |
| FR-007 Todos los platos, listos distinguidos de forma accesible | `backend/tests/contract/detalle-pedido.test.js`, `frontend/tests/components/LineaPlato.test.jsx` | 7 y 8 |
| FR-008 Pendiente mientras quede un plato sin completar | `backend/tests/unit/listar-pendientes.test.js`, `backend/tests/integration/pedido-completado.test.js`, `backend/tests/integration/lista-en-vivo.test.js` | 3 |
| FR-009 Actualización automática con pedidos nuevos | `backend/tests/contract/eventos-cocina.test.js`, `backend/tests/integration/eventos-partida.test.js`, `frontend/tests/pages/CocinaPage.en-vivo.test.jsx` | 10 |
| FR-010 Inserción del pedido nuevo en su posición | `backend/tests/integration/eventos-partida.test.js`, `backend/tests/integration/lista-en-vivo.test.js` | 10 |
| FR-011 Reordenación al dejar de estar pendiente | `backend/tests/integration/lista-en-vivo.test.js`, `backend/tests/integration/eventos-partida.test.js` | 11 |
| FR-012 Estado vacío | `frontend/tests/pages/CocinaPage.test.jsx` | 3 |
| FR-013 Estado sin partida | `frontend/tests/pages/CocinaPage.test.jsx` | 4 |
| FR-014 Textos en español de España | `frontend/tests/i18n/textos.test.jsx`, `frontend/tests/services/api.test.js` | Todos |
| FR-015 La edición no reinicia el tiempo ni la posición | `backend/tests/unit/tiempo-espera.test.js`, `frontend/tests/components/PedidoCard.modificado.test.jsx` | 14 |
| FR-016 Mesa de origen visible | `backend/tests/contract/detalle-pedido.test.js` | 9 |
| FR-017 Carga inicial y error con reintento | `frontend/tests/pages/CocinaPage.carga.test.jsx` | 16 y 17 |
| FR-018 Aviso «Modificado» sin detalle de líneas | `frontend/tests/components/PedidoCard.modificado.test.jsx`, `backend/tests/contract/eventos-pedido-modificado.test.js` | 14 |

## Criterios de éxito

| Criterio | Prueba / evidencia |
|----------|--------------------|
| SC-001 Solo pedidos de la partida | `pedidos-pendientes.test.js`, `CocinaPage.test.jsx` |
| SC-002 Orden correcto | `pedidos-pendientes.test.js`, `unit/listar-pendientes.test.js` |
| SC-003 Tiempo con precisión de un minuto, también sin conexión | `TiempoEspera.test.jsx`, `TiempoEspera.sin-conexion.test.jsx` |
| SC-004 Todos los platos y cantidades | `contract/detalle-pedido.test.js`, `LineaPlato.test.jsx` |
| SC-005 Pedido nuevo visible en 5 s | `integration/eventos-partida.test.js`, `CocinaPage.en-vivo.test.jsx` |
| SC-006 Reordenación en 5 s | `integration/lista-en-vivo.test.js`, `integration/eventos-partida.test.js` |
| SC-007 Identificar pedido, platos y cantidades | `contract/detalle-pedido.test.js`, `CocinaPage.test.jsx` |
| SC-008 Localizar el más urgente con 20 pendientes | `integration/veinte-pedidos.test.js` |
| SC-009 Mesa visible en todos los pedidos | `contract/detalle-pedido.test.js` |
| SC-010 Listo no depende solo del color | `LineaPlato.test.jsx`, `i18n/textos.test.jsx` |
| SC-011 Error inicial con reintento, nunca vacío | `CocinaPage.carga.test.jsx` |
| SC-012 Modificado conserva tiempo y posición | `PedidoCard.modificado.test.jsx`, `eventos-pedido-modificado.test.js` |

## Escenarios manuales del quickstart

Los escenarios 1–18 se validan desde la interfaz con el seed actualizado:

- 20 mesas y un cocinero por partida.
- `cocinero-sin-partida` para el escenario 4.
- `pedido-demo-6` con más de una hora de espera para el escenario 13.
- `pedido-demo-7` y `pedido-demo-8` con el mismo `enviadoEn` para el escenario 12.

Los escenarios de conexión (15–18) se comprueban deteniendo y reiniciando el backend con la vista
abierta.

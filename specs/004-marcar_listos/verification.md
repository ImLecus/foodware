# Verificación — Marcar platos como listos (004)

Mapa de los requisitos de `spec.md` a las pruebas automatizadas y a los escenarios de
`quickstart.md`. La completitud se calcula por partida: un pedido mixto puede seguir pendiente en
otra partida sin impedir el aviso de esta.

## Requisitos funcionales

| Requisito | Prueba / evidencia | Escenario manual |
|-----------|--------------------|------------------|
| FR-001 Marcar un plato desde cocina | `backend/tests/contract/marcar-estado.test.js`, `frontend/tests/pages/CocinaPage.test.jsx` | 1 |
| FR-002 Solo en pedidos pendientes de la partida | `backend/tests/unit/marcar-listo-service.test.js`, `backend/tests/contract/marcar-estado.test.js` | 1 y 4 |
| FR-003 No marcar líneas de otra partida | `backend/tests/contract/marcar-estado.test.js` y prueba de componente de `CocinaPage` | 4 |
| FR-004 Distinción accesible de listo | `frontend/tests/components/LineaPlato.test.jsx`, `frontend/tests/i18n/textos.test.jsx` | 1 |
| FR-005 Los demás platos siguen pendientes | `backend/tests/unit/marcar-listo-service.test.js` | 2 |
| FR-006 El pedido desaparece al completar la partida | `backend/tests/integration/pedido-completado.test.js`, `frontend/tests/pages/CocinaPage.test.jsx` | 3 |
| FR-007 Registrar `listoEn` | `backend/tests/unit/momento-listo.test.js`, `frontend/tests/components/LineaPlato.test.jsx` | 8 |
| FR-008 Reflejo en la pantalla del camarero | `backend/tests/contract/estado-sala.test.js`, `backend/tests/integration/reflejo-sala.test.js`, `frontend/tests/pages/SalaPage.test.jsx` | 6 y 7 |
| FR-009 Re-marcar no altera estado ni momento | `backend/tests/unit/momento-listo.test.js`, `backend/tests/contract/marcar-estado.test.js` | 9 |
| FR-010 Bloquear el marcado sin conexión | `frontend/tests/pages/CocinaPage.test.jsx` | 11 |
| FR-011 Coherencia cocina/sala | `backend/tests/integration/reflejo-sala.test.js`, `frontend/tests/pages/SalaPage.test.jsx` | 6, 7 y 11 |
| FR-012 Textos en español de España | `frontend/tests/i18n/textos.test.jsx`, `frontend/tests/services/api.test.js` | Todos |
| FR-013 Marca de la línea completa | `backend/tests/unit/marcar-listo-service.test.js`, `frontend/tests/components/LineaPlato.test.jsx` | 1 |
| FR-014 Deshacer, también desde el aviso ≥10 s | `backend/tests/contract/desmarcar-completado.test.js`, `frontend/tests/components/AvisoPedidoCompletado.test.jsx`, `frontend/tests/pages/CocinaPage.test.jsx` | 5 y 12 |
| FR-015 Deshacer devuelve el plato a pendiente | `backend/tests/contract/desmarcar-completado.test.js`, `backend/tests/integration/reflejo-sala.test.js` | 5 y 12 |
| FR-016 Marcado plato a plato, sin acción masiva | `frontend/tests/pages/CocinaPage.test.jsx`, `frontend/tests/components/LineaPlato.test.jsx` | 1 |

## Criterios de éxito

| Criterio | Prueba / evidencia |
|----------|--------------------|
| SC-001 Marcar en 3 s | `contract/marcar-estado.test.js`, prueba de componente de cocina |
| SC-002 Solo cambia el plato marcado | `unit/marcar-listo-service.test.js` |
| SC-003 Sala refleja en ≤5 s | `integration/reflejo-sala.test.js`, `pages/SalaPage.test.jsx` |
| SC-004 `listoEn` con precisión de minuto | `unit/momento-listo.test.js`, `contract/listo-en.test.js` |
| SC-005 El pedido desaparece en ≤5 s | `integration/pedido-completado.test.js`, `pages/CocinaPage.test.jsx` |
| SC-006 Sin duplicados ni pérdidas | `unit/marcar-listo-service.test.js` (transacción y doble marcado) |
| SC-007 Distinción accesible | `components/LineaPlato.test.jsx` |
| SC-008 Deshacer reaparece en ≤5 s | `contract/desmarcar-completado.test.js`, `pages/CocinaPage.test.jsx` |
| SC-009 Aviso «Deshacer» ≥10 s | `components/AvisoPedidoCompletado.test.jsx` |

## Escenarios manuales del quickstart

1. Marcar una línea: `CocinaPage` + `marcar-estado`.
2. Los demás platos siguen pendientes: `marcar-listo-service`.
3. El pedido desaparece al completar la partida: `pedido-completado`.
4. Línea de otra partida: la UI no muestra la acción; la API responde `403`.
5. Deshacer: `desmarcar-completado`.
6. Reflejo en sala: `estado-sala` + `SalaPage`.
7. Varios camareros: `SalaPage` con suscripción por mesa.
8. `listoEn` fijado: `listo-en`.
9. Re-marcar no cambia el momento: `momento-listo`.
10. Marcado simultáneo: la operación está envuelta en una transacción y la prueba de doble marcado
    conserva un único `listoEn`.
11. Corte momentáneo: la vista de cocina bloquea el marcado y sala se resincroniza al reconectar.
12. Deshacer tras completar: `AvisoPedidoCompletado` + `CocinaPage`.

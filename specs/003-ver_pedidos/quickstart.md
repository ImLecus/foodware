# Quickstart — Validación de «Ver pedidos pendientes en cocina»

Guía para levantar la aplicación y demostrar los escenarios de aceptación **desde la interfaz**,
sin leer código (principio IV de la constitución).

## Requisitos previos

- Docker y `docker-compose` instalados.
- La base de datos no puede usarse sin conexión: el navegador debe alcanzar el backend del local.

## Puesta en marcha

```bash
# desde la raíz del repositorio
docker-compose up --build
```

- Frontend: (según `docker-compose.yml`, p. ej. http://localhost:5173)
- Backend/API: (según `docker-compose.yml`, p. ej. http://localhost:3000/api)

El seed del backend debe crear: las tres partidas, ~20 mesas, un cocinero por partida y varios
pedidos enviados con distintas antigüedades y estados de plato.

## Preparación de la demostración

1. Abre la **vista de cocina** identificada con un cocinero de una partida (p. ej. `principales`).
2. Ten a mano otra pestaña/terminal para enviar pedidos desde sala (historias 01/02) o para usar el
   seed.

## Escenarios a validar

| # | Escenario (spec) | Cómo comprobarlo | Resultado esperado |
|---|------------------|------------------|--------------------|
| 1 | Solo la partida propia (US1.1, FR-002/003) | Abre la vista con varias partidas con pedidos | Solo aparecen pedidos de la partida del cocinero |
| 2 | Orden por espera (US1.2, FR-004) | Observa el orden de la lista | El más antiguo primero; el más reciente al final |
| 3 | Estado vacío (US1.3, FR-012) | Usa una partida sin pedidos pendientes | Se indica «no hay pedidos pendientes» |
| 4 | Sin partida (FR-013) | Usa un cocinero sin partida asignada | Se indica que no hay partida asignada (no se muestran pedidos) |
| 5 | Tiempo transcurrido (US2.1, FR-005) | Mira la cifra de cada pedido | Muestra el tiempo desde el envío original |
| 6 | Tiempo que avanza (US2.3, FR-006) | Deja la vista unos minutos | La cifra se actualiza sola |
| 7 | Platos y cantidades (US2.2, FR-007) | Revisa un pedido con varios platos | Aparecen todos sus platos con su cantidad |
| 8 | Platos ya listos marcados (US2.4, FR-007) | Revisa un pedido parcialmente listo | Se distinguen los platos listos de los pendientes |
| 9 | Mesa mostrada (US2.5, FR-016, SC-009) | Revisa cualquier pedido | Aparece el identificador de su mesa |
| 10 | Pedido nuevo en vivo (US3.1, FR-009/010) | Envía un pedido desde sala para esa partida | Aparece sin recargar, en su posición por antigüedad |
| 11 | Reordenación en vivo (US3.2, FR-011) | Marca/completa un pedido (historia 04) | Desaparece y el resto se reordena sin tocar la pantalla |
| 12 | Desempate de envío (edge case, FR-004) | Provoca dos pedidos con el mismo instante | Se ordenan por orden de llegada, de forma estable |
| 13 | Espera muy larga (edge case) | Revisa un pedido con >1 h | El tiempo se muestra legible (minutos/horas) |
| 14 | Comanda editada (edge case, FR-015) | Edita una comanda ya enviada (historia 02) | Conserva su tiempo y posición, marcándose como modificada |
| 15 | Sin conexión (edge case) | Corta el backend con la vista abierta | Aparece «sin conexión» y la info se marca como no actualizada; al volver, se recupera sin duplicar |

## Cómo ver las pruebas automatizadas

```bash
# backend
cd backend && npm test

# frontend
cd frontend && npm test
```

Las pruebas cubren el orden y filtrado de pendientes, el desempate, el tiempo desde el envío
original, los estados vacío/sin partida y el refresco por SSE.

## Fuera de alcance de esta guía

- Marcar platos como listos (historia 04).
- Señales visuales/auditivas de sala (historia 05).
- Cierre de cuenta, dashboard y administración de la carta (historias 06, 07, 08).

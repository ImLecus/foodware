# Quickstart — Validación de «Marcar platos como listos»

Guía para levantar la aplicación y demostrar los escenarios de aceptación **desde la interfaz**,
sin leer código (principio IV de la constitución).

## Requisitos previos

- Docker y `docker-compose` instalados.
- Puertos libres para el frontend y el backend (por defecto, según `docker-compose.yml`).

## Puesta en marcha

```bash
# desde la raíz del repositorio
docker-compose up --build
```

- Frontend: (según `docker-compose.yml`, p. ej. http://localhost:5173)
- Backend/API: (según `docker-compose.yml`, p. ej. http://localhost:3000/api)

Con la base de datos de ejemplo (seed) del backend deben existir al menos: tres partidas, algunas
mesas, un cocinero por partida y pedidos enviados con varias líneas.

## Preparación de la demostración

1. Abre la **pantalla de cocina** identificada con una partida (por ejemplo, `principales`).
2. Abre en otra ventana la **pantalla de sala** de la mesa de uno de los pedidos pendientes.
3. Comprueba que la cocina muestra solo pedidos pendientes de esa partida, ordenados del más
   antiguo al más reciente (historia 03). La marca se aplica a la **partida del cocinero**; un
   pedido con líneas de otras partidas puede seguir pendiente en ellas sin impedir que el aviso
   «Pedido completado» aparezca al terminar la parte de esta partida.

## Escenarios a validar

| # | Escenario (spec) | Cómo comprobarlo | Resultado esperado |
|---|------------------|------------------|--------------------|
| 1 | Marcar un plato como listo (US1.1) | En cocina, pulsa marcar en una línea del pedido | La línea pasa a `listo` y muestra su marca |
| 2 | Los demás platos siguen pendientes (US1.2) | Tras marcar una línea, observa el resto del pedido | Las demás líneas siguen `pendiente` |
| 3 | El pedido desaparece al completar la partida (US1.3) | Marca todas las líneas de tu partida del pedido | El pedido deja de aparecer como pendiente en cocina para esa partida |
| 4 | Solo la partida propia (US1.4) | Intenta actuar sobre una línea de otra partida | La acción no está disponible / no cambia nada |
| 5 | Deshacer la marca (US1.5) | Deshaz la marca de una línea lista | La línea vuelve a `pendiente` en cocina |
| 6 | Reflejo en sala (US2.1, US2.2) | Marca una línea y mira la pantalla de sala | El plato aparece `listo` sin recargar |
| 7 | Varios camareros (US2.3) | Abre la misma mesa en dos pantallas de sala y marca en cocina | Ambas pantallas reflejan el cambio |
| 8 | Registro del momento (US3.1) | Consulta el estado de la línea marcada | La línea muestra `listoEn` fijado |
| 9 | Re-marcar no altera el momento (US3.2) | Vuelve a marcar una línea ya lista | `listoEn` no cambia |
| 10 | Marcado simultáneo (edge case) | Desde dos pantallas de cocina de la misma partida, marca la misma línea | Un único `listoEn`, sin duplicados |
| 11 | Corte momentáneo (edge case) | Detén y reinicia el backend; vuelve a marcar | La marca no se pierde y el estado es coherente |
| 12 | Deshacer tras completar la partida (US1.6, FR-014, SC-009) | Marca todas las líneas de tu partida del pedido y, en el aviso «Pedido completado», pulsa «Deshacer» dentro de los 10 s siguientes | El pedido reaparece como pendiente en cocina para esa partida con la última línea en `pendiente`; el aviso se retira y sala refleja el cambio |

El seed incluye pedidos mixtos para comprobar que la completitud es por partida. No se debe intentar
completar una línea de otra partida: la interfaz no ofrece esa acción y la API responde `403` si se
intenta.

## Cómo ver las pruebas automatizadas

```bash
# backend
cd backend && npm test

# frontend
cd frontend && npm test
```

Las pruebas cubren la regla de negocio de marcar/deshacer (idempotencia y momento único), el aviso
temporal con «Deshacer» (duración mínima y reversión del pedido completado), los contratos REST
(`contracts/openapi.yaml`) y los flujos de la pantalla de cocina y de sala. El mapa de requisitos a
pruebas está en [`verification.md`](./verification.md).

## Fuera de alcance de esta guía

- Señales visuales/auditivas de sala (historia 05).
- Cierre de cuenta, dashboard y administración de la carta (historias 06, 07, 08).

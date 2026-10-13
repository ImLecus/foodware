# Quickstart — Validación de la historia 002 (Editar una comanda enviada)

**Feature**: `002-editar-comanda` | **Date**: 2026-10-13

Guía para levantar el sistema y comprobar, **desde la interfaz y sin leer código**, que la
funcionalidad cumple la spec. Detalles en [`data-model.md`](./data-model.md) y
[`contracts/openapi.yaml`](./contracts/openapi.yaml).

## Prerrequisitos

- Los mismos de la historia 001 (Docker y Docker Compose; puertos 5173/3000/5432).
- Debe existir al menos **una comanda ya enviada** (se crea con la historia 001 o con el seed).

## Puesta en marcha

```bash
cp .env.example .env
docker compose up --build
docker compose exec backend npm run seed   # mesas, carta y una comanda enviada de ejemplo
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`

## Ejecutar las pruebas automatizadas

```bash
docker compose run --rm backend npm test    # API de edición (Supertest)
docker compose run --rm frontend npm test   # editor de comanda (React Testing Library)
```

Resultado esperado: todas las pruebas en verde.

## Escenarios de validación manual

Cada escenario corresponde a un criterio de aceptación de la spec.

1. **Editar directamente (FR-001)** — Abre una comanda ya enviada. Resultado: entra en modo edición
   sin pedir "reabrir".
2. **Añadir plato (FR-002)** — Añade un plato nuevo. Resultado: se incorpora a la comanda existente.
3. **Retirar plato (FR-003)** — Retira un plato. Resultado: desaparece del pedido vigente.
4. **Ajustar cantidad e indicaciones (FR-004, FR-005)** — Cambia la cantidad y corrige una
   indicación. Resultado: la comanda refleja ambos cambios.
5. **Marca de modificada (FR-009)** — Tras editar, consulta la comanda. Resultado: aparece marcada
   como **modificada**, distinta de un pedido nuevo.
6. **Única comanda y misma mesa (FR-006, FR-007, FR-008)** — Comprueba el listado. Resultado: sigue
   siendo **una sola comanda**, vinculada a la **misma mesa**, sin duplicados.
7. **Enviar cambios explícito (FR-014, SC-006)** — Con cambios sin enviar, pulsa **"Enviar
   cambios"**. Resultado: cocina recibe la modificación marcada como tal; antes de pulsarlo, no se
   comunica nada.
8. **Comanda vacía (FR-011)** — Intenta retirar el último plato. Resultado: el sistema lo impide.
9. **Comanda no editable (FR-012)** — Intenta editar una comanda cerrada. Resultado: se rechaza con
   aviso de que no admite cambios.
10. **Bloqueo de edición (FR-015)** — Abre la misma comanda en dos dispositivos. Resultado: el
    segundo no puede editar e indica que está siendo editada por otro camarero.
11. **Abrir sin cambios (caso límite)** — Abre para editar y no cambies nada; sal. Resultado: la
    comanda **no** queda marcada como modificada.
12. **Sin conexión (clarificación)** — Detén el backend durante una edición. Resultado: indicador
    "sin conexión", no permite guardar ni enviar y conserva lo escrito en pantalla.

## Criterios de éxito a comprobar

- **SC-001**: editar (añadir o retirar) y confirmar el cambio en menos de 1 minuto.
- **SC-002**: 0 comandas nuevas o duplicadas por edición.
- **SC-003**: el 100 % de las comandas editadas quedan marcadas como modificadas.
- **SC-005**: ninguna edición deja la comanda sin platos.
- **SC-006**: ninguna modificación llega a cocina sin pulsar "enviar cambios".

## Fuera de alcance (no se valida aquí)

Toma inicial de comandas (001), pantalla de cocina (003), marcar platos como listos (004), señales
al camarero (005), cierre de cuenta (006), dashboard (007) y gestión de la carta (008).

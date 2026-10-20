# Quickstart — Validación de la historia 002 (Editar un pedido enviado)

**Feature**: `002-editar-comanda` | **Date**: 2026-10-20

Guía para levantar el sistema y comprobar, **desde la interfaz y sin leer código**, que la
funcionalidad cumple la spec. Detalles en [`data-model.md`](./data-model.md) y
[`contracts/openapi.yaml`](./contracts/openapi.yaml).

## Prerrequisitos

- Los mismos de la historia 001 (Docker y Docker Compose; puertos 5173/3000).
- Debe existir al menos **un pedido ya enviado** (se crea con la historia 001 o con el seed).

## Puesta en marcha

```bash
cp .env.example .env
docker compose up --build
docker compose exec backend npm run seed   # mesas, carta y un pedido enviado de ejemplo
```

- Frontend: `http://localhost:5173`
- API: `http://localhost:3000/api`
- El estado de sala/cocina se actualiza en vivo por SSE (`GET /api/eventos`), sin recargar.
- El periodo de inactividad del bloqueo es configurable con `BLOQUEO_INACTIVIDAD_MINUTOS` en
  `.env` (**15** minutos por defecto). Para probar la caducidad sin esperar, se puede usar un valor
  bajo (por ejemplo `1`) y reiniciar el backend.

## Ejecutar las pruebas automatizadas

```bash
docker compose run --rm backend npm test    # API de edición (Supertest)
docker compose run --rm frontend npm test   # editor de pedido (React Testing Library)
```

Resultado esperado: todas las pruebas en verde.

## Escenarios de validación manual

Cada escenario corresponde a un criterio de aceptación de la spec.

1. **Editar directamente (FR-001)** — Abre un pedido ya enviado. Resultado: entra en modo edición
   sin pedir "reabrir".
2. **Añadir plato (FR-002)** — Añade un plato nuevo. Resultado: se incorpora al pedido existente.
3. **Retirar plato (FR-003)** — Retira un plato. Resultado: desaparece del pedido vigente.
4. **Ajustar cantidad e indicaciones (FR-004, FR-005)** — Cambia la cantidad y corrige una
   indicación. Resultado: el pedido refleja ambos cambios.
5. **Marca de modificada (FR-009)** — Tras editar, consulta el pedido. Resultado: aparece marcada
   como **modificada**, distinta de un pedido nuevo.
6. **Única pedido y misma mesa (FR-006, FR-007, FR-008)** — Comprueba el listado. Resultado: sigue
   siendo **una soel pedido**, vinculada a la **misma mesa**, sin duplicados.
7. **Enviar cambios explícito (FR-014, SC-006)** — Con cambios sin enviar, pulsa **"Enviar
   cambios"**. Resultado: cocina recibe la modificación marcada como tal; antes de pulsarlo, no se
   comunica nada.
8. **Pedido vacío (FR-011)** — Intenta retirar el último plato. Resultado: el sistema lo impide.
9. **Pedido no editable (FR-012)** — Intenta editar un pedido cerrado. Resultado: se rechaza con
   aviso de que no admite cambios.
10. **Bloqueo de edición (FR-015)** — Abre el mismo pedido en dos dispositivos. Resultado: el
    segundo no puede editar e indica que está bloqueado por otro camarero (`423`); la consulta del
    bloqueo lo muestra como `bloqueado`.
11. **Liberación al enviar cambios (FR-015, SC-007)** — Con el pedido bloqueado en el dispositivo
    A y cambios sin enviar, pulsa **"Enviar cambios"**. Resultado: cocina recibe la modificación y
    el bloqueo queda libre; el dispositivo B ya puede abrir el pedido.
12. **Liberación al cancelar o salir (FR-015, SC-007)** — Abre el pedido en A sin guardar cambios y
    pulsa **"Cancelar"** (o sal de la edición). Resultado: el bloqueo se libera, B puede editarlo y
    el pedido **no** queda marcado como modificado.
13. **Expiración por inactividad (FR-015, SC-007)** — Con `BLOQUEO_INACTIVIDAD_MINUTOS=1`, abre el
    pedido en A y no interactúes durante más de un minuto. Resultado: la consulta del bloqueo pasa
    a `expirado`/`libre`; B puede abrirlo y A recibe un aviso de bloqueo expirado al intentar
    guardar, debiendo reabrir el pedido.
14. **Abrir sin cambios (caso límite)** — Abre para editar y no cambies nada; sal. Resultado: la
    pedido **no** queda marcado como modificado.
15. **Sin conexión (clarificación)** — Detén el backend durante una edición. Resultado: indicador
    "sin conexión", no permite guardar ni enviar y conserva lo escrito en pantalla.

## Criterios de éxito a comprobar

- **SC-001**: editar (añadir o retirar) y confirmar el cambio en menos de 1 minuto.
- **SC-002**: 0 pedidos nuevos o duplicadas por edición.
- **SC-003**: el 100 % de los pedidos editadas quedan marcadas como modificadas.
- **SC-005**: ninguna edición deja el pedido sin platos.
- **SC-006**: ninguna modificación llega a cocina sin pulsar "enviar cambios".
- **SC-007**: el 100 % de los bloqueos se libera al enviar, al cancelar o salir, o al expirar por
  inactividad; ningún pedido queda bloqueado indefinidamente.

## Fuera de alcance (no se valida aquí)

Toma inicial de pedidos (001), pantalla de cocina (003), marcar platos como listos (004), señales
al camarero (005), cierre de cuenta (006), dashboard (007) y gestión de la carta (008).

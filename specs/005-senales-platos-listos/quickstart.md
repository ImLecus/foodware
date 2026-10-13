# Phase 1 — Quickstart: Señales de platos listos por mesa

Guía para **validar la historia 005 de principio a fin** usando la aplicación, sin leer
código. No incluye código de implementación: los detalles están en
[data-model.md](./data-model.md) y [contracts/api.md](./contracts/api.md).

## Requisitos previos

- Docker y Docker Compose instalados.
- Puertos libres para el frontend, el backend y PostgreSQL (los define `docker-compose.yml`).
- Conexión a la red local entre las pantallas que se usen en la prueba.

## Puesta en marcha

1. Levantar el entorno:

   ```bash
   docker compose up --build
   ```

2. Abrir la **vista de sala** (camarero) y la **vista de cocina** en pantallas o pestañas
   distintas (p. ej. `http://localhost:<puerto-frontend>`).

3. Dispone de datos de ejemplo: al menos una mesa abierta con platos en estado `pendiente`
   (si la base está vacía, usar el script de datos de ejemplo del proyecto).

## Escenarios de validación

### A. Estado de los platos por mesa en vivo (US1, P1)

1. En sala, comprobar que se ven las **mesas abiertas** con la relación de sus platos y el
   estado de cada uno (pendiente/listo).
2. En cocina, marcar un plato como **listo**.
3. **Esperado**: sin tocar la pantalla de sala, ese plato pasa a "listo" en **≤ 5 s** (SC-002);
   los demás platos siguen "pendiente".
4. Comprobar que los platos listos se **distinguen claramente** de los pendientes (FR-003, SC-001).

### B. Aviso de mesa completa (US2, P2)

1. En cocina, marcar como listo el **último** plato pendiente de una mesa.
2. **Esperado**: en la vista de sala aparece un **aviso destacado y perceptible** asociado a
   esa mesa (FR-005 a FR-008, SC-003).
3. Con el sonido activado, comprobar que suena **una sola vez** y que la señal visual
   **permanece** sin repetirse.
4. Repetir con varias mesas completas a la vez: cada aviso **identifica su mesa** (FR-007, SC-004).

### C. Descartar el aviso (US3, P3)

1. Con un aviso activo, pulsarlo para **descartarlo** (una sola acción, SC-005).
2. **Esperado**: el aviso deja de mostrarse y de repetirse; no reaparece mientras no haya un
   nuevo plato listo en esa mesa (FR-010, SC-006).

### D. Reversibilidad y regeneración (FR-013)

1. Con una mesa completa y su aviso activo, en cocina **deshacer** la marca de un plato.
2. **Esperado**: el aviso se **retira** y la mesa deja de estar completa.
3. Volver a marcar ese plato como listo.
4. **Esperado**: se **genera de nuevo** el aviso de mesa completa.
5. Descartar un aviso, y tras un nuevo plato listo en esa mesa, comprobar que vuelve a generarse.

### E. Mesa de un solo plato (edge case)

1. Abrir una mesa con **un único plato** y marcarlo como listo en cocina.
2. **Esperado**: la mesa se considera completa y avisa igual que cualquier otra.

### F. Sin conexión y resincronización (FR-014, SC-008)

1. Con la vista de sala abierta, cortar la conexión del dispositivo (o parar el backend).
2. **Esperado**: aparece un indicador de **"sin conexión"**, la información se marca como no
   actualizada y **no se puede descartar** el aviso.
3. Restaurar la conexión.
4. **Esperado**: la vista vuelve a estar al día (estados y avisos) en **≤ 10 s**, reanudando la
   actualización en vivo.

### G. Estados vacío y de carga (FR-015)

1. Sin mesas abiertas, abrir la vista de sala.
2. **Esperado**: mensaje claro de **"No hay mesas abiertas"** (no una pantalla en blanco).
3. Al recargar, **Esperado**: mientras llegan los datos, se muestra un **indicador de carga**.

## Criterios de éxito a comprobar

- [ ] SC-001: un camarero identifica los platos listos de una mesa en ≤ 2 s.
- [ ] SC-002: un plato marcado en cocina se refleja en sala en ≤ 5 s sin recargar.
- [ ] SC-003: el 100 % de las mesas completadas genera un aviso asociado a esa mesa.
- [ ] SC-004: el aviso se percibe desde cualquier punto de la sala.
- [ ] SC-005: descartar el aviso se hace con una sola acción en ≤ 2 s.
- [ ] SC-006: tras descartar, el aviso no se repite hasta un nuevo plato listo.
- [ ] SC-008: tras reconectar, la vista está al día en ≤ 10 s.

## Referencias

- Especificación: [spec.md](./spec.md)
- Modelo de datos: [data-model.md](./data-model.md)
- Contratos de API: [contracts/api.md](./contracts/api.md)
- Decisiones técnicas: [research.md](./research.md)

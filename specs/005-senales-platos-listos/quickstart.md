# Phase 1 — Quickstart: Señales de platos listos por mesa

Guía para **validar la historia 005 de principio a fin** usando la aplicación, sin leer
código. No incluye código de implementación: los detalles están en
[data-model.md](./data-model.md) y [contracts/api.md](./contracts/api.md).

## Requisitos previos

- Docker y Docker Compose instalados.
- Puertos libres para el frontend y el backend (los define `docker-compose.yml`); SQLite se guarda en un fichero.
- Conexión a la red local entre las pantallas que se usen en la prueba.
- Al menos un plato de una mesa **ya enviado a cocina** para poder marcarlo.

## Puesta en marcha

1. Levantar el entorno:

   ```bash
   docker compose up --build
   ```

2. Abrir la **vista de sala** (estado y avisos) y, si se dispone de ella, la **vista de cocina**,
   en pantallas o pestañas distintas (p. ej. `http://localhost:<puerto-frontend>`).
   - Para marcar platos, usa el mecanismo de marcado de la historia (`PUT
     /api/pedidos/{pedidoId}/lineas/{lineaId}/estado` con `{"estado":"listo"}`), que también
     reutilizará la pantalla de cocina de la historia 004.

3. Disponer de datos de ejemplo: al menos una mesa abierta con platos cuyo pedido esté
   `enviada` y en estado `pendiente` (si la base está vacía, usar `npm --prefix backend run seed`).

## Escenarios de validación

### A. Estado de los platos por mesa en vivo (US1, P1)

1. En sala, comprobar que se ven las **mesas abiertas** con la relación de los platos **de su
   comanda ya enviada** y el estado de cada uno (pendiente/listo).
2. Marcar un plato como **listo** (mecanismo de la historia).
3. **Esperado**: sin tocar la pantalla de sala, ese plato pasa a "listo" en **≤ 5 s** (SC-002);
   los demás platos siguen "pendiente".
4. Comprobar que los platos listos se **distinguen claramente** de los pendientes (FR-003, SC-001).

### B. Aviso de mesa completa (US2, P2)

1. Marcar como listo el **último** plato pendiente (enviado) de una mesa.
2. **Esperado**: en la vista de sala aparece un **aviso destacado y perceptible** asociado a
   esa mesa (FR-005 a FR-008, SC-003).
3. Con el sonido activado (estado por defecto), comprobar que suena **una sola vez** y que la
   señal visual **permanece** sin repetirse. Silenciar con el control de la pantalla y comprobar
   que la señal visual sigue; reactivarlo y comprobar que vuelve a sonar en el siguiente aviso.
4. Repetir con varias mesas completas a la vez: cada aviso **identifica su mesa** (FR-007, SC-004)
   y se percibe a 5 m en menos de 3 s sin sonido.

### C. Descartar el aviso (US3, P3)

1. Con un aviso activo, pulsarlo para **descartarlo** (una sola acción, SC-005).
2. **Esperado**: el aviso deja de mostrarse; no reaparece mientras no haya un
   nuevo plato listo en esa mesa (FR-010, SC-006).

### D. Reversibilidad y regeneración (FR-013)

1. Con una mesa completa y su aviso activo, **deshacer** la marca de un plato.
2. **Esperado**: el aviso se **retira** y la mesa deja de estar completa.
3. Volver a marcar ese plato como listo.
4. **Esperado**: se **genera de nuevo** el aviso de mesa completa.
5. Descartar un aviso, y tras un nuevo plato listo en esa mesa, comprobar que vuelve a generarse.

### E. Mesa de un solo plato y mesa sin comanda enviada (edge cases)

1. Abrir una mesa con **un único plato enviado** y marcarlo como listo.
2. **Esperado**: la mesa se considera completa y avisa igual que cualquier otra.
3. Con una mesa cuya comanda **aún no se ha enviado**, comprobar que aparece como mesa abierta
   pero **sin platos marcables** y que **no** se considera completa ni avisa.
4. Enviar la comanda y marcarla completa: **Esperado**: ahora sí se considera completa y avisa.
5. Con una mesa **abierta** cuya comanda esté solo en curso, comprobar que aparece en la lista
   de mesas abiertas (no desaparece) aunque todavía no tenga platos marcables.

### E2. Edición de una comanda ya enviada (FR-013)

1. Completar todos los platos enviados de una mesa hasta que aparezca su aviso.
2. **Añadir** a esa comanda ya enviada un plato nuevo (editar el pedido) y **confirmar los
   cambios** (equivale a `POST /api/pedidos/{pedidoId}/enviar-cambios`; el recálculo ocurre al
   confirmarlos, no al añadir la línea).
3. **Esperado**: los platos ya listos que no se han tocado **siguen listos**; la mesa deja de
   estar completa y su aviso se **retira**.
4. Marcar como listo el plato nuevo.
5. **Esperado**: la mesa vuelve a considerarse completa y se genera un **aviso nuevo**.
6. **Retirar** un plato ya enviado que estuviera pendiente, confirmando los cambios, dejando el resto listos.
7. **Esperado**: se recalcula la completitud y, si ya no queda ningún plato pendiente, la mesa
   se considera completa.

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

### H. Descarte global desde dos pantallas de camarero (FR-009, FR-010, SC-009)

1. Abrir la vista de sala en **dos pantallas o dispositivos distintos** (dos camareros).
2. Marcar como listo el último plato pendiente de una mesa.
3. **Esperado**: el aviso de esa mesa aparece en **ambas** pantallas.
4. En una de las pantallas, **descartar** el aviso.
5. **Esperado**: el aviso desaparece en **las dos** pantallas en **≤ 5 s**, sin recargar ni
   volver a abrir la mesa (SC-009); en ninguna de ellas reaparece mientras no haya un nuevo
   plato listo en esa mesa (FR-010).
6. Deshacer la marca de un plato y volver a marcarlo como listo.
7. **Esperado**: se genera un aviso nuevo y vuelve a mostrarse en **ambas** pantallas.

### I. Cierre de la cuenta de una mesa con aviso activo (FR-010)

1. Completar los platos de una mesa para que aparezca su aviso (sin descartarlo).
2. Cerrar la cuenta de esa mesa (acción de la historia 06).
3. **Esperado**: la mesa deja de mostrarse en la vista de sala y su aviso desaparece en
   **todas** las pantallas; el aviso no queda huérfano ni reaparece.
   *(Si el cierre de cuenta aún no está disponible, comprobar que la vista deja de mostrar la
   mesa y su aviso al dejar de estar abierta.)*

## Criterios de éxito a comprobar

> **Comprobación manual explícita (E1)**: SC-001 y SC-005 son perceptivos y se verifican a mano
> durante los escenarios A/C, cronometrando una sola vez cada acción (mirar la pantalla para
> distinguir los platos listos; descartar un aviso con una sola acción). SC-004 se verifica a
> 5 m de distancia en el escenario B. No son automatizables de forma fiable.

- [ ] SC-001: un camarero identifica los platos listos de una mesa en ≤ 2 s (**manual**, escenario A).
- [ ] SC-002: un plato marcado en cocina se refleja en sala en ≤ 5 s sin recargar.
- [ ] SC-003: el 100 % de las mesas completadas genera un aviso asociado a esa mesa.
- [ ] SC-004: el aviso permite identificar la mesa a 5 m en menos de 3 s con la señal visual, sin sonido (**manual**, escenario B).
- [ ] SC-005: descartar el aviso se hace con una sola acción en ≤ 2 s (**manual**, escenario C).
- [ ] SC-006: tras descartar, el aviso no se repite hasta un nuevo plato listo.
- [ ] SC-008: tras reconectar, la vista está al día en ≤ 10 s.
- [ ] SC-009: el descarte se refleja en todas las pantallas de camarero en ≤ 5 s.

## Referencias

- Especificación: [spec.md](./spec.md)
- Modelo de datos: [data-model.md](./data-model.md)
- Contratos de API: [contracts/api.md](./contracts/api.md)
- Decisiones técnicas: [research.md](./research.md)

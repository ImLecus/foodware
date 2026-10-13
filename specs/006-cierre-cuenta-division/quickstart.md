# Phase 1 — Quickstart: Cierre y división de cuenta

Guía para **validar la historia 006 de principio a fin** usando la aplicación, sin leer
código. No incluye código de implementación: los detalles están en
[data-model.md](./data-model.md) y [contracts/api.md](./contracts/api.md).

## Requisitos previos

- Docker y Docker Compose instalados.
- Puertos libres para el frontend y el backend (los define `docker-compose.yml`); SQLite se guarda en un fichero.
- Conexión a la red local entre las pantallas que se usen en la prueba.

## Puesta en marcha

1. Levantar el entorno:

   ```bash
   docker compose up --build
   ```

2. Abrir la **vista de sala** (camarero) y, si se quiere comprobar la integración, la vista de
   cocina en otra pestaña (p. ej. `http://localhost:<puerto-frontend>`).

3. Disponer de datos de ejemplo: una mesa abierta con al menos dos consumos de distinto
   importe (si la base está vacía, usar el script de datos de ejemplo del proyecto).

## Escenarios de validación

### A. Cerrar la cuenta y comprobar el total (US1, P1)

1. En la vista de sala, seleccionar una mesa abierta y abrir la **cuenta**.
2. **Esperado**: se muestra el detalle de lo consumido y el **importe total**, con los precios
   fijados al pedir, en euros (€) con formato español (FR-002, FR-003).
3. Comprobar a mano que el total coincide con la suma de los importes de los platos.
4. **Cancelar** el cierre.
5. **Esperado**: la mesa sigue abierta y la cuenta no ha cambiado (FR-004).

### B. Cerrar con un único pago (US1 + US3, P1)

1. Abrir la cuenta y confirmar el cobro **sin dividir** (un solo pago).
2. **Esperado**: se genera el ticket con el total, la mesa queda **cerrada** y desaparece de la
   vista de sala (FR-011, FR-012).
3. Volver a intentar cerrar esa misma mesa.
4. **Esperado**: el sistema lo **rechaza** por estar ya cerrada (FR-014, SC-005).

### C. División en partes iguales con redondeo (US2, P2)

1. Con una cuenta de, por ejemplo, **42,50 €**, dividirla en **3 partes iguales**.
2. **Esperado**: las partes son 14,17 € / 14,17 € / 14,16 € (el céntimo sobrante se reparte de
   uno en uno empezando por la primera) y la suma es exactamente 42,50 € (FR-006, FR-018,
   SC-003).
3. Repetir con importes que no sean divisibles (p. ej. 10,00 € entre 3 → 3,34 / 3,33 / 3,33) y
   comprobar que la suma sigue cuadrando.

### D. División por consumo, con un plato compartido (US2, P2)

1. Dividir la cuenta **según lo consumido**: asignar cada plato a un comensal.
2. Asignar un plato compartido **repartiendo su importe** entre dos partes.
3. **Esperado**: cada parte queda asociada a su comensal y la suma de las partes coincide con
   el total (FR-007, FR-008, FR-009, FR-015).
4. Comprobar que todas las partes muestran su importe (US2, scenario 3).

### E. Pago por partes y cierre (US3, P3)

1. Con la cuenta dividida, marcar **cada parte como pagada por separado**.
2. **Esperado**: mientras quede alguna parte pendiente, la mesa **no** se puede cerrar
   (FR-016, SC-007); al marcar la última, el cierre se habilita (FR-011).
3. Confirmar el cierre.
4. **Esperado**: la mesa queda cerrada y deja de aparecer en sala.

### F. Ticket final (US3, P3)

1. Tras el cierre, abrir el **ticket** de la mesa.
2. **Esperado**: muestra el **total** de la cuenta y el **desglose de cada parte** con su
   importe (FR-010, SC-004).
3. Con la cuenta aún abierta, intentar ver el ticket.
4. **Esperado**: se indica que la cuenta todavía no está cerrada.

### G. La cuenta cambia durante la división (FR-017)

1. Iniciar la división de una cuenta (sin confirmar).
2. Desde otra pantalla, **añadir o retirar un plato** de esa mesa (historia 02).
3. Intentar confirmar el cierre con la división antigua.
4. **Esperado**: el sistema **rechaza** el cierre porque la cuenta cambió; al recargar, el
   total es el nuevo y hay que **rehacer la división** (FR-017).
5. Cancelar y volver a abrir la cuenta: **Esperado**: el total refleja lo consumido
   actualmente.

### H. Mesa sin consumos (edge case)

1. Abrir la cuenta de una mesa **sin consumos**.
2. **Esperado**: el total es **0,00 €** y no se permite confirmar un cierre sin importe.

### I. Sin conexión (suposición compartida)

1. Abrir la cuenta y cortar la conexión.
2. **Esperado**: aparece el indicador **"sin conexión"** y no se permite confirmar el cierre;
   lo compuesto en pantalla (división, partes) se conserva (contract §5).
3. Restaurar la conexión y confirmar.
4. **Esperado**: el cierre se completa con normalidad.

## Criterios de éxito a comprobar

- [ ] SC-001: el 100 % de las cuentas cerradas muestran un total igual a la suma de los consumos con el precio fijado al pedir.
- [ ] SC-002: cerrar la cuenta de una mesa se hace en menos de 2 minutos.
- [ ] SC-003: en el 100 % de las cuentas divididas, la suma de las partes coincide exactamente con el total, incluso con redondeo.
- [ ] SC-004: el ticket incluye el total y el desglose de cada parte con su importe en el 100 % de los cierres.
- [ ] SC-005: una mesa cerrada rechaza el 100 % de las nuevas operaciones.
- [ ] SC-006: completar la división entre varios comensales se hace en menos de 3 minutos.
- [ ] SC-007: una cuenta dividida mantiene la mesa abierta hasta que el 100 % de sus partes están pagadas.

## Referencias

- Especificación: [spec.md](./spec.md)
- Modelo de datos: [data-model.md](./data-model.md)
- Contratos de API: [contracts/api.md](./contracts/api.md)
- Decisiones técnicas: [research.md](./research.md)

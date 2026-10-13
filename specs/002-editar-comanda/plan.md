# Implementation Plan: Editar una comanda enviada

**Branch**: `002-editar-comanda` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-editar-comanda/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

El camarero reabre directamente una comanda ya enviada y la modifica sobre la marcha (añadir,
retirar y ajustar platos e indicaciones), sin crear una comanda nueva. Los cambios se aplican sobre
la comanda original, que queda **marcada como modificada** y vinculada a la misma mesa. Los cambios
no se comunican a cocina solos: el camarero debe ejecutar explícitamente **"enviar cambios"**.
Mientras un camarero edita la comanda, esta queda **bloqueada** para los demás. El enfoque técnico
reutiliza el stack y la infraestructura de la historia 001 (React + Chakra UI, ExpressJS,
PostgreSQL, Docker) y añade el estado de modificación, el registro de cambios, el bloqueo de
edición y el envío explícito de cambios.

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 20 (frontend y backend)

**Primary Dependencies**: Frontend: React 18, Chakra UI, Vite. Backend: ExpressJS 4, `pg`
(node-postgres), `zod`, `cors`. Pruebas: Vitest, React Testing Library, Supertest. (Idénticas a la
historia 001.)

**Storage**: PostgreSQL 16 (servicio en Docker), `pg`, migraciones SQL versionadas. Se amplía el
esquema de la historia 001 (comanda, línea de comanda) y se añade la tabla de modificaciones.

**Testing**: Vitest (unitarias e integración), React Testing Library (sala) y Supertest (API).

**Target Platform**: Aplicación web en navegador (tabletas de sala) sobre la red local; backend
Node.js en Docker.

**Project Type**: Aplicación web (frontend + backend) en el mismo repositorio, **construida sobre
la base de la historia 001**.

**Performance Goals**: guardar una edición con retorno del servidor en < 1 s en la red local;
adquirir/liberar el bloqueo de edición en < 500 ms; "enviar cambios" en < 1 s.

**Constraints**: Exige conexión (sin offline); interfaz en español de España y precios en euros;
entorno reproducible con Docker; ningún secreto en el repositorio.

**Scale/Scope**: Un único restaurante; decenas de mesas; ~4 camareros; edición de comandas ya
enviadas; versión 1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicidad ante todo** — PASS. Se reutiliza la base de la 001; solo se añade lo necesario
  (estado de modificación, registro de cambios, bloqueo y envío explícito), sin infraestructura de
  tiempo real ni capas extra.
- **II. Idioma y mercado: español de España y euro** — PASS. UI y mensajes en español de España;
  importes en €.
- **III. Cero alcance fantasma** — PASS. El plan cubre únicamente FR-001…FR-015 de la historia 02;
  cocina (003), marcar listos (004), señales (005), cierre de cuenta (006), dashboard (007) y carta
  (008) quedan fuera.
- **IV. Verificable por una persona no técnica** — PASS. `quickstart.md` describe la validación
  manual desde la interfaz.
- **V. Datos del usuario con respeto** — PASS. Solo se guarda la identificación del camarero y los
  datos de la comanda/modificación; configuración por variables de entorno (nunca en el repo).
- **VI. Conventional Commits obligatorios** — PASS. Los commits seguirán Conventional Commits.
- **VII. Desarrollo en equipo** — PASS. Estructura y arranque documentados y reproducibles con
  Docker; decisiones recogidas en `research.md`.
- **Tecnología obligatoria (React, Chakra UI, ExpressJS)** — PASS. Mismo stack que la 001.
- **Contenedores (Docker)** — PASS. Se reutiliza el `docker-compose.yml` de la 001.
- **Calidad y pruebas** — PASS. Pruebas automatizadas junto al desarrollo (Vitest/RTL/Supertest).
- **Flujo de trabajo (Git Flow) y parada por tarea** — PASS. La implementación se detendrá al
  completar cada tarea de `tasks.md` para revisión y commit del usuario.

Sin violaciones. **Complexity Tracking** no aplica.

## Project Structure

### Documentation (this feature)

```text
specs/002-editar-comanda/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

Se parte de la estructura creada en la historia 001 y se añaden los ficheros de esta historia.

```text
backend/
├── src/
│   ├── api/
│   │   ├── middleware/
│   │   │   ├── camarero.ts       # identidad (historia 001)
│   │   │   └── bloqueo.ts        # comprobación del bloqueo de edición
│   │   ├── mesas.ts              # historia 001
│   │   ├── platos.ts             # historia 001
│   │   └── comandas.ts           # se amplía: edición, bloqueo y enviar-cambios
│   ├── domain/
│   │   ├── comandas.ts           # historia 001
│   │   └── edicion.ts            # reglas de edición, marcado y envío de cambios
│   ├── db/
│   │   ├── pool.ts               # historia 001
│   │   ├── comandas.ts           # se amplía: estado, modificada, cambios_pendientes, bloqueo
│   │   └── modificaciones.ts     # registro de cambios (trazabilidad)
│   ├── schemas/
│   │   └── edicion.ts            # validación zod de la edición
│   ├── app.ts
│   └── index.ts
├── migrations/                   # nueva migración: modificada, cambios_pendientes, bloqueo, modificaciones
└── tests/                        # edicion.*.test.ts (API)

frontend/
├── src/
│   ├── components/
│   │   ├── Comanda.tsx           # historia 001 (se reutiliza)
│   │   ├── EditorComanda.tsx     # edición de una comanda enviada
│   │   └── EnviarCambios.tsx     # acción explícita "enviar cambios"
│   ├── pages/
│   │   └── Mesas.tsx             # historia 001 (se reutiliza)
│   ├── services/
│   │   └── api.ts                # se amplía: editar, bloqueo, enviar-cambios
│   └── utils/formato.ts          # historia 001
└── tests/                        # edicion.test.tsx
```

**Structure Decision**: misma aplicación web de dos paquetes (`backend/`, `frontend/`) de la 001; se
amplían ficheros existentes y se añaden los específicos de la edición. Sin paquetes ni capas nuevas.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No hay violaciones de la constitución; esta sección no aplica.

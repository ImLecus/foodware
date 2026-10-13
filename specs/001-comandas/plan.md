# Implementation Plan: Abrir mesa y tomar comanda

**Branch**: `001-comandas` | **Date**: 2026-10-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-comandas/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command; its definition describes the execution workflow.

## Summary

El camarero abre una mesa ocupada y toma la comanda plato a plato, agrupada automáticamente por
partidas (entrantes, principales, postres). Puede ajustar cantidades y repetir platos mientras la
comanda está en curso; al confirmarla, queda registrada como enviada, vinculada a su mesa y el
pedido se remite al resto del sistema ya ordenado por partidas. El enfoque técnico es una
aplicación web con frontend React + Chakra UI y backend ExpressJS sobre Node.js con TypeScript,
persistencia en PostgreSQL, todo reproducible con Docker. La identidad del camarero se reutiliza de
la sesión existente (la autenticación queda fuera del alcance de esta historia).

## Technical Context

**Language/Version**: TypeScript 5.x sobre Node.js 20 (frontend y backend)

**Primary Dependencies**: Frontend: React 18, Chakra UI, Vite. Backend: ExpressJS 4, `pg`
(node-postgres), `zod` (validación), `cors`. Pruebas: Vitest, React Testing Library, Supertest.

**Storage**: PostgreSQL 16 (servicio en Docker), accedido con `pg`; migraciones como ficheros SQL
versionados. Los importes se guardan como enteros en céntimos.

**Testing**: Vitest (unitarias e integración), React Testing Library (componentes de sala) y
Supertest (API del backend).

**Target Platform**: Aplicación web en navegador (tabletas de sala) sobre la red local del
restaurante; backend Node.js en contenedor Docker.

**Project Type**: Aplicación web (frontend + backend) en un mismo repositorio.

**Performance Goals**: Confirmar una comanda con retorno del servidor en < 1 s en la red local;
respuestas de API < 500 ms; sin recargas manuales para ver el estado.

**Constraints**: Exige conexión a la red (sin funcionamiento offline); interfaz en español de
España y precios en euros (€); entorno reproducible con Docker; ningún secreto en el repositorio.

**Scale/Scope**: Un único restaurante; decenas de mesas; ~4 camareros; 3 partidas fijas; versión 1.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Simplicidad ante todo** — PASS. Stack mínimo (React/Chakra + Express + PostgreSQL), sin ORM
  ni capas adicionales; se usa SQL directo con `pg`. No se anticipa funcionalidad de otras historias.
- **II. Idioma y mercado: español de España y euro** — PASS. Toda la UI y los mensajes en español
  de España; importes en € con formato español (`Intl.NumberFormat('es-ES', …)`).
- **III. Cero alcance fantasma** — PASS. El plan cubre únicamente FR-001…FR-018 de la historia 01;
  la edición de comandas enviadas, cocina, señales, cierre, dashboard y administración quedan fuera.
- **IV. Verificable por una persona no técnica** — PASS. `quickstart.md` describe la validación
  manual desde la interfaz, sin leer código.
- **V. Datos del usuario con respeto** — PASS. Solo se guarda la identificación del camarero y los
  datos de la comanda; credenciales y configuración por variables de entorno (nunca en el repo).
- **VI. Conventional Commits obligatorios** — PASS. Los commits de esta funcionalidad seguirán el
  formato Conventional Commits.
- **VII. Desarrollo en equipo** — PASS. Estructura y arranque documentados y reproducibles con
  Docker; decisiones recogidas en `research.md`.
- **Tecnología obligatoria (React, Chakra UI, ExpressJS)** — PASS. Se usa exactamente ese stack.
- **Contenedores (Docker)** — PASS. `Dockerfile` y `docker-compose.yml` para base de datos, backend
  y frontend.
- **Calidad y pruebas** — PASS. Pruebas automatizadas junto al desarrollo (Vitest/RTL/Supertest).
- **Flujo de trabajo (Git Flow) y parada por tarea** — PASS. La implementación se detendrá al
  completar cada tarea de `tasks.md` para revisión y commit del usuario.

Sin violaciones. **Complexity Tracking** no aplica.

## Project Structure

### Documentation (this feature)

```text
specs/001-comandas/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── api/             # rutas y controladores Express
│   │   ├── middleware/
│   │   │   └── camarero.ts   # identidad del camarero (sesión existente)
│   │   ├── health.ts
│   │   ├── mesas.ts
│   │   ├── platos.ts
│   │   └── comandas.ts
│   ├── domain/          # lógica de comandas y agrupación por partidas
│   │   └── comandas.ts
│   ├── db/              # pool de conexión, repositorios y consultas (pg)
│   │   ├── pool.ts
│   │   ├── mesas.ts
│   │   ├── platos.ts
│   │   ├── comandas.ts
│   │   └── seed.ts
│   ├── schemas/         # validación de entrada (zod)
│   │   └── comandas.ts
│   ├── app.ts           # composición de la app Express
│   └── index.ts         # arranque del servidor
├── migrations/          # migraciones SQL versionadas
├── tests/               # integración de API (Supertest) y unitarias
├── Dockerfile
└── package.json

frontend/
├── src/
│   ├── components/      # piezas de UI (Chakra)
│   │   ├── Comanda.tsx
│   │   ├── SelectorPlatos.tsx
│   │   └── Conexion.tsx      # indicador "sin conexión"
│   ├── pages/           # pantalla de sala: mesas, comanda en curso
│   │   └── Mesas.tsx
│   ├── services/        # cliente HTTP de la API
│   │   └── api.ts
│   ├── theme/           # tema y localización Chakra (es-ES)
│   ├── utils/
│   │   └── formato.ts        # formato de moneda/números es-ES
│   ├── App.tsx
│   └── main.tsx
├── tests/               # pruebas de componentes (React Testing Library)
├── Dockerfile
└── package.json

docker-compose.yml       # db (PostgreSQL) + backend + frontend
```

**Structure Decision**: Aplicación web con dos paquetes (`backend/` y `frontend/`) en el mismo
repositorio, coherente con el stack obligatorio (React/Chakra en frontend, ExpressJS en backend) y
con el requisito de Docker (`docker-compose.yml` levanta los tres servicios). No se crean capas ni
paquetes adicionales (principio de simplicidad).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No hay violaciones de la constitución; esta sección no aplica.

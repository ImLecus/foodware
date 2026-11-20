<!--
Sync Impact Report
- Version change: 1.0.0 → 1.2.0
- Modified principles: n/a (no se redefinió ningún principio)
- Added principles: VI. Conventional Commits obligatorios; VII. Desarrollo en
  equipo
- Added sections: Tecnología obligatoria (React, Chakra UI, ExpressJS);
  Contenedores (Docker); regla de parada por tarea en Flujo de trabajo (Git Flow)
- Removed sections: ninguna
- Follow-up TODOs: ninguno
-->

# Constitución de Foodware

## Principios fundamentales

### I. Simplicidad ante todo
Ante dos soluciones válidas, se elige siempre la más simple. Esta es la versión 1:
no se añade complejidad anticipada (capas, abstracciones o configuración "por si
acaso"). Cualquier complejidad extra MUST justificarse contra un requisito real y
vigente de la spec.

**Rationale**: el producto debe ser fácil de entender y mantener por 4 personas;
añadir complejidad que aún no se necesita hace el proyecto más lento y frágil.

### II. Idioma y mercado: español de España y euro
Todo el producto visible para el usuario (textos, etiquetas, mensajes, tickets)
MUST estar en español de España. La moneda es el euro (€). Los formatos de fecha y
número siguen la convención española.

**Rationale**: el público objetivo es un restaurante español; cualquier otro idioma
o moneda rompe la experiencia y la confianza.

### III. Cero alcance fantasma
Solo se implementa lo que está escrito y aprobado en la spec. Toda idea nueva MUST
proponerse y documentarse, nunca construirse por iniciativa propia. Ninguna
funcionalidad se añade "de paso".

**Rationale**: protege el alcance de la versión 1 y evita trabajo no pedido ni
verificado.

### IV. Verificable por una persona no técnica
Cada criterio de éxito MUST poder comprobarse usando la aplicación, sin leer código.
Si una persona no técnica no puede verificarlo desde la interfaz, el criterio no es
válido.

**Rationale**: si no se puede demostrar en la app, no se puede afirmar que funciona.

### V. Datos del usuario con respeto
Se piden solo los datos imprescindibles para cada funcionalidad. No se recogen ni
guardan datos personales innecesarios. Está prohibido introducir claves,
contraseñas, tokens o cualquier secreto en el código o en el repositorio.

**Rationale**: respeta a las personas usuarias y evita riesgos de seguridad básicos.

### VI. Conventional Commits obligatorios
Todo commit MUST seguir la especificación Conventional Commits
(`tipo(alcance): descripción`), con tipos como `feat`, `fix`, `docs`, `refactor`,
`test`, `chore`, `style` o `perf`. La descripción se escribe en español de España,
en imperativo y en minúscula. Los cambios incompatibles MUST marcarse con `!` o con
el pie `BREAKING CHANGE:`. Los commits que no cumplan este formato MUST rechazarse
en la revisión.

**Rationale**: un historial uniforme y legible facilita la revisión, el historial
de cambios y la generación automática de versiones.

### VII. Desarrollo en equipo
El proyecto se desarrolla en equipo, no de forma individual. El repositorio MUST
estar preparado para el trabajo colaborativo: documentación clara de puesta en
marcha, entorno reproducible y sin dependencias de configuración exclusiva de una
máquina. Cualquier decisión que afecte al equipo (convenciones, estructura o
herramientas) MUST quedar documentada en el repositorio.

**Rationale**: que cualquier persona del equipo pueda incorporarse, entender y
ejecutar el proyecto sin depender de conocimiento no escrito.

## Tecnología obligatoria

La versión 1 se construye exclusivamente sobre este stack, sin sustituirlo por
alternativas ni añadir frameworks adicionales sin una enmienda previa:

- **Frontend**: React (con Chakra UI como única biblioteca de componentes de
  interfaz). El estilo y los componentes MUST resolverse con Chakra UI salvo
  justificación documentada.
- **Backend**: ExpressJS sobre Node.js, exponiendo una API HTTP.

**Rationale**: fija una base técnica común y sencilla para el equipo de 4 personas,
coherente con el principio de simplicidad.

## Contenedores (Docker)

La aplicación MUST estar preparada para ejecutarse con contenedores Docker. Debe
incluir los `Dockerfile` y la configuración de orquestación (por ejemplo
`docker-compose`) necesarios para levantar el frontend y el backend de forma
reproducible. El comando de arranque documentado MUST funcionar igual en cualquier
máquina del equipo.

**Rationale**: un entorno reproducible reduce diferencias entre máquinas, agiliza
la incorporación de personas al equipo y acerca desarrollo y despliegue.

## Calidad y pruebas

Toda funcionalidad MUST incluir sus propias pruebas automatizadas antes de
considerarse terminada: sin pruebas, la funcionalidad no está completa. Las pruebas
se escriben junto al desarrollo de la funcionalidad, no después.

## Flujo de trabajo (Git Flow)

El equipo (4 personas) trabaja con Git Flow:

- Ramas: `main` (producción), `develop` (integración), `feature/*`, `release/*`,
  `hotfix/*`.
- Prohibido hacer push directo a `main` y a `develop`: todo cambio entra por Pull
  Request.
- Cada feature parte de `develop` y vuelve a `develop`.
- Todo Pull Request MUST ser revisado y aprobado por al menos otra persona del
  equipo antes de fusionarse.
- Los commits MUST ser Conventional Commits antes de abrir o actualizar un Pull
  Request.

### Implementación de specs: parada por tarea

Al implementar una spec (por ejemplo con `/speckit.implement`), el agente MUST
detenerse al completar **cada** tarea del listado de tareas: no encadena tareas sin
intervención. Tras terminar una tarea, MUST resumir lo hecho y esperar a que el
usuario la revise y realice el commit correspondiente antes de continuar con la
siguiente. Ninguna tarea se da por completada hasta que el usuario la ha revisado.

**Rationale**: permite revisar y commitear cada incremento por separado, mantiene
los commits atómicos y trazables y da al usuario control real sobre el avance.

## Gobernanza

Esta constitución prevalece sobre cualquier otra práctica del proyecto. Quien
revise un Pull Request MUST comprobar el cumplimiento de estos principios.

Enmiendas: se proponen por Pull Request, requieren la aprobación de al menos otra
persona del equipo y quedan registradas en este documento con actualización de
versión y fecha.

Versionado: MAYOR si se elimina o redefine un principio; MENOR si se añade un
principio o se amplía de forma material; PARCHE para aclaraciones o correcciones de
redacción.

**Version**: 1.2.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-13

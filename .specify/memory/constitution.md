<!--
Sync Impact Report
- Version change: (plantilla sin ratificar) → 1.0.0
- Modified principles: n/a (adopción inicial)
- Added sections: Principios fundamentales (I–V), Calidad y pruebas,
  Flujo de trabajo (Git Flow), Gobernanza
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

## Gobernanza

Esta constitución prevalece sobre cualquier otra práctica del proyecto. Quien
revise un Pull Request MUST comprobar el cumplimiento de estos principios.

Enmiendas: se proponen por Pull Request, requieren la aprobación de al menos otra
persona del equipo y quedan registradas en este documento con actualización de
versión y fecha.

Versionado: MAYOR si se elimina o redefine un principio; MENOR si se añade un
principio o se amplía de forma material; PARCHE para aclaraciones o correcciones de
redacción.

**Version**: 1.0.0 | **Ratified**: 2026-10-06 | **Last Amended**: 2026-10-06

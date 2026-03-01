---
name: nexus-agil
description: >
  Metodologia stack-agnostic para procesar Historias de Usuario (HU) a traves de un pipeline
  con agentes especializados, gates estrictos, adversarial review y anti-alucinacion.
  Funciona con cualquier stack: Next.js, Rails, Django, Laravel o cualquier otro.
  Activar cuando el usuario mencione "NexusAgil", "procesa HU", "sprint planning",
  "inicia fase 0", "adversarial review", o "story file".
---

# NexusAgil

> **Unidad de trabajo**: 1 HU por ejecucion.
> **Principio**: El humano decide QUE. Los agentes ejecutan COMO.
> **Anti-alucinacion**: Leer codigo real antes de generar. Nunca inventar.
> **Stack-agnostic**: NexusAgil no asume ningun stack. F0 descubre el proyecto real y genera `project-context.md`.

---

## Principios Fundacionales

1. **Stack-Agnostic** — No asumimos tecnologias. Cada proyecto define su stack en `project-context.md` (ver `references/project_context_template.md`).
2. **1 HU = 1 ejecucion** — No mezclar historias. Una historia, un pipeline completo.
3. **Anti-Alucinacion** — Codebase Grounding obligatorio. Leer codigo real, extraer patrones reales, referenciar archivos existentes. Nunca inventar.
4. **Agentes Especializados** — Cada fase tiene agentes asignados con roles claros. Los roles NO se mezclan (ver Agent Roster).
5. **Gates Estrictos** — No se avanza sin aprobacion humana explicita en los gates.
6. **Adversarial Review** — Despues de implementar, un agente adversario ataca la solucion antes de aprobarla.
7. **Auto-Blindaje** — Cada error refuerza el proceso. Se documenta cuando ocurre, no al final.

## Tabla de Gates

| Gate | Texto exacto | Contexto | Efecto |
|------|-------------|----------|--------|
| `HU_APPROVED` | `HU_APPROVED` | Despues de F1 Work Item | Architect arranca F2 SDD |
| `SPEC_APPROVED` | `SPEC_APPROVED` | Despues de F2 SDD | Architect genera Story File (F2.5) |
| `SPRINT_APPROVED` | `SPRINT_APPROVED` | Despues de Sprint Planning | SM commitea, Architect arranca F0 |
| `REVIEW_APPROVED` | `REVIEW_APPROVED` | Despues de Status Meeting | SM commitea status, pipeline continua |
| `RETRO_APPROVED` | `RETRO_APPROVED` | Despues de Retrospectiva | SM ejecuta Checklist de Cierre, sprint CERRADO |

> **Regla universal:** Solo el texto exacto activa el gate. "si", "ok", "dale", "go", "avanza" → NO activan ningun gate.

---

## Los 3 Modos de NexusAgil

> Al inicio de cada sesion, si no hay contexto claro, Claude pregunta:
>
> **"¿Qué estás construyendo?"**
> ```
> 1. FAST    — Un cambio pequeño (fix, estilo, texto, 1-2 archivos)
> 2. LAUNCH  — Algo nuevo desde cero (MVP, prototipo, nueva app)
> 3. QUALITY — Feature para produccion (DB, auth, pagos, o usuarios reales)
> ```

---

### FAST — Cambio trivial

**Para:** fixes, estilos, textos, cambios de 1-2 archivos sin logica nueva ni DB.

**Califica como FAST si cumple TODO:**
- Maximo 2 archivos
- Menos de 30 lineas de cambio
- Sin cambios de DB ni migraciones
- Sin logica de negocio nueva
- Sin auth ni pagos involucrados

**Si no cumple alguno → sube automaticamente a LAUNCH o QUALITY.**

**Pipeline FAST (Quick Flow — 4 pasos):**
```
1. Triage verifica que califica como FAST
2. Codebase Grounding minimo (leer el archivo a modificar)
3. Dev implementa el cambio
4. Verificacion: typecheck/build pasa
Push
```

**Activar:** `"Quick flow: [descripcion]"` / `"Implementa [cambio trivial]"`

---

### LAUNCH — MVP / Prototipo nuevo

**Para:** construir algo nuevo desde cero — MVP, prototipo funcional, nueva feature compleja.

**Usa cuando:**
- Es un proyecto nuevo o una feature que no existe
- Tiene multiples componentes (UI + backend + DB)
- No va a produccion todavia (o es la primera version)
- Quieres velocidad sin sacrificar estructura

**Pipeline LAUNCH (gates ligeros):**
```
F0: Bootstrap — descubrir stack, generar project-context.md
    |
F1: Lista de HUs del MVP (el humano las define)
    |
GATE: humano escribe LAUNCH_APPROVED
    |
F2: Story File directo por HU
    (sin SDD completo — solo: objetivo, archivos, ACs, waves)
    |
F3: Dev implementa por waves con anti-alucinacion
    |
QA ligero: build limpio + ACs verificados manualmente
    |
Push — iterar
```

**Lo que tiene LAUNCH (vs FAST):**
- Codebase Grounding completo (anti-alucinacion real)
- Story File por HU (Dev nunca improvisa)
- Gate humano (LAUNCH_APPROVED)
- QA basico

**Lo que NO tiene LAUNCH (vs QUALITY):**
- Sin Work Item formal (S0)
- Sin SDD completo con Constraint Directives
- Sin Adversarial Review separado
- Sin Code Review formal
- Sin QA con evidencia archivo:linea

**Activar:** `"NexusAgil, modo LAUNCH: [descripcion del MVP]"` / `"Construye [algo nuevo]"`

---

### QUALITY — Produccion

**Para:** features que van a usuarios reales, con DB, auth, pagos, o en equipo.

**Usa siempre cuando:**
- Va a produccion
- Tiene pagos o auth involucrados
- Es un equipo de 2+ personas
- Un bug tiene costo real (datos, dinero, reputacion)

**Pipeline QUALITY (pipeline completo):**
```
F0: Contexto (Codebase Grounding)
F1: Work Item + ACs EARS
GATE 1: HU_APPROVED
F2: SDD + Constraint Directives + Readiness Check
GATE 2: SPEC_APPROVED
F2.5: Story File autocontenido
F3: Dev implementa (waves + anti-alucinacion)
AR: Adversary Review (BLOQUEANTE/MENOR/OK)
CR: Code Review
F4: QA con evidencia archivo:linea
Push
```

**Activar:** `"NexusAgil, procesa esta HU: [descripcion]"`

---

### Tabla de decision rapida

| Señal | Modo |
|-------|------|
| Fix de 1-2 archivos, sin DB | FAST |
| Cambio de texto o estilo | FAST |
| MVP nuevo, primera version | LAUNCH |
| Prototipo para demo/pitch | LAUNCH |
| Feature que va a usuarios reales | QUALITY |
| Tiene pagos o auth | QUALITY siempre |
| Bug critico en produccion | QUALITY (Hotfix) |
| Equipo de 2+ personas | QUALITY siempre |
| **Duda** | **QUALITY** |

---

## Activacion

Activar este workflow cuando el usuario diga:
- "NexusAgil" / "Nexus Agil" / "nexus agil"
- "Procesa esta HU" / "Procesa HU"
- "Sprint planning" / "Status meeting" / "Retro"
- "Inicia fase 0" / "Inicia F0" / "Inicia discovery"
- "Adversarial review" / "Story file"
- "Quick flow" / "Cambio trivial" → modo FAST
- "Modo LAUNCH" / "Construye" / "MVP" / "Prototipo" → modo LAUNCH
- "Hotfix" / "Bug en produccion" / "Fix urgente" → modo QUALITY (Hotfix)
- Cualquier variacion que mencione "NexusAgil" o "procesa HU"

Si el usuario no especifica modo → Claude pregunta:
"¿Qué estás construyendo?
1. FAST — Un cambio pequeño
2. LAUNCH — Algo nuevo desde cero
3. QUALITY — Feature para produccion"

---

## Agent Roster

> Detalle completo en `references/agents_roster.md`.

| Agente | Rol | Fases |
|--------|-----|-------|
| **Analyst** | Business Analyst — Extrae requisitos, normaliza HU, define ACs EARS | F0, F1 |
| **Architect** | Software Architect — Codebase Grounding, SDD, Story File, Code Review | F0, F1, F2, F2.5, CR |
| **UX** | UX Designer — Microcopy, flujos de usuario, accesibilidad | F1 |
| **Adversary** | Security & Quality Adversary — Adversarial Review, Code Review, seguridad | AR, CR |
| **Dev** | Senior Developer — Implementa SOLO desde Story File, waves, test-first | F3 |
| **SM** | Scrum Master — Sprint ceremonies (Planning, Status, Retro) | Cadencia |
| **QA** | QA Engineer — Validacion de ACs, drift detection, quality gates | F4 |
| **Triage** | Quick Flow Specialist — Triage y pipeline abreviado para cambios triviales | Quick Flow |
| **Docs** | Documentation Specialist — Documenta artefactos, actualiza _INDEX.md | DONE |

### Regla de Separacion de Roles

- Quien **especifica** (Architect) NO implementa (Dev).
- Quien **implementa** (Dev) NO valida (QA).
- Quien **revisa adversarialmente** (Adversary) NO implemento.
- Los roles pueden coexistir en la misma fase pero NUNCA mezclan responsabilidades.

---

## Pipeline Overview

```
HU (cualquier formato)
    |
    v
[ F0: Contexto ] -------------- Analyst+Architect: project-context + codebase grounding + sizing
    |
    v
[ F1: Discovery ] ------------- Analyst+Architect+UX: Work Item + ACs EARS + scope
    |
    v
[ GATE 1: HU_APPROVED ] -------- Humano escribe texto exacto HU_APPROVED
    |
    v
[ F2: Spec/SDD ] -------------- Architect+Adversary: Context Map + SDD + Constraint Directives
    |
    v
[ Readiness Check ] ----------- Architect verifica: SDD listo para implementar?
    |
    v
[ GATE 2: SPEC_APPROVED ] ----- Humano escribe texto exacto SPEC_APPROVED
    |
    v
[ F2.5: Story File ] ---------- Architect genera contrato autocontenido para Dev
    |
    v
[ F3: Implementacion ] -------- Dev SOLO desde Story File, waves, anti-hallucination
    |
    v
[ Adversarial Review ] -------- Adversary ataca la solucion (BLOQUEANTE/MENOR/OK)
    |
    v
[ Code Review ] --------------- Adversary+QA: calidad de codigo
    |
    v
[ F4: QA/Validacion ] --------- QA: drift detection + ACs con evidencia + quality gates
    |
    v
[ Build + Push ] --------------- Docs documenta + actualiza _INDEX.md
    |
    v
DONE -> Persistir en doc/sdd/NNN-titulo/

---
[ /nexus.clarify ] ------------- Consistency check (invocable en cualquier fase)
[ Quick Flow ] ----------------- Triage: pipeline abreviado para cambios triviales
[ Hotfix ] --------------------- Dev: pipeline para bugs en produccion
[ Sprint Cadence ] ------------- SM: Lun/Mie/Vie ceremonies
```

---

## Persistencia de Artefactos

```
doc/sdd/
+-- _INDEX.md                          # Registro historico de HUs procesadas
+-- NNN-titulo-corto/                  # Ej: 001-filtro-categorias/
    +-- work-item.md                   # F1: Work Item normalizado
    +-- sdd.md                         # F2: SDD aprobado
    +-- story-file.md                  # F2.5: Story File para Dev
    +-- plan.md                        # F2: Plan de waves (dentro del SDD o separado)
    +-- validation.md                  # F4: Reporte de validacion
    +-- report.md                      # DONE: Reporte final
```

### Reglas de persistencia
1. **F0**: Leer `doc/sdd/_INDEX.md` para siguiente NNN. Si no existe, crear directorio y archivo.
2. **Cada fase**: Escribir artefacto en `doc/sdd/NNN-titulo/`.
3. **_INDEX.md**: Actualizar al completar pipeline (o abortar).
4. **Inmutabilidad**: Artefactos aprobados no se modifican. Si hay cambios post-gate, crear version (`sdd-v2.md`).

### Formato _INDEX.md

```markdown
# SDD Index

| # | Fecha | HU | Tipo | Mode | Status | Branch |
|---|-------|----|------|------|--------|--------|
| 001 | YYYY-MM-DD | Titulo | feature | full | DONE | feat/001-titulo |
```

---

## Principio Anti-Alucinacion: Codebase Grounding

> *"El AI no imagina codigo. Lee codigo real, extrae patrones reales, y genera codigo que sigue esos patrones."*

Este principio aplica en TODO el pipeline. Antes de generar cualquier cosa, el agente DEBE:

1. **Leer archivos reales** del proyecto relacionados con la HU
2. **Extraer patrones** de esos archivos (estructura, naming, imports, exports)
3. **Documentar lo leido** en un Context Map
4. **Referenciar archivos como exemplars** ("seguir el patron de X archivo")
5. **Verificar que el exemplar existe** antes de usarlo (Glob). Si no existe, buscar el reemplazo mas cercano

### Regla de Exemplar Vivo

Antes de usar cualquier archivo como exemplar, el agente DEBE:
1. Verificar que existe (`Glob` o `Read`)
2. Si **no existe**: buscar en la misma carpeta y elegir el mas similar
3. Si **la carpeta tampoco existe**: buscar por patron en el proyecto (`Grep`)
4. **Nunca referenciar un archivo que no se haya confirmado que existe**

### Archivos de referencia obligatorios

Antes de F2, leer al menos:
- `project-context.md` — generado en F0 (Bootstrap si es proyecto nuevo), contiene stack real, arquitectura, guardrails y exemplars
  Si no existe al llegar aqui: DETENER y ejecutar Bootstrap de Proyecto (F0) primero
- Archivos de la feature mas similar a la HU actual (2-3 minimo)

### Lo que NUNCA se debe hacer
- Inventar nombres de paquetes, imports o modulos que no existan
- Crear patrones nuevos diferentes a los existentes en el proyecto
- Asumir que una API, tabla o componente existe sin verificar
- Generar codigo sin haber leido al menos 2-3 archivos reales del area afectada

---

## F0: Contexto

**Agentes**: Analyst (requisitos) + Architect (arquitectura)
**Objetivo**: Establecer contexto del proyecto y del codebase antes de procesar la HU.

### Proceso

1. **Verificar si existe `project-context.md`**:
   - **Si existe**: leerlo para conocer stack, arquitectura, comandos, guardrails y exemplars
   - **Si NO existe**: ejecutar **Bootstrap de Proyecto** (ver seccion siguiente) antes de continuar
2. **Codebase Grounding inicial**: Explorar la estructura del proyecto con Glob/Grep
3. **Leer `doc/sdd/_INDEX.md`** para siguiente NNN. Si no existe, crearlo.
4. **Smart Sizing** — Clasificar la HU:

| Tipo | Senales | SDD_MODE |
|------|---------|----------|
| **Trivial** | 1-2 archivos, <30 lineas, sin BD, sin logica nueva | **patch** → Quick Flow (Triage) |
| **Hotfix** | Bug en produccion, causa raiz desconocida, puede tocar auth/datos | **hotfix** → Hotfix Pipeline (Dev) |
| **Bugfix** | Bug confirmado con repro steps | **bugfix** |
| **Tech-task / refactor** | Sin cambio funcional visible | **mini** |
| **Feature / improvement** con logica | Multiples archivos, posiblemente BD | **full** |

5. Si SDD_MODE = **patch** → Derivar a Triage (Quick Flow). Ver `references/quick_flow.md`.
6. Si no es patch → Continuar a F1.

### Bootstrap de Proyecto (ejecutar solo cuando NO existe project-context.md)

NexusAgil es stack-agnostic. No asume ningun framework ni lenguaje.
Si no hay project-context.md, el Architect descubre el proyecto leyendo el codebase real.

Checklist de descubrimiento (leer en orden):

1. Archivo de dependencias: package.json / Gemfile / requirements.txt / go.mod / pom.xml
   Extraer: lenguaje principal, framework, dependencias clave

2. Estructura de carpetas (Glob recursivo desde raiz, profundidad 3)
   Identificar: arquitectura (MVC, feature-first, monorepo, microservicios, etc.)

3. 3-5 archivos representativos del area de negocio principal
   Extraer: naming conventions, patron de imports, estructura de funciones, manejo de errores

4. Comandos del proyecto: build, test, lint, dev server
   Fuente: scripts en package.json, Makefile, README, o equivalente del stack

5. Base de datos y ORM si existe
   Fuente: schema files, migraciones, cliente (Supabase, Prisma, ActiveRecord, SQLAlchemy...)

6. Sistema de auth si existe
   Fuente: middleware, guards, JWT config, sessions config

7. Guardrails del proyecto si existen
   Fuente: .eslintrc, .rubocop.yml, linters, convenciones en README

Despues del checklist: generar project-context.md usando references/project_context_template.md
como base, llenado exclusivamente con lo descubierto. Escribir al disco antes de continuar.

Confirmar al humano: "Contexto generado. Stack: X. Arquitectura: Y. Comandos: Z. Listo para HUs."
Si hay ambiguedades criticas: preguntar al humano (max 3 preguntas) antes de continuar.

---

## F1: Discovery

**Agentes**: Analyst (requisitos) + Architect (arquitectura) + UX (si aplica)
**Objetivo**: Transformar cualquier input en un Work Item estructurado con ACs EARS.

### Proceso

1. **Leer la HU** tal como viene (texto libre, bullets, imagenes, mezcla)
2. **Asignar numero secuencial** desde `doc/sdd/_INDEX.md`
3. **Si hay imagenes**: producir "Image Notes" (3-6 bullets)
4. **Analyst extrae y normaliza** el Work Item:

```markdown
## Work Item #NNN

| Campo | Valor |
|-------|-------|
| **#** | NNN |
| **Tipo** | feature / bugfix / tech-task / refactor / improvement |
| **SDD_MODE** | full / bugfix / mini |
| **Objetivo** | 1-2 oraciones |
| **Actual vs Esperado** | Solo para bugs |
| **Reglas de negocio** | Restricciones |
| **Acceptance Criteria** | Formato EARS (ver abajo) |
| **Scope IN** | Que SI incluye |
| **Scope OUT** | Que NO incluye |
| **Missing Inputs** | Recursos pendientes |
```

### Acceptance Criteria — Formato EARS

| Patron | Formato | Ejemplo |
|--------|---------|---------|
| **Event-Driven** | WHEN [trigger], THE [sistema] SHALL [accion] | WHEN usuario aplica filtro, THE lista SHALL mostrar solo items que coincidan |
| **State-Driven** | WHILE [condicion], THE [sistema] SHALL [comportamiento] | WHILE no hay resultados, THE pagina SHALL mostrar estado vacio |
| **Unwanted** | IF [condicion no deseada], THEN THE [sistema] SHALL [respuesta] | IF usuario no autenticado accede a /admin, THEN THE app SHALL redirigir a /login |

Cada AC debe ser verificable con una accion concreta. Si no se puede verificar, no es un AC valido.

### UX — Solo si Work Kind involucra UI
- Microcopy obligatorio para elementos interactivos
- Flujos de usuario para happy path y error
- Accesibilidad basica (aria-labels, contraste, keyboard nav)

### Definition of Ready (DoR)

NO avanzar a GATE 1 sin:
- Objetivo definido (1-2 oraciones)
- Minimo 2 ACs en formato EARS
- Scope IN y OUT (derivarlos si el usuario no los da)

**Max 3 preguntas.** Si no se cumple DoR despues de preguntar: informar y NO avanzar.

### Branch Semantico
```
feat/NNN-titulo-kebab
fix/NNN-titulo-kebab
refactor/NNN-titulo-kebab
```
Preguntar: "Creo branch `{branch}`? (si/no/otro nombre)"

### GATE 1: HU_APPROVED
Presentar Work Item al humano. Esperar el texto exacto **HU_APPROVED**.
- Solo el texto exacto `HU_APPROVED` activa el gate.
- "ok", "dale", "si", "go", "avanza", "suena bien", "HU_APPROVED: yes" → NO activan el gate. Responder: "Para avanzar, escribe exactamente: HU_APPROVED"
- NO avanzar sin el texto exacto.

### Persistencia F1
Escribir en `doc/sdd/NNN-titulo/work-item.md`.

---

## F2: Spec / SDD

**Agentes**: Architect + Adversary (revision de seguridad)
**Objetivo**: Generar SDD con codebase grounding. NO se escribe codigo.

### Fase 1: Codebase Grounding (OBLIGATORIO)

1. **Leer archivos de referencia** del proyecto (`project-context.md`, guardrails)
2. **Buscar archivos relacionados** con la HU (Glob/Grep, 2-3 minimo)
3. **Identificar exemplars** — archivos mas similares a lo que se va a crear/modificar
4. **Documentar en Context Map**:

```markdown
## Context Map (Codebase Grounding)

### Archivos leidos
| Archivo | Por que | Patron extraido |
|---------|---------|-----------------|
| `[path]` | [razon] | [patron: imports, estructura, naming] |

### Exemplars
| Para crear/modificar | Seguir patron de | Razon |
|---------------------|------------------|-------|
| [nuevo archivo] | `[exemplar]` | [que patron copiar] |

### Estado de BD relevante (si aplica)
| Tabla | Existe | Columnas relevantes |
|-------|--------|---------------------|
| [tabla] | Si/No | [columnas] |

### Componentes reutilizables encontrados
- [Componente] en [ubicacion] — reutilizar en vez de crear nuevo
```

### Fase 2: Generar SDD

Seleccionar template segun SDD_MODE. Consultar `references/sdd_template.md`.

| SDD_MODE | Template | Cuando |
|----------|----------|--------|
| **full** | FULL | feature/improvement con logica |
| **bugfix** | BUGFIX | bugs con repro steps |
| **mini** | MINI | tech-task, refactor |

### Fase 3: Constraint Directives

```markdown
## Constraint Directives (Anti-Alucinacion)

### OBLIGATORIO seguir
- Patron de [tipo]: seguir `[exemplar]`
- Imports: solo modulos que EXISTEN en el proyecto

### PROHIBIDO
- NO agregar dependencias nuevas salvo que el SDD lo especifique
- NO crear patrones diferentes a los existentes
- NO modificar archivos fuera de Scope IN
- [constraints especificos de esta HU]
```

### Uncertainty Markers

| Marker | Significado | Gate |
|--------|-------------|------|
| `[NEEDS CLARIFICATION]` | Decision humana requerida | **Bloqueante** |
| `[TBD]` | Resoluble explorando codebase | **No bloqueante** |

### Implementation Readiness Check

Antes de presentar el SDD al humano, Architect verifica:

```
READINESS CHECK:
[ ] Cada AC tiene al menos 1 archivo asociado en la tabla de archivos
[ ] Cada archivo tiene un Exemplar valido (verificado con Glob)
[ ] No hay [NEEDS CLARIFICATION] pendientes
[ ] Constraint Directives incluyen al menos 3 PROHIBIDO
[ ] Context Map tiene al menos 2 archivos leidos
[ ] Scope IN y OUT son explicitos
[ ] Si hay BD: tablas verificadas
```

Si falla cualquier check: corregir antes de presentar.

### GATE 2: SPEC_APPROVED
Presentar SDD al humano. Esperar el texto exacto **SPEC_APPROVED**.
- Solo el texto exacto `SPEC_APPROVED` activa el gate.
- "ok", "dale", "si", "go", "avanza", "suena bien", "SPEC_APPROVED: yes" → NO activan el gate. Responder: "Para avanzar, escribe exactamente: SPEC_APPROVED"
- Con `[NEEDS CLARIFICATION]`: informar que debe resolverlos primero.
- NO avanzar sin el texto exacto.

### Persistencia F2
Escribir en `doc/sdd/NNN-titulo/sdd.md`.

---

## F2.5: Story File

**Agente**: Architect
**Objetivo**: Generar un contrato autocontenido para que Dev pueda implementar SIN consultar otros artefactos.

> Template completo en `references/story_file_template.md`.

El Story File es el **unico documento que Dev lee**. Contiene todo lo necesario:

1. **Goal** — Que se construye y por que (1-2 oraciones)
2. **Acceptance Criteria** — EARS format, copiados del SDD
3. **Files to Modify/Create** — Tabla con paths, acciones, exemplars
4. **Exemplars** — Codigo real extraido de los archivos de referencia
5. **Constraint Directives** — OBLIGATORIO/PROHIBIDO copiados del SDD
6. **Test Expectations** — Que tests crear, que ACs cubren
7. **Waves** — Orden de ejecucion (W0 serial, W1+ paralelo)
8. **Out of Scope** — Que NO tocar
9. **Escalation Rule** — Si algo no esta en el Story File, Dev PARA y pregunta a Architect

### Regla Critica
Dev **NUNCA** lee el SDD ni el Work Item. Solo el Story File. Si el Story File es ambiguo, Dev escala a Architect — no inventa.

### Persistencia F2.5
Escribir en `doc/sdd/NNN-titulo/story-file.md`.

---

## F3: Implementacion

**Agente**: Dev
**Objetivo**: Implementar SOLO lo que dice el Story File, con waves y anti-hallucination.

### Reglas de Implementacion

1. **Solo lo que esta en el Story File** — nada mas, nada menos
2. **Respetar scope** — Scope OUT es inviolable
3. **Respetar el stack** — Segun `project-context.md` del proyecto
4. **Cambios minimos** — No refactorizar codigo adyacente
5. **Trazabilidad** — Cada cambio corresponde a un item del Story File
6. **Escalation** — Si algo no esta claro, PARAR y preguntar a Architect

### Anti-Hallucination Protocol (ANTES de cada tarea)

```
CHECKLIST PRE-IMPLEMENTACION (por tarea):
[ ] Lei el archivo exemplar referenciado en el Story File
[ ] Verifique que los imports que voy a usar EXISTEN (Grep/Glob)
[ ] Sigo el patron del exemplar (estructura, naming, exports)
[ ] No estoy agregando dependencias no aprobadas
[ ] El archivo resultante respeta los limites del proyecto
```

Este checklist es una instruccion interna. NO se presenta al usuario.

### Re-mapeo Ligero entre Waves

**ANTES de iniciar cada Wave (excepto W0)**, Dev DEBE:
1. Leer los archivos que el Wave anterior **creo o modifico**
2. Verificar que los imports/exports que el Wave actual necesita **existen realmente**
3. Si algo difiere: ajustar sin salirse del Story File

### Proceso por Wave

**Wave 0 (Serial):**
1. Ejecutar tareas secuencialmente
2. Verificar typecheck/build al completar

**Wave 1+ (Parallelizable):**
1. **Re-mapeo ligero**: leer archivos creados/modificados en Wave anterior
2. Lanzar tareas en paralelo si el juicio lo indica
3. Cada tarea recibe: objetivo + exemplar + constraint directives

**Para cada tarea:**
```
1. LEER el exemplar referenciado
2. Si hay test-first:
   a. Crear test stub
   b. Implementar codigo para que el test pase
   c. Verificar: typecheck + test
3. Si NO hay test (copy, estilos):
   a. Implementar directamente
   b. Verificar typecheck
4. Marcar tarea como completada
```

### Verificacion Incremental

Al completar CADA wave (no solo al final):

| Wave completada | Verificacion |
|-----------------|-------------|
| W0 | typecheck pasa |
| W1 | typecheck + tests pasan |
| W2 | typecheck + tests + visual (si UI) |
| W3 (ultima) | full QA (typecheck + lint + build) |

Si falla: corregir ANTES de avanzar. Auto-Blindaje si el error es nuevo.

### Auto-Blindaje en el Momento

Si hay errores durante implementacion:
1. **Arreglar** el codigo
2. **Verificar** que funcione
3. **Documentar INMEDIATAMENTE**:
   ```
   ## Auto-Blindaje (acumulativo)
   | Wave | Error | Fix | Aplicar en |
   |------|-------|-----|-----------|
   | W0.2 | [que fallo] | [como se arreglo] | [donde mas aplica] |
   ```
4. **Continuar** con la siguiente tarea

---

## Adversarial Review (AR)

**Agente**: Adversary
**Objetivo**: Atacar la solucion implementada buscando fallas ANTES de validar.

> Checklist completo en `references/adversarial_review_checklist.md`.

### Proceso

1. Adversary revisa TODO el codigo generado en F3
2. Ejecuta checklist de 8 categorias de ataque
3. Clasifica hallazgos:

| Severidad | Significado | Accion |
|-----------|-------------|--------|
| **BLOQUEANTE** | Falla critica de seguridad, datos o logica | Dev DEBE corregir antes de continuar |
| **MENOR** | Mejora recomendada, no critica | Documentar, corregir si es rapido |
| **OK** | Sin hallazgos en esta categoria | Continuar |

### Regla
- El AR es **BLOQUEANTE**: si hay hallazgos BLOQUEANTE, Dev corrige y Adversary re-revisa.
- Solo cuando todo es OK o MENOR se avanza a Code Review.

---

## Code Review (CR)

**Agentes**: Adversary (seguridad) + QA (calidad)
**Objetivo**: Revisar calidad de codigo, separado del Adversarial Review.

### Checks

1. **Patrones** — Se siguieron los exemplars del Story File?
2. **Naming** — Consistente con convenciones del proyecto?
3. **Complejidad** — Funciones cortas, responsabilidad unica?
4. **Duplicacion** — Hay codigo duplicado que deberia reutilizarse?
5. **Imports** — Solo dependencias aprobadas?
6. **Limites** — Archivos dentro del limite de lineas del proyecto?

### Resultado
- **APPROVED** — Codigo listo para validacion
- **CHANGES_REQUESTED** — Dev corrige, Adversary+QA re-revisan

---

## F4: QA / Validacion

**Agente**: QA
**Objetivo**: Verificar ACs con evidencia, detectar drift, ejecutar quality gates.

> Template completo en `references/validation_report_template.md`.

### Fase 1: Drift Detection

Comparar lo implementado vs lo planificado:

```markdown
## Drift Check
| Dimension | Esperado | Real | Status |
|-----------|----------|------|--------|
| Archivos creados | N | N | OK/DRIFT |
| Archivos modificados | N | N | OK/DRIFT |
| Dependencias nuevas | [lista] | [lista] | OK/DRIFT |
| Archivos fuera de scope | 0 | N | OK/DRIFT |
```

Si hay DRIFT grave: alertar al humano.

### Fase 2: Verificacion de ACs

```markdown
| AC | Resultado | Evidencia | Test | Metodo |
|----|-----------|-----------|------|--------|
| AC1: WHEN... SHALL... | PASS/FAIL | [archivo:linea] | [test o N/A] | auto/manual |
```

Cada AC con evidencia concreta citando `archivo:linea` — no "se ve bien".

**Formato obligatorio de evidencia:**
- `CUMPLE` — `src/components/X.tsx:42` (implementado y verificado)
- `NO CUMPLE` — no encontrado en codebase
- `PARCIAL` — `src/components/X.tsx:42` (implementado pero sin test)

QA no puede marcar CUMPLE sin citar `archivo:linea` como evidencia.

### Fase 3: Quality Gates

Ejecutar los comandos definidos en `project-context.md` del proyecto:
- typecheck
- tests
- build (si cambios significativos)
- lint

### Fase 4: Si hay FAIL
- Volver a F3 para corregir
- Re-ejecutar validacion
- Auto-Blindaje si el error es nuevo

### Persistencia F4
Escribir en `doc/sdd/NNN-titulo/validation.md`.

---

## Build + Push + DONE

**Agente**: Docs
**Objetivo**: Cerrar el pipeline y documentar.

### Proceso

1. Compilar reporte final con:
   - Resumen de archivos creados/modificados
   - AC status (todos PASS)
   - Drift summary
   - AR/CR summary
   - Auto-Blindaje acumulado
2. Escribir en `doc/sdd/NNN-titulo/report.md`
3. Actualizar `doc/sdd/_INDEX.md` con status DONE
4. Cerrar en el issue tracker del proyecto (Linear, GitHub Issues, Jira, o el configurado en `project-context.md`) — mover el issue a Done/Closed
5. Presentar resumen al humano

### Abort
Si el humano aborta en cualquier punto: Docs actualiza _INDEX.md con status ABORTED y cierra el issue en el tracker como CANCELLED.

---

## Sprint Cadence

**Agente**: SM (Scrum Master)

> Detalle completo en `references/sprint_cadence.md`.

| Dia | Ceremonia | Que hace SM |
|-----|-----------|-------------|
| **Lunes** | Sprint Planning | Priorizar backlog, seleccionar HUs, estimar capacidad |
| **Miercoles** | Status | Revisar progreso, identificar bloqueos, ajustar plan |
| **Viernes** | Retrospectiva | Que funciono, que no, acciones de mejora, Auto-Blindaje |

Activar con: "sprint planning", "status meeting", "retro", "ceremonia de [dia]".

---

## Quick Flow

**Agente**: Triage

> Detalle completo en `references/quick_flow.md`.

Para cambios triviales que no merecen el pipeline completo:
- 1-2 archivos
- <30 lineas
- Sin BD
- Sin logica nueva

Triage califica, ejecuta pipeline abreviado (4 pasos), y puede escalar a pipeline completo si el cambio crece.

Activar con: "quick flow", "cambio trivial", "patch rapido".

### Hotfix Pipeline

Para bugs en produccion donde la causa raiz es desconocida y puede tocar auth/datos/pagos. A diferencia de Quick Flow, Hotfix requiere investigacion profunda de causa raiz y AR condicional.

Pipeline: Investigacion → Fix minimo → AR (si toca auth/datos/pagos) → QA → Push.

Activar con: "hotfix", "bug en produccion", "fix urgente".

---

## /nexus.clarify — Consistency Check

**Objetivo**: Validar consistencia entre artefactos. Invocable en cualquier momento.

### Activacion
- "clarify", "check consistencia", "valida artefactos"
- El agente detecta inconsistencia
- Antes de un gate (recomendado)

### Checks

| Check | Status | Detalle |
|-------|--------|---------|
| **AC Coverage** | PASS/FAIL | Cada AC tiene al menos 1 tarea |
| **Scope Drift** | PASS/FAIL | Ninguna tarea toca archivos fuera de Scope IN |
| **Traceability** | PASS/FAIL | Cada archivo del plan aparece en SDD |
| **Contradictions** | PASS/FAIL | No hay conflictos entre AC y reglas de negocio |
| **Markers** | PASS/FAIL | No hay [NEEDS CLARIFICATION] pendientes |
| **Missing Inputs** | PASS/FAIL | Missing Inputs bloqueantes resueltos |
| **Exemplars Valid** | PASS/FAIL | Archivos referenciados como exemplar existen |

El clarify es informativo, no bloqueante. El humano decide.

---

## Reglas Globales

1. **1 HU = 1 ejecucion**. No mezclar HUs.
2. **Gates bloqueantes**. No avanzar sin el texto exacto del gate (`HU_APPROVED`, `SPEC_APPROVED`). Variaciones informales no cuentan.
3. **Abort**: Si el humano aborta, Docs actualiza _INDEX.md con ABORTED.
4. **Auto-Blindaje**: Documentar errores cuando ocurren, no al final.
5. **Stack del proyecto**: Respetar `project-context.md`, sin excepciones.
6. **Cambios minimos**: No tocar lo que no esta en scope.
7. **Max 3 preguntas** en F1 para completar DoR.
8. **Conservador**: Si hay duda, NO expandir alcance.
9. **Persistencia**: Cada fase escribe su artefacto en `doc/sdd/NNN-titulo/`.
10. **Test-first**: Para logica de negocio en F3.
11. **Uncertainty markers**: `[NEEDS CLARIFICATION]` bloquea; `[TBD]` se resuelve en F2.
12. **Waves**: Paralelizacion con W0/W1/W2+ en F3.
13. **Branch semantico**: Sugerir en F1.
14. **Codebase Grounding**: Leer codigo real antes de generar. SIEMPRE.
15. **Exemplar Pattern**: Referenciar archivos existentes como patron.
16. **Constraint Directives**: Incluir prohibiciones explicitas en SDD.
17. **Verificacion incremental**: Verificar al completar cada wave.
18. **EARS ACs**: Acceptance Criteria en formato WHEN/WHILE/IF.
19. **Drift Detection**: En F4, comparar implementacion vs plan.
20. **Smart Sizing**: Usar Quick Flow para cambios triviales, no inflar con ceremonia.
21. **Re-mapeo ligero**: Antes de Wave N, re-leer archivos tocados en Wave N-1.
22. **Auto-Blindaje inmediato**: Documentar errores cuando ocurren.
23. **Separacion de roles**: Quien especifica no implementa, quien implementa no valida.
24. **Story File como contrato**: Dev SOLO lee el Story File, nada mas.
25. **Adversarial Review bloqueante**: Hallazgos BLOQUEANTE se corrigen antes de avanzar.
26. **Modelo capaz para fases criticas**: Usar el modelo mas capaz disponible para analisis, implementacion y AR. Tareas mecanicas pueden usar modelos mas rapidos.

---

## Modelo Recomendado por Fase

> Recomendacion informativa. Claude Code no fuerza el modelo por fase — lo decide quien invoca la sesion o el agente al lanzar subagentes con el parametro `model`.

| Fase | Modelo recomendado | Razon |
|------|--------------------|-------|
| F0-F2 (analisis, SDD) | Opus | Razonamiento profundo, codebase grounding |
| F2.5 (Story File) | Opus | Contrato critico, no puede tener ambiguedad |
| F3 (implementacion) | Opus | Generacion de codigo con anti-alucinacion |
| AR (Adversarial Review) | Opus | Seguridad requiere el modelo mas capaz |
| CR (Code Review) | Opus/Sonnet | Revision de patrones, menos critico que AR |
| F4 (QA/Validacion) | Opus/Sonnet | Verificacion puede ser parcialmente mecanica |
| Quick Flow | Sonnet | Cambios triviales, no requiere profundidad |
| Hotfix | Opus | Investigacion de causa raiz requiere profundidad |
| Sprint Cadence | Sonnet | Ceremonias son estructuradas y repetitivas |

---

## Auto-Blindaje

> *"Los errores refuerzan el proceso. Blindamos para que la falla nunca se repita."*

### Formato

```markdown
### [YYYY-MM-DD]: [Titulo corto]
- **Error**: [Que fallo]
- **Fix**: [Como se arreglo]
- **Aplicar en**: [Donde mas aplica]
```

### Donde documentar

| Alcance | Donde |
|---------|-------|
| Solo esta HU | `doc/sdd/NNN-titulo/report.md` seccion Auto-Blindaje |
| Multiples features | Archivo de reglas del proyecto |
| Todo el proyecto | `project-context.md` o equivalente |

### Cuando
- **INMEDIATAMENTE** cuando el error ocurre, no al final del pipeline.
- El reporte final (DONE) copia la tabla acumulada — no se reconstruye de memoria.

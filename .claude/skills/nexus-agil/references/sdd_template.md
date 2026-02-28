# SDD Template Pack — NexusAgil

> Templates para generar SDDs. Fuente de verdad para F2.
> Seleccionar segun SDD_MODE. Incluir Context Map y Constraint Directives en todos.
> Estos templates son stack-agnostic. Adaptar secciones al stack definido en `project-context.md`.

---

## Seleccion de Template

| SDD_MODE | Template | Cuando |
|----------|----------|--------|
| **full** | FULL | feature/improvement con logica |
| **bugfix** | BUGFIX | bugs con repro steps |
| **mini** | MINI | tech-task, refactor |
| **patch** | Sin SDD | Trivial: 1-2 archivos, <30 lineas → Quick Flow |

---

## Template FULL

```markdown
# SDD #NNN: [Titulo]

> SPEC_APPROVED: no
> Fecha: YYYY-MM-DD
> Tipo: feature | improvement
> SDD_MODE: full
> Branch: [tipo/NNN-titulo-kebab]
> Artefactos: doc/sdd/NNN-titulo/

---

## 1. Resumen

[1-2 parrafos: que se construye, por que, resultado esperado]

## 2. Work Item

| Campo | Valor |
|-------|-------|
| **#** | NNN |
| **Tipo** | [feature/improvement] |
| **SDD_MODE** | full |
| **Objetivo** | [1-2 oraciones] |
| **Reglas de negocio** | [Restricciones] |
| **Scope IN** | [Que SI incluye] |
| **Scope OUT** | [Que NO incluye] |
| **Missing Inputs** | [Pendientes o N/A] |

### Acceptance Criteria (EARS)

1. WHEN [trigger], THE [sistema] SHALL [accion]
2. WHILE [condicion], THE [sistema] SHALL [comportamiento]
3. IF [condicion no deseada], THEN THE [sistema] SHALL [respuesta]

## 3. Context Map (Codebase Grounding)

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

## 4. Diseno Tecnico

### 4.1 Archivos a crear/modificar

| Archivo | Accion | Descripcion | Exemplar |
|---------|--------|-------------|----------|
| `[path]` | Crear/Modificar | [que hace] | `[exemplar]` |

### 4.2 Modelo de datos (si aplica)

> N/A si no hay cambios de BD. [TBD] si requiere exploracion.
> [NEEDS CLARIFICATION] si hay decisiones de negocio pendientes.

[Schema o cambios a tablas]

### 4.3 Componentes / Servicios

> N/A si puramente funcional. [TBD] si requiere exploracion.

[Arquitectura de la solucion]

### 4.4 Flujo principal (Happy Path)

1. Usuario hace [accion]
2. Sistema [responde]
3. Resultado: [estado final]

### 4.5 Flujo de error

1. Si [condicion de error]
2. Sistema muestra [mensaje/UI]

## -- SECCIONES OPCIONALES --

### 4.6 Microcopy (si hay UI)

| Elemento | Texto exacto | Contexto |
|----------|-------------|----------|
| [Boton/Label] | "[texto]" | [donde aparece] |

### 4.7 Navegacion / Rutas (si aplica)

| Ruta | Label | Estado activo | Icono |
|------|-------|--------------|-------|
| `/[ruta]` | [texto] | [condicion] | [icono] |

### 4.8 Assets / Branding (si aplica)

| Asset | Fuente | Variantes | Donde se usa | Fallback |
|-------|--------|-----------|-------------|----------|
| [asset] | [URL/archivo] | [variantes] | [componentes] | [fallback] |

### 4.9 Copy-only change (si aplica)

| Ubicacion | Texto actual | Texto nuevo | Hardcodeado? |
|-----------|-------------|-------------|-------------|
| `[archivo:linea]` | "[viejo]" | "[nuevo]" | Si/No |

### 4.10 Analitica (si aplica)

| Evento | Trigger | Payload | Destino |
|--------|---------|---------|---------|
| [nombre] | [cuando] | [datos] | [tool] |

## -- FIN SECCIONES OPCIONALES --

## 5. Constraint Directives (Anti-Alucinacion)

### OBLIGATORIO seguir
- Patron de [tipo]: seguir `[exemplar]`
- Validacion: segun stack del proyecto
- Imports: solo modulos que EXISTEN

### PROHIBIDO
- NO agregar dependencias nuevas salvo que este SDD lo especifique
- NO crear patrones diferentes a los existentes
- NO modificar archivos fuera de Scope IN
- NO hardcodear valores configurables
- [constraints especificos de esta HU]

## 6. Scope

**IN:**
- [Lo que SI se implementa]

**OUT:**
- [Lo que NO se implementa]

## 7. Riesgos

| Riesgo | Probabilidad | Impacto | Mitigacion |
|--------|-------------|---------|------------|
| [riesgo] | B/M/A | B/M/A | [mitigacion] |

## 8. Dependencias

- [Que debe existir antes de implementar]

## 9. Missing Inputs (si aplica)

- [ ] [Asset/recurso]: [estado]

## 10. Uncertainty Markers

| Marker | Seccion | Descripcion | Bloqueante? |
|--------|---------|-------------|-------------|
| [NEEDS CLARIFICATION] | 4.2 | [desc] | Si |
| [TBD] | 4.3 | [desc] | No |

> Gate: Resolver [NEEDS CLARIFICATION] antes de aprobar.

---

*SDD generado por NexusAgil — FULL*
```

---

## Template BUGFIX

```markdown
# SDD #NNN: [BUG] [Titulo]

> SPEC_APPROVED: no
> Fecha: YYYY-MM-DD
> Tipo: bugfix
> SDD_MODE: bugfix
> Branch: [fix/NNN-titulo-kebab]

---

## 1. Resumen del bug

[1-2 parrafos: que falla, impacto]

## 2. Work Item

| Campo | Valor |
|-------|-------|
| **#** | NNN |
| **Tipo** | bugfix |
| **Objetivo** | Corregir X para que Y |
| **Scope IN** | [solo el fix] |
| **Scope OUT** | [todo lo demas] |

## 3. Reproduccion

### Repro steps
1. [Paso 1]
2. [Paso 2]

### Actual
[Que pasa]

### Expected
[Que deberia pasar]

## 4. Context Map

### Archivos leidos
| Archivo | Por que | Hallazgo |
|---------|---------|----------|
| `[path]` | [donde esta el bug] | [que se encontro] |

### Exemplar para el fix
| Fix en | Seguir patron de | Razon |
|--------|------------------|-------|
| `[buggy-file]` | `[similar-fix]` | [patron de fix similar] |

## 5. Analisis de causa raiz

### Donde esta el bug
| Archivo | Linea/zona | Que esta mal |
|---------|-----------|-------------|
| `[path]` | [zona] | [problema] |

### Causa raiz
[Por que ocurre]

### Fix propuesto
[Como corregir — sin codigo]

## 6. Acceptance Criteria (EARS)

1. WHEN [repro steps ejecutados], THE [sistema] SHALL [comportamiento corregido]
2. [Criterio adicional verificable]

## 7. Constraint Directives

### PROHIBIDO
- NO refactorizar codigo adyacente
- NO "mejorar" nada fuera del fix
- NO cambiar tests existentes salvo que el bug los afecte

## 8. Riesgos

| Riesgo | Mitigacion |
|--------|------------|
| Regresion en X | [como verificar] |

---

*SDD generado por NexusAgil — BUGFIX*
```

---

## Template MINI

```markdown
# SDD #NNN: [Titulo]

> SPEC_APPROVED: no
> Fecha: YYYY-MM-DD
> Tipo: [tech-task | refactor | feature | improvement]
> SDD_MODE: mini
> Branch: [tipo/NNN-titulo-kebab]

---

## 1. Resumen

[1-2 oraciones]

## 2. Work Item

| Campo | Valor |
|-------|-------|
| **#** | NNN |
| **Tipo** | [tipo] |
| **Objetivo** | [1-2 oraciones] |
| **Scope IN** | [incluido] |
| **Scope OUT** | [excluido] |

## 3. Context Map

### Exemplars
| Para modificar | Seguir patron de |
|---------------|------------------|
| `[path]` | `[exemplar]` |

## 4. Archivos afectados

| Archivo | Accion | Que cambia | Exemplar |
|---------|--------|-----------|----------|
| `[path]` | Modificar | [cambio] | `[ref]` |

## 5. Assets / Copy change (si aplica)

| Ubicacion | Actual | Nuevo | Tipo |
|-----------|--------|-------|------|
| `[archivo:linea]` | "[viejo]" | "[nuevo]" | texto/asset |

## 6. Acceptance Criteria (EARS)

1. WHEN [trigger], THE [sistema] SHALL [accion]
2. [AC adicional]

## 7. Constraint Directives

### PROHIBIDO
- NO expandir scope mas alla de lo listado
- NO crear archivos nuevos salvo que sea estrictamente necesario

---

*SDD generado por NexusAgil — MINI*
```

---

## Implementation Readiness Check

> Architect ejecuta este check ANTES de presentar el SDD al humano en GATE 2.

```
READINESS CHECK:
[ ] Cada AC tiene al menos 1 archivo asociado en tabla 4.1
[ ] Cada archivo en tabla 4.1 tiene un Exemplar valido (verificado con Glob)
[ ] No hay [NEEDS CLARIFICATION] pendientes
[ ] Constraint Directives incluyen al menos 3 PROHIBIDO
[ ] Context Map tiene al menos 2 archivos leidos
[ ] Scope IN y OUT son explicitos y no ambiguos
[ ] Si hay BD: tablas verificadas que existen
[ ] Flujo principal (Happy Path) esta completo
[ ] Flujo de error esta definido (al menos 1 caso)
```

Si falla cualquier check: corregir ANTES de presentar al humano.

---

## Template: Plan de Implementacion (Waves)

```markdown
# Plan — SDD #NNN: [titulo]

> PLAN_APPROVED: no
> SDD: doc/sdd/NNN-titulo/sdd.md
> Fecha: YYYY-MM-DD

---

## TBD Resueltos

| TBD | Seccion SDD | Resolucion |
|-----|-------------|------------|
| [desc] | [seccion] | [descubrimiento y decision] |

> Sin TBDs: "Todos resueltos en F2."

## Waves de Implementacion

### Wave 0 (Serial Gate)
- [ ] W0.1: [prerequisito obligatorio]

### Wave 1 (Parallelizable)
- [ ] W1.1: [tarea independiente] -> Exemplar: `[ref]`
- [ ] W1.2: [tarea independiente] -> Exemplar: `[ref]`

### Wave 2 (Depende de W0 + W1)
- [ ] W2.1: [integracion] -> Depende de W1.1, W1.2

### Wave 3 (Final)
- [ ] W3.1: [verificacion / cleanup]

## Dependencias

| Tarea | Depende de | Razon |
|-------|-----------|-------|
| W2.1 | W1.1, W1.2 | [por que] |

## Archivos involucrados

| Archivo | Existe | Accion | Wave | Exemplar |
|---------|--------|--------|------|----------|
| `[path]` | Si/No | Crear/Modificar | W1.1 | `[ref]` |

## Test Plan

| Test | AC que cubre | Wave | Framework |
|------|-------------|------|-----------|
| `[path]` | AC1, AC2 | W1.1 | [framework del proyecto] |

> Sin logica de negocio: "Sin tests requeridos."

## Verificacion Incremental

| Wave | Verificacion al completar |
|------|--------------------------|
| W0 | typecheck |
| W1 | typecheck + tests |
| W2 | typecheck + tests + visual (si UI) |
| W3 | full QA |

## Riesgos

| Riesgo | Probabilidad | Mitigacion |
|--------|-------------|------------|
| [riesgo] | B/M/A | [mitigacion] |

## Estimacion

- Archivos nuevos: N
- Archivos modificados: N
- Tests nuevos: N
- Lineas estimadas: ~N

---

*Plan generado por NexusAgil — F2*
```

---

## Reglas para generar SDDs

1. **Template por SDD_MODE**: Usar el que corresponda
2. **Completitud**: Campos con valor, N/A, [TBD], o [NEEDS CLARIFICATION]
3. **Verificabilidad**: Cada AC en formato EARS, verificable con accion concreta
4. **Scope claro**: IN y OUT explicitos
5. **Sin codigo**: SDD describe QUE y DONDE, no codigo exacto
6. **Respetar arquitectura**: Segun `project-context.md` del proyecto
7. **Stack del proyecto**: Solo tecnologias definidas en project-context
8. **Context Map obligatorio**: Documentar archivos leidos, exemplars, BD, componentes reutilizables
9. **Constraint Directives obligatorias**: Incluir OBLIGATORIO seguir y PROHIBIDO
10. **Secciones opcionales**: Solo las que apliquen
11. **Missing Inputs bloqueantes**: Assets faltantes = bloquear implementacion
12. **BUGFIX obligatorios**: Repro steps + Actual vs Expected + Context Map del bug
13. **MINI conciso**: Sin UX salvo que el usuario lo pida
14. **Uncertainty markers**: [NEEDS CLARIFICATION] bloquea gate; [TBD] se resuelve despues
15. **Exemplar en cada archivo**: Tabla de archivos incluye columna Exemplar
16. **EARS**: ACs en formato WHEN/WHILE/IF, no prosa libre

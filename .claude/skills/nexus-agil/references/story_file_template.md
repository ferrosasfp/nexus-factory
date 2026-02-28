# Story File Template — NexusAgil

> El Story File es el **contrato entre Architect y Dev**.
> Dev lee SOLO este documento para implementar. Nada mas.
> Si algo no esta aqui, Dev PARA y escala a Architect.

---

## Cuando se genera

- **Fase**: F2.5 (despues de GATE 2: SPEC_APPROVED)
- **Quien lo genera**: Architect
- **Quien lo consume**: Dev
- **Donde se persiste**: `doc/sdd/NNN-titulo/story-file.md`

---

## Template

```markdown
# Story File — #NNN: [Titulo]

> SDD: doc/sdd/NNN-titulo/sdd.md
> Fecha: YYYY-MM-DD
> Branch: [tipo/NNN-titulo-kebab]

---

## Goal

[1-2 oraciones: que se construye y por que. Debe ser suficiente para que Dev entienda el contexto sin leer el SDD.]

## Acceptance Criteria (EARS)

> Copiados del SDD aprobado. Estos son los criterios que QA verificara en F4.

1. WHEN [trigger], THE [sistema] SHALL [accion]
2. WHILE [condicion], THE [sistema] SHALL [comportamiento]
3. IF [condicion no deseada], THEN THE [sistema] SHALL [respuesta]
4. [ACs adicionales...]

## Files to Modify/Create

| # | Archivo | Accion | Que hacer | Exemplar |
|---|---------|--------|-----------|----------|
| 1 | `[path/to/file]` | Crear | [descripcion clara de que crear] | `[path/to/exemplar]` |
| 2 | `[path/to/file]` | Modificar | [descripcion clara de que cambiar] | `[path/to/exemplar]` |
| 3 | `[path/to/test]` | Crear | [test para AC1, AC2] | `[path/to/test-exemplar]` |

## Exemplars

> Fragmentos reales del codebase que Dev debe seguir como patron.
> Architect los extrae durante Codebase Grounding.

### Exemplar 1: [nombre descriptivo]
**Archivo**: `[path/to/exemplar]`
**Usar para**: [que archivo(s) de la tabla anterior]
**Patron clave**:
- [Estructura de imports]
- [Patron de exports]
- [Naming convention]
- [Error handling pattern]
- [Cualquier patron relevante]

### Exemplar 2: [nombre descriptivo]
**Archivo**: `[path/to/exemplar]`
**Usar para**: [que archivo(s)]
**Patron clave**:
- [Patrones a seguir]

## Constraint Directives

### OBLIGATORIO
- Seguir patron de `[exemplar]` para [tipo de archivo]
- Imports: solo modulos que EXISTEN en el proyecto
- [Constraints especificos de esta HU copiados del SDD]

### PROHIBIDO
- NO agregar dependencias nuevas salvo que este listadas aqui: [lista o "ninguna"]
- NO crear patrones diferentes a los existentes
- NO modificar archivos fuera de la tabla "Files to Modify/Create"
- NO hardcodear valores configurables
- [Prohibiciones especificas de esta HU]

## Test Expectations

| Test | ACs que cubre | Framework | Tipo |
|------|--------------|-----------|------|
| `[path/to/test]` | AC1, AC2 | [framework del proyecto] | unit/integration |

### Criterio Test-First

| Tipo de cambio | Test-first? |
|----------------|-------------|
| Logica de negocio | Si |
| APIs / Server Actions | Si |
| Componente con logica condicional | Si |
| Cambio de copy/texto | No |
| Cambio de estilos | No |
| Configuracion | No |

## Waves

### Wave 0 (Serial Gate — completar antes de todo)
- [ ] W0.1: [prerequisito]

### Wave 1 (Parallelizable — tareas independientes)
- [ ] W1.1: [tarea] -> Archivo #1 -> Exemplar 1
- [ ] W1.2: [tarea] -> Archivo #2 -> Exemplar 2

### Wave 2 (Depende de waves anteriores)
- [ ] W2.1: [tarea de integracion] -> Depende de W1.1, W1.2

### Wave 3 (Final — verificacion)
- [ ] W3.1: [verificacion final]

### Verificacion Incremental

| Wave | Verificacion al completar |
|------|--------------------------|
| W0 | typecheck pasa |
| W1 | typecheck + tests pasan |
| W2 | typecheck + tests + visual (si UI) |
| W3 | full QA |

## Out of Scope

> Lo que Dev NO debe tocar bajo ninguna circunstancia.

- [Archivos fuera de scope]
- [Features no relacionadas]
- [Refactors no solicitados]
- NO "mejorar" codigo adyacente
- NO agregar funcionalidad no listada

## Escalation Rule

> **Si algo no esta en este Story File, Dev PARA y pregunta a Architect.**
> No inventar. No asumir. No improvisar.
> Architect resuelve y actualiza el Story File antes de que Dev continue.

Situaciones de escalation:
- Un archivo del exemplar ya no existe
- Un import que necesito no esta disponible
- La tabla de BD tiene columnas diferentes a lo esperado
- Hay ambiguedad en un AC
- El cambio requiere tocar archivos fuera de la tabla

---

*Story File generado por NexusAgil — F2.5*
```

---

## Reglas del Story File

1. **Autocontenido**: Dev NO necesita leer ningun otro artefacto
2. **Concreto**: Sin ambiguedades. Cada archivo con accion clara y exemplar
3. **ACs copiados**: Los ACs vienen del SDD aprobado, no se reescriben
4. **Exemplars reales**: Fragmentos del codebase, no inventados
5. **Constraints copiados**: OBLIGATORIO/PROHIBIDO del SDD, no se relajan
6. **Escalation explicita**: Si falta algo, Dev PARA — no inventa
7. **Waves definidas**: Orden de ejecucion claro con dependencias
8. **Tests definidos**: Que tests crear, que ACs cubren, que framework usar

# Quick Flow — Modo FAST de NexusAgil

> Triage maneja cambios triviales que no merecen el pipeline completo.
> Este es el pipeline del **modo FAST**.
> Activar con: "quick flow", "cambio trivial", "patch rapido", "FAST".
>
> Para MVPs y prototipos usar **modo LAUNCH** (`modo LAUNCH: [descripcion]`).
> Para produccion usar **modo QUALITY** (`NexusAgil, procesa esta HU: [descripcion]`).

---

## Cuando aplica Quick Flow

Quick Flow es para cambios que cumplen TODAS estas condiciones:

| Criterio | Limite |
|----------|--------|
| Archivos afectados | 1-2 |
| Lineas de cambio | <30 |
| Base de datos | No toca BD |
| Logica nueva | No crea logica nueva |
| Seguridad | No afecta auth/permisos |
| Tests | No requiere tests nuevos |

### Ejemplos que SI califican
- Corregir un typo en un label
- Cambiar un color o spacing
- Actualizar texto estatico
- Corregir una URL hardcodeada
- Ajustar un padding/margin
- Cambiar un icono por otro del mismo set

### Ejemplos que NO califican
- Agregar un campo a un formulario (logica de validacion)
- Cambiar un flujo de navegacion (multiples archivos)
- Corregir un bug con logica condicional (requiere test)
- Cualquier cambio que toque la base de datos
- Cambios que afectan autenticacion/autorizacion

---

## Qualification Check

Triage ejecuta este check antes de aceptar un cambio en Quick Flow:

```
QUICK FLOW QUALIFICATION:
[ ] Maximo 2 archivos afectados
[ ] Maximo 30 lineas de cambio
[ ] No toca base de datos
[ ] No crea logica nueva (sin if/else, sin loops, sin calculos)
[ ] No afecta autenticacion ni autorizacion
[ ] No requiere tests nuevos
[ ] El cambio es verificable con typecheck/build (sin test manual)
```

**Si CUALQUIER check falla**: Triage escala a pipeline completo (F0).

---

## Pipeline Abreviado (4 pasos)

### Paso 1: Intake rapido

```markdown
## Quick Flow — [titulo corto]

| Campo | Valor |
|-------|-------|
| **Tipo** | patch |
| **Objetivo** | [1 oracion] |
| **Archivos** | `[path1]`, `[path2]` |
| **Cambio** | [descripcion en 1-2 oraciones] |
```

Triage presenta al humano. Si el humano aprueba, continuar.

### Paso 2: Codebase Grounding ligero

1. Leer los archivos que se van a modificar
2. Verificar que el cambio es tan simple como se espera
3. Si descubre complejidad oculta: **UPGRADE** a pipeline completo

### Paso 3: Implementar + Verificar

1. Hacer el cambio
2. Ejecutar verificacion minima:
   - typecheck
   - build (si es rapido)
3. Si falla: corregir o escalar

### Paso 4: Cerrar

1. Actualizar `doc/sdd/_INDEX.md`:

```markdown
| NNN | YYYY-MM-DD | [titulo] | patch | quick-flow | DONE | patch/NNN-titulo |
```

2. Presentar resumen al humano:

```markdown
## Quick Flow Completado

- **Cambio**: [que se hizo]
- **Archivos**: `[path1]` (N lineas)
- **Verificacion**: typecheck PASS
- **Branch**: patch/NNN-titulo
```

---

## Regla de Upgrade

Triage DEBE escalar a pipeline completo si DURANTE el Quick Flow descubre que:

1. El cambio toca mas de 2 archivos
2. El cambio requiere mas de 30 lineas
3. Hay logica condicional involucrada
4. Necesita tocar base de datos
5. Afecta flujos de autenticacion
6. El typecheck/build falla por razones no triviales
7. El cambio tiene efectos secundarios no previstos

### Formato de Upgrade

```markdown
## UPGRADE: Quick Flow -> Pipeline Completo

**Razon**: [por que Quick Flow no es suficiente]
**Recomendacion**: SDD_MODE [mini/full/bugfix]
**Archivos descubiertos**: [lista de archivos que necesitan cambio]

Procediendo con F0...
```

---

## Reglas del Quick Flow

1. **Triage califica, no el humano**. El humano pide un cambio, Triage determina si califica.
2. **En caso de duda, escalar**. Es mejor usar el pipeline completo que romper algo con un quick fix.
3. **Sin SDD ni Story File**. Quick Flow no genera artefactos formales (solo entrada en _INDEX.md).
4. **Sin Adversarial Review**. Cambios triviales no necesitan AR (pero SI typecheck/build).
5. **El humano puede forzar pipeline completo**. Si dice "usa el pipeline completo", Triage obedece.
6. **El humano puede forzar Quick Flow**. Si dice "solo hazlo rapido" y Triage califica, proceder.
7. **Auto-Blindaje aplica**. Si un Quick Flow causa un error, documentar.

---

## Hotfix Pipeline

> Para bugs reportados en produccion donde la causa raiz es desconocida.
> Activar con: "hotfix", "bug en produccion", "fix urgente".

### Cuando usar Hotfix vs Quick Flow

| Criterio | Quick Flow | Hotfix |
|----------|------------|--------|
| **Causa** | Cambio trivial conocido | Bug reportado en produccion |
| **Causa raiz** | Obvia (typo, color, padding) | Desconocida, requiere investigacion |
| **Riesgo** | Sin riesgo | Puede tocar auth, datos, pagos, queries |
| **Lineas** | <30 | Sin limite (lo minimo necesario) |
| **AR** | No | Obligatorio si toca auth/datos/pagos/DB |

### Pipeline Hotfix (5 pasos)

#### Paso 1: Investigacion de causa raiz

Dev DEBE leer **TODOS** los archivos del area afectada antes de tocar nada.

```
HOTFIX INVESTIGATION:
[ ] Leidos todos los archivos del area afectada (no solo el que falla)
[ ] Causa raiz identificada (no solo el sintoma)
[ ] Fix propuesto es minimo y ataca la causa raiz
[ ] Evaluado si el fix puede causar regresion
```

**Regla critica**: Un fix superficial que no ataca la causa raiz es peor que no hacer nada — pasa el QA pero el bug persiste en produccion.

#### Paso 1b: Decidir tipo de fix

Despues de investigar la causa raiz, Dev decide:

| Situacion | Tipo de fix | Accion |
|-----------|-------------|--------|
| Causa raiz clara, fix directo | **Fix definitivo** | Continuar con Paso 2 |
| Causa raiz compleja, produccion rota AHORA | **Band-aid consciente** | Aplicar fix temporal + crear ticket para fix definitivo |
| Causa raiz es arquitectural | **Upgrade** | Escalar a pipeline completo (ver Regla de Upgrade) |

**Band-aid consciente** — Cuando produccion esta rota y el fix definitivo requiere mas tiempo:

1. Implementar fix temporal minimo que detenga la hemorragia
2. Marcar el fix con comentario `// HOTFIX-BANDAID #NNN: [descripcion]. Fix definitivo pendiente.`
3. Crear entrada en `_INDEX.md` con status `BANDAID` en vez de `DONE`
4. Documentar en el reporte:
   ```markdown
   ## Band-aid Consciente
   - **Sintoma detenido**: [que se arreglo temporalmente]
   - **Causa raiz real**: [que necesita el fix definitivo]
   - **Fix definitivo requiere**: [que se necesita: refactor, migracion, etc.]
   - **Riesgo de dejar el band-aid**: [que pasa si no se hace el fix definitivo]
   ```
5. El band-aid genera automaticamente una HU pendiente para el fix definitivo

**Regla**: Un band-aid sin ticket para el fix definitivo es deuda tecnica invisible. El ticket es obligatorio.

#### Paso 2: Implementar fix minimo

- Solo lo necesario para corregir el bug
- No refactorizar, no mejorar, no limpiar codigo adyacente
- Documentar que se cambio y por que

#### Paso 3: Adversarial Review (condicional)

| El fix toca... | AR |
|----------------|-----|
| Auth, permisos, sesiones | **Obligatorio** |
| Datos de usuario, BD, queries | **Obligatorio** |
| Pagos, transacciones | **Obligatorio** |
| Solo UI sin logica | Opcional |
| Solo texto/copy | Opcional |

#### Paso 4: QA - Verificacion

QA verifica DOS cosas:
1. **El bug esta resuelto** — evidencia con `archivo:linea` del fix
2. **No hay regresion** — typecheck + tests pasan + flujos adyacentes no se rompieron

#### Paso 5: Push

- Actualizar `doc/sdd/_INDEX.md` con tipo `hotfix` y mode `hotfix`
- Status: `DONE` si es fix definitivo, `BANDAID` si es fix temporal (requiere follow-up)
- Branch semantico: `hotfix/NNN-titulo-kebab`

### Lo que se omite en Hotfix

| Fase | Se omite | Razon |
|------|----------|-------|
| Analyst (F1) | Si | El bug ya esta reportado, no hay HU nueva |
| Architect (F2) | Si | No hay decision de diseno, es correccion |
| SM | Si | No hay story file, el bug description es el spec |
| Story File (F2.5) | Si | El bug report es el contrato |
| Code Review | Opcional | Solo si el fix es no-trivial |

### Regla de Upgrade

Si durante la investigacion Dev descubre que:
- El bug es un sintoma de un problema arquitectural
- El fix requiere cambios en mas de 3 archivos
- Se necesita migracion de BD o cambio de schema

→ **UPGRADE** a pipeline completo (F0) con SDD_MODE `bugfix`.

```markdown
## UPGRADE: Hotfix -> Pipeline Completo

**Razon**: [por que hotfix no es suficiente]
**Recomendacion**: SDD_MODE bugfix
**Causa raiz descubierta**: [descripcion]

Procediendo con F0...
```

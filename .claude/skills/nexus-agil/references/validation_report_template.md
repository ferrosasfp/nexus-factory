# Validation Report Template — NexusAgil

> QA genera este reporte en F4 (QA/Validacion).
> Combina: Drift Check + AC Verification + Quality Gates + AR Summary + CR Summary.
> Cada AC necesita evidencia concreta. "Se ve bien" no es evidencia.

---

## Cuando se genera

- **Fase**: F4 (QA/Validacion)
- **Quien lo genera**: QA (QA Engineer)
- **Donde se persiste**: `doc/sdd/NNN-titulo/validation.md`

---

## Template

```markdown
# Validacion — SDD #NNN: [titulo]

> Fecha: YYYY-MM-DD
> Validado por: QA

---

## 1. Drift Check

> Comparar lo implementado vs lo especificado en SDD/Story File.

| Dimension | Esperado | Real | Status |
|-----------|----------|------|--------|
| Archivos creados | N | N | OK/DRIFT |
| Archivos modificados | N | N | OK/DRIFT |
| Dependencias nuevas | [lista o "ninguna"] | [lista o "ninguna"] | OK/DRIFT |
| Archivos fuera de scope | 0 | N | OK/DRIFT |
| Patrones seguidos | [exemplars del Story File] | [que se uso realmente] | OK/DRIFT |

### Drift justificado (si aplica)
| Dimension | Justificacion |
|-----------|---------------|
| [dimension] | [por que se desvio y por que es aceptable] |

> DRIFT grave (archivos fuera de scope, dependencias no aprobadas): ALERTAR al humano.

## 2. Validacion de AC

> Cada AC del Work Item/SDD verificado con evidencia concreta.

| # | AC | Resultado | Evidencia (archivo:linea) | Test | Metodo |
|---|----|-----------|---------------------------|------|--------|
| 1 | WHEN [trigger], THE [sistema] SHALL [accion] | CUMPLE/NO CUMPLE/PARCIAL | `src/path/file.tsx:42` | `[test.ts]` o N/A | auto/manual |
| 2 | WHILE [condicion], THE [sistema] SHALL [comp] | CUMPLE/NO CUMPLE/PARCIAL | `src/path/file.tsx:85` | `[test.ts]` o N/A | auto/manual |
| 3 | IF [condicion], THEN THE [sistema] SHALL [resp] | CUMPLE/NO CUMPLE/PARCIAL | `src/path/file.tsx:120` | `[test.ts]` o N/A | auto/manual |

### Formato obligatorio de evidencia

QA **no puede marcar CUMPLE sin citar archivo:linea** como evidencia.

| Resultado | Formato | Ejemplo |
|-----------|---------|---------|
| **CUMPLE** | `archivo:linea` | `src/components/FilterBar.tsx:42` |
| **NO CUMPLE** | "no encontrado en codebase" | No encontrado en codebase |
| **PARCIAL** | `archivo:linea` + razon | `src/components/FilterBar.tsx:42` (implementado pero sin test) |

### Tipos de evidencia valida
- **Codigo**: "`src/path/file.tsx:42` — implementa [que]"
- **Test automatizado**: "Test `[nombre]` en `[archivo:linea]` pasa — verifica [que]"
- **Screenshot/Visual**: "Screenshot muestra [que se ve] en [donde]"
- **Log/Output**: "Console output muestra [resultado]"
- **Manual verification**: "Navegando a [URL], al hacer [accion], se observa [resultado]"

### Tipos de evidencia NO valida
- "Se ve bien"
- "Deberia funcionar"
- "Es el mismo patron que X"
- Sin citar archivo:linea
- Sin evidencia

## 3. Quality Gates

> Ejecutar los comandos definidos en `project-context.md` del proyecto.

| Check | Comando | Resultado | Notas |
|-------|---------|-----------|-------|
| Typecheck | [comando del proyecto] | PASS/FAIL | |
| Tests | [comando del proyecto] | PASS/FAIL | N passed, N failed |
| Build | [comando del proyecto] | PASS/FAIL/SKIP | Solo si cambios significativos |
| Lint | [comando del proyecto] | PASS/FAIL/SKIP | |
| Limites de archivo | [limite del proyecto] | PASS/FAIL | [archivos que exceden] |

## 4. Adversarial Review Summary

> Resumen del AR de Adversary (referencia completa en el reporte AR).

| Resultado AR | Hallazgos BLOQUEANTE | Hallazgos MENOR | Status |
|-------------|---------------------|-----------------|--------|
| APPROVED/APPROVED with notes/BLOCKED | N | N | Resuelto/Pendiente |

### BLOQUEANTE resueltos (si hubo)
| # | Hallazgo | Fix aplicado | Verificado |
|---|----------|-------------|------------|
| 1 | [hallazgo] | [fix] | Si/No |

## 5. Code Review Summary

> Resumen del CR de Adversary+QA.

| Resultado CR | Status |
|-------------|--------|
| APPROVED/CHANGES_REQUESTED | [estado] |

### Cambios solicitados (si hubo)
| # | Cambio | Aplicado | Verificado |
|---|--------|----------|------------|
| 1 | [cambio] | Si/No | Si/No |

## 6. Auto-Blindaje Acumulado

> Errores encontrados durante todo el pipeline (copiados de F3).

| Fase/Wave | Error | Fix | Aplicar en |
|-----------|-------|-----|-----------|
| [fase] | [que fallo] | [como se arreglo] | [donde mas aplica] |

> "Pipeline limpio" si no hubo errores.

## 7. Veredicto Global

| Criterio | Status |
|----------|--------|
| Todos los ACs PASS | Si/No |
| Quality Gates PASS | Si/No |
| AR resuelto | Si/No |
| CR aprobado | Si/No |
| Sin drift grave | Si/No |

### Resultado

- **PASS** — Todos los criterios cumplidos. Avanzar a DONE.
- **FAIL** — [criterios que fallaron]. Volver a F3 para corregir.

---

*Validacion generada por NexusAgil — F4*
```

---

## Reglas de Validacion

1. **Evidencia con archivo:linea obligatoria**: Cada AC debe citar `archivo:linea` donde se cumple. QA no puede marcar CUMPLE sin esta referencia.
2. **ACs no verificables automaticamente**: Describir verificacion manual paso a paso.
3. **Drift grave es bloqueante**: Archivos fuera de scope o dependencias no aprobadas requieren aprobacion del humano.
4. **Quality Gates del proyecto**: Usar los comandos definidos en `project-context.md`, no defaults.
5. **AR integrado**: El reporte de validacion incluye resumen del AR, no lo reemplaza.
6. **FAIL = volver a F3**: QA no "aprueba con reservas". Si falla, se corrige.
7. **Auto-Blindaje copiado**: Los errores de F3 se copian tal cual, no se reconstruyen de memoria.

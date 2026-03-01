# Sprint Cadence — NexusAgil

> SM (Scrum Master) facilita tres ceremonias semanales.
> Activar con: "sprint planning", "status meeting", "retro", "ceremonia de [dia]".

## Gates de Ceremonia

| Ceremonia | Gate | Texto exacto | Efecto |
|-----------|------|-------------|--------|
| Planning | `SPRINT_APPROVED` | El humano escribe exactamente esto | SM commitea artefactos, Architect arranca F0 de la primera HU |
| Status | `REVIEW_APPROVED` | El humano escribe exactamente esto | SM commitea status, pipeline continua |
| Retrospectiva | `RETRO_APPROVED` | El humano escribe exactamente esto | SM ejecuta Checklist de Cierre y declara sprint CERRADO |

> **Regla:** "sí", "ok", "dale", "bien" **NO** activan ningún gate. El humano debe escribir el texto exacto.
> **`HU_APPROVED` y `SPEC_APPROVED` son exclusivos del pipeline de HUs — nunca de ceremonias.**

---

## Calendario Semanal

| Dia | Ceremonia | Duracion estimada | Objetivo |
|-----|-----------|-------------------|----------|
| **Lunes** | Sprint Planning | 15-30 min | Seleccionar y planificar HUs del sprint |
| **Miercoles** | Status | 10-15 min | Revisar progreso y desbloquear |
| **Viernes** | Retrospectiva | 15-20 min | Mejorar el proceso + Auto-Blindaje |

---

## Lunes: Sprint Planning

### Script de SM

1. **Revisar backlog**: Leer las HUs pendientes del humano
2. **Revisar _INDEX.md**: Ver velocidad del sprint anterior (HUs completadas)
3. **Presentar capacidad**:

```markdown
## Sprint Planning — Semana [YYYY-MM-DD]

### Sprint anterior
| HUs completadas | HUs en progreso | HUs abortadas |
|-----------------|-----------------|---------------|
| N | N | N |

### Backlog priorizado
| Prioridad | HU | Tipo | Estimacion | SDD_MODE |
|-----------|-----|------|-----------|----------|
| P1 | [titulo] | [tipo] | [S/M/L] | [mode] |
| P2 | [titulo] | [tipo] | [S/M/L] | [mode] |
| P3 | [titulo] | [tipo] | [S/M/L] | [mode] |

### Capacidad del sprint
- Sprint duration: [N dias]
- Estimacion: [N HUs basado en velocidad]

### Seleccion propuesta
- [ ] HU: [titulo] — [tipo] — [estimacion]
- [ ] HU: [titulo] — [tipo] — [estimacion]
```

4. **Esperar `SPRINT_APPROVED`** del humano — texto exacto, sin excepciones
5. **Al recibir `SPRINT_APPROVED`**: commitear `sprint-status.yaml` + `roadmap-sprints.md`, actualizar issue tracker, notificar al Architect para arrancar F0+F1 de todas las HUs del sprint
6. **Si hay dudas sobre una HU**: Analyst puede intervenir para clarificar requisitos

> **Nota:** El análisis de dependencias y propuesta de paralelismo es responsabilidad del **Architect en F1** — no del SM. El SM solo coordina la selección; el Architect decide qué puede ir en paralelo basándose en el codebase real.

### Estimacion de Sizing

| Tamano | Senales | SDD_MODE esperado |
|--------|---------|-------------------|
| **S** (Small) | 1-3 archivos, sin BD, sin logica compleja | mini/patch |
| **M** (Medium) | 3-8 archivos, posible BD, logica moderada | full/bugfix |
| **L** (Large) | 8+ archivos, BD, logica compleja, multiples waves | full |

---

## Miercoles: Status

### Script de SM

1. **Revisar HUs en progreso**: Leer artefactos en `doc/sdd/` para HUs activas
2. **Identificar bloqueos**: HUs paradas en un gate, missing inputs, errores no resueltos
3. **Presentar status**:

```markdown
## Status — Semana [YYYY-MM-DD] (Miercoles)

### HUs en progreso
| # | HU | Fase actual | Bloqueado? | Notas |
|---|-----|-------------|-----------|-------|
| NNN | [titulo] | F2 (esperando GATE 2) | Si — [razon] | [detalle] |
| NNN | [titulo] | F3 (Wave 2) | No | En progreso |

### Bloqueos
| HU | Bloqueo | Accion requerida | Responsable |
|----|---------|-----------------|-------------|
| NNN | [descripcion] | [accion] | Humano/Agente |

### Ajustes al plan del sprint
- [Cambio propuesto, si hay]

### Metricas
- HUs completadas esta semana: N
- HUs en progreso: N
- HUs bloqueadas: N
```

4. **Esperar `REVIEW_APPROVED`** del humano — texto exacto, sin excepciones
5. **Al recibir `REVIEW_APPROVED`**: commitear status actualizado, pipeline continua
6. **Si hay bloqueos**: Proponer soluciones o escalar al humano
7. **Ajustar plan si es necesario**: Repriorizar, mover HUs al siguiente sprint

---

## Viernes: Retrospectiva

### Script de SM

1. **Compilar resultados del sprint**: Leer _INDEX.md y reportes de la semana
2. **Recopilar Auto-Blindaje acumulado** de todos los reportes de la semana
3. **Presentar retro**:

```markdown
## Retrospectiva — Semana [YYYY-MM-DD] (Viernes)

### Resumen del sprint
| Metrica | Valor |
|---------|-------|
| HUs completadas | N |
| HUs en progreso (carry-over) | N |
| HUs abortadas | N |
| Errores encontrados (Auto-Blindaje) | N |
| Hallazgos AR (BLOQUEANTE) | N |
| Hallazgos AR (MENOR) | N |

### Que funciono bien
- [Aspecto positivo 1]
- [Aspecto positivo 2]

### Que no funciono
- [Problema 1 y por que]
- [Problema 2 y por que]

### Auto-Blindaje consolidado
| Fecha | Error | Fix | Aplicar en | Documentado en |
|-------|-------|-----|-----------|---------------|
| [fecha] | [error] | [fix] | [donde aplica] | [archivo de reglas] |

### Acciones de mejora
| # | Accion | Responsable | Plazo |
|---|--------|-------------|-------|
| 1 | [accion concreta] | [quien] | [cuando] |
| 2 | [accion concreta] | [quien] | [cuando] |

### Velocidad
- Sprint anterior: N HUs
- Este sprint: N HUs
- Tendencia: [mejorando/estable/empeorando]
```

4. **Auto-Blindaje a reglas del proyecto**: Si un error se repitio en multiples HUs, SM propone agregarlo a `project-context.md` o reglas del proyecto
5. **Esperar `RETRO_APPROVED`** del humano — texto exacto, sin excepciones
6. **Al recibir `RETRO_APPROVED`**: SM ejecuta el Checklist de Cierre de Sprint y declara sprint CERRADO
7. **Celebracion**: Si el sprint fue limpio (sin BLOQUEANTE, sin drift grave), Party Mode breve

---

## Checklist de Cierre de Sprint (SM)

> Ejecutar al finalizar la Retrospectiva. El sprint no es CERRADO hasta que todo este marcado.

```
[ ] _INDEX.md — todos los NNN del sprint tienen status DONE/CARRY-OVER/CANCELLED/ABORTED
[ ] sprint-status.yaml — estado: CERRADO, completadas, carry_over y deuda_tecnica_nueva documentados
[ ] Issue tracker — todos los issues del sprint en Done/Closed en Linear/GitHub/Jira
[ ] project-context.md — actualizado con ADRs nuevos y reglas de proceso del Auto-Blindaje
[ ] git commit + push — todos los artefactos de cierre commiteados
```

### sprint-status.yaml — Formato

```yaml
sprint: N
periodo: "YYYY-MM-DD → YYYY-MM-DD"
estado: CERRADO
goal: "descripcion del goal"
goal_cumplido: true/false/parcial

completadas:
  - id: WAS-XX
    hu: Titulo de la HU
    modo: FAST/QUALITY
    estado: DONE
    commit: abc1234

carry_over:
  - id: WAS-XX
    hu: Titulo
    razon: Motivo del carry-over

deuda_tecnica_nueva:
  - descripcion: Descripcion de la deuda
    severidad: MENOR/MAYOR
    sprint_objetivo: N

proxima_ceremonia: "Descripcion"
```

---

## Reglas de Cadencia

1. **Las ceremonias son opcionales pero recomendadas**. El humano puede saltarlas.
2. **SM no bloquea el pipeline**. Las ceremonias son informativas y de coordinacion.
3. **Auto-Blindaje se consolida en retro**. Los errores individuales se documentan al momento, la retro los agrupa.
4. **Velocidad se mide en HUs, no en lineas de codigo**.
5. **Sprint = 1 semana** por default. El humano puede ajustar.
6. **SM puede proponer pero no decidir**. Priorizacion final es del humano.
7. **Carry-over no es fracaso**. Si una HU se lleva al siguiente sprint, SM documenta por que.

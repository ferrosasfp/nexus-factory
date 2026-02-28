# Launch Flow — Modo LAUNCH de NexusAgil

> Para MVPs, prototipos y proyectos nuevos.
> Velocidad sin perder estructura. Anti-alucinacion siempre activa.
> Activar con: "modo LAUNCH", "MVP", "prototipo", "construye [algo nuevo]".

---

## Cuando usar LAUNCH

| Señal | Usar LAUNCH |
|-------|-------------|
| Proyecto nuevo desde cero | ✅ |
| MVP para demo o pitch | ✅ |
| Primera version de una feature compleja | ✅ |
| No va a produccion todavia | ✅ |
| Quieres velocidad + estructura basica | ✅ |
| Ya esta en produccion con usuarios reales | ❌ usar QUALITY |
| Tiene pagos o datos sensibles | ❌ usar QUALITY |

---

## Pipeline LAUNCH

### F0 — Bootstrap de Proyecto

**Agente:** Architect

1. Verificar si existe `project-context.md`
   - Si existe: leerlo
   - Si NO existe: ejecutar Bootstrap (leer codebase, generar project-context.md)

2. Confirmar al humano stack identificado y preguntar:
   > "Stack identificado: [X]. ¿Cuales son las HUs del MVP?
   > Listame lo que quieres construir (puede ser texto libre)."

---

### F1 — Lista de HUs del MVP

**Agente:** Analyst

El humano describe lo que quiere. El Analyst normaliza en una lista de HUs con:
- Titulo corto
- Objetivo en 1 oracion
- Estimacion: XS / S / M / L

No hay Work Item formal. No hay ACs EARS todavia.

Presentar la lista al humano para confirmar scope.

---

### GATE: LAUNCH_APPROVED

El humano escribe exactamente: `LAUNCH_APPROVED`

- Texto exacto — nada mas activa el gate
- "ok", "dale", "si" NO activan el gate

---

### F2 — Story File por HU

**Agente:** Architect

Por cada HU de la lista, generar un Story File simplificado:

```markdown
# Story: [Titulo]

## Objetivo
[1-2 oraciones — que construir y por que]

## Acceptance Criteria
- [ ] [criterio verificable 1]
- [ ] [criterio verificable 2]
- [ ] [criterio verificable 3]

## Archivos a crear/modificar
| Archivo | Accion | Exemplar |
|---------|--------|---------|
| [ruta] | crear/modificar | [archivo similar existente] |

## Waves
W0 (serial): [prerequisitos]
W1 (paralelo): [tareas independientes]

## Out of Scope
- [que NO tocar]

## DoD
- [ ] Build/typecheck limpio
- [ ] ACs verificados manualmente
```

Sin SDD completo. Sin Constraint Directives extensas.
El Codebase Grounding va dentro del Story File como tabla de Exemplars.

Guardar en: `doc/sdd/launch/story-[titulo-kebab].md`

---

### F3 — Implementacion

**Agente:** Dev

Mismo protocolo que QUALITY:
- Leer el Story File completo
- Anti-Hallucination Protocol: leer exemplar antes de cada tarea
- Implementar por waves
- Re-mapeo ligero entre waves
- Auto-Blindaje si hay errores

**Diferencia vs QUALITY:** no hay AR ni CR separados.
El Dev hace un auto-review basico antes de marcar done:
- Sin secretos hardcodeados
- Sin datos simulados en rutas reales
- Build limpio

---

### QA Ligero

**Agente:** QA (o el mismo Dev si es proyecto personal)

Checklist basico:
- [ ] `npm run build` (o equivalente) → 0 errores
- [ ] Cada AC del Story File verificado: CUMPLE / NO CUMPLE
- [ ] Sin imports inexistentes
- [ ] Sin console.log de debug en produccion

No requiere evidencia archivo:linea (eso es QUALITY).

---

### Push e Iteracion

```bash
git add .
git commit -m "feat: [titulo HU]"
git push origin main
```

Repetir F2→F3→QA por cada HU de la lista.

---

## Lo que LAUNCH no tiene (vs QUALITY)

| Fase | LAUNCH | QUALITY |
|------|--------|---------|
| Work Item formal (S0) | ❌ | ✅ |
| ACs en formato EARS | ❌ | ✅ |
| SDD completo | ❌ | ✅ |
| Constraint Directives | ❌ | ✅ |
| Adversarial Review | ❌ | ✅ |
| Code Review formal | ❌ | ✅ |
| QA con evidencia archivo:linea | ❌ | ✅ |

## Lo que LAUNCH SI tiene (vs FAST)

| Feature | LAUNCH | FAST |
|---------|--------|------|
| Codebase Grounding | ✅ | minimo |
| Story File | ✅ | ❌ |
| Gate humano | ✅ (LAUNCH_APPROVED) | ❌ |
| Anti-alucinacion completa | ✅ | parcial |
| Waves estructuradas | ✅ | ❌ |
| Auto-Blindaje | ✅ | ❌ |

---

## Cuando hacer UPGRADE a QUALITY

Si durante el LAUNCH aparece cualquiera de estas señales → parar y cambiar a QUALITY:

- El MVP va a tener usuarios reales antes de lo esperado
- Se agrega auth, pagos o datos sensibles
- El equipo crece a 2+ personas
- Un bug causaria perdida de datos o dinero

El upgrade es simple: los Story Files de LAUNCH se convierten en el input del SDD de QUALITY.

---

*NexusAgil — Modo LAUNCH*

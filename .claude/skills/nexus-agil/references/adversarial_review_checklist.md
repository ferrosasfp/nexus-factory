# Adversarial Review Checklist — NexusAgil

> Adversary ejecuta este checklist DESPUES de F3 (Implementacion).
> Su objetivo: encontrar fallas antes de que lleguen a produccion.
> Clasificacion: BLOQUEANTE (corregir antes de avanzar) / MENOR (documentar) / OK (sin hallazgos).

---

## Cuando se ejecuta

- **Fase**: Adversarial Review (AR), despues de F3
- **Quien lo ejecuta**: Adversary (Security & Quality Adversary)
- **Quien corrige**: Dev (Developer)
- **Bloqueante**: Si hay hallazgos BLOQUEANTE, Dev corrige y Adversary re-revisa

---

## Categorias de Ataque

### 1. Autenticacion y Autorizacion (AuthZ)

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| Rutas nuevas verifican auth | Rutas publicas que deberian ser privadas | BLOQUEANTE |
| Acciones protegidas | Server actions/APIs sin verificacion de sesion | BLOQUEANTE |
| Roles respetados | Acceso a datos de otros usuarios | BLOQUEANTE |
| Tokens/sesiones | Sesiones sin expiracion, tokens en localStorage | MENOR |

**Preguntas de ataque**:
- Puede un usuario no autenticado acceder a esta ruta/accion?
- Puede un usuario ver/modificar datos de otro usuario?
- Hay escalacion de privilegios posible?

### 2. Validacion de Inputs

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| Entrada de usuario validada | Formularios sin validacion server-side | BLOQUEANTE |
| Tipos verificados | Inputs que asumen tipo sin validar | MENOR |
| Limites de longitud | Strings sin limite que pueden desbordar | MENOR |
| Archivos subidos | Uploads sin validacion de tipo/tamano | BLOQUEANTE |

**Preguntas de ataque**:
- Que pasa si envio un string donde espera un numero?
- Que pasa si envio un payload de 10MB?
- Que pasa si envio caracteres especiales/unicode?

### 3. Inyeccion

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| SQL Injection | Queries con concatenacion de strings | BLOQUEANTE |
| XSS | innerHTML/dangerouslySetInnerHTML sin sanitizar | BLOQUEANTE |
| Command Injection | Ejecucion de comandos con input de usuario | BLOQUEANTE |
| Path Traversal | Acceso a archivos con input de usuario sin sanitizar | BLOQUEANTE |

**Preguntas de ataque**:
- Hay algun lugar donde input de usuario se concatena en una query?
- Hay renderizado de HTML no sanitizado?
- Se construyen paths de archivo con input de usuario?

### 4. Secretos y Configuracion

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| Secrets hardcodeados | API keys, passwords, tokens en codigo | BLOQUEANTE |
| Secrets en logs | Informacion sensible logueada | BLOQUEANTE |
| Secrets en cliente | Env vars de servidor expuestas al cliente | BLOQUEANTE |
| Configuracion segura | Defaults inseguros (CORS abierto, debug en prod) | MENOR |

**Preguntas de ataque**:
- Hay algun secret visible en el codigo fuente?
- Se loguea informacion que podria ser sensible?
- Hay variables de entorno de servidor accesibles desde el cliente?

### 5. Race Conditions y Concurrencia

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| Double-submit | Formularios/acciones sin proteccion contra doble envio | MENOR |
| Estado inconsistente | Operaciones no atomicas que pueden dejar datos corruptos | BLOQUEANTE |
| Rate limiting | Endpoints publicos sin limite de requests | MENOR |
| Idempotencia | Operaciones que generan duplicados si se ejecutan dos veces | MENOR |

**Preguntas de ataque**:
- Que pasa si el usuario hace click dos veces rapido?
- Que pasa si dos usuarios ejecutan la misma accion simultaneamente?
- Hay proteccion contra abuso de endpoints?

### 6. Exposicion de Datos

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| Datos excesivos | APIs que devuelven mas datos de los necesarios | MENOR |
| PII expuesta | Informacion personal visible donde no deberia | BLOQUEANTE |
| Errores verbosos | Stack traces o errores internos expuestos al usuario | MENOR |
| Enumeracion | IDs secuenciales que permiten enumerar recursos | MENOR |

**Preguntas de ataque**:
- La API devuelve campos que el cliente no necesita?
- Se expone informacion personal de otros usuarios?
- Los mensajes de error revelan detalles internos?

### 7. Datos Mock y Hardcoded

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| Mock data en produccion | Datos de prueba que no se reemplazaron | BLOQUEANTE |
| URLs hardcodeadas | URLs de desarrollo que no se parametrizaron | MENOR |
| Valores magicos | Numeros o strings hardcodeados que deberian ser configurables | MENOR |

**Preguntas de ataque**:
- Hay datos de prueba que podrian llegar a produccion?
- Hay URLs que apuntan a ambientes de desarrollo?
- Hay valores que deberian venir de configuracion?

### 8. Seguridad de Base de Datos

| Check | Que buscar | Severidad si falla |
|-------|-----------|-------------------|
| RLS/Policies | Tablas nuevas sin Row Level Security (si el stack lo soporta) | BLOQUEANTE |
| Permisos | Operaciones que no verifican ownership | BLOQUEANTE |
| Migraciones | Migraciones que podrian perder datos | BLOQUEANTE |
| Indices | Queries sin indices que podrian ser lentas | MENOR |

**Preguntas de ataque**:
- Un usuario puede consultar/modificar filas de otro usuario?
- Las migraciones son reversibles sin perder datos?
- Hay queries que podrian ser N+1 o full table scan?

---

## Formato de Reporte AR

```markdown
## Adversarial Review — SDD #NNN

> Fecha: YYYY-MM-DD
> Revisado por: Adversary

### Resumen

| Categoria | Resultado | Hallazgos |
|-----------|-----------|-----------|
| 1. AuthZ | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |
| 2. Inputs | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |
| 3. Inyeccion | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |
| 4. Secretos | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |
| 5. Race Conditions | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |
| 6. Data Exposure | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |
| 7. Mock Data | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |
| 8. BD Security | OK/BLOQUEANTE/MENOR | [desc o "Sin hallazgos"] |

### Hallazgos BLOQUEANTE (si hay)

| # | Categoria | Archivo | Descripcion | Fix requerido |
|---|-----------|---------|-------------|---------------|
| 1 | [cat] | `[path]` | [que esta mal] | [que debe corregirse] |

### Hallazgos MENOR (si hay)

| # | Categoria | Archivo | Descripcion | Recomendacion |
|---|-----------|---------|-------------|---------------|
| 1 | [cat] | `[path]` | [que podria mejorar] | [sugerencia] |

### Veredicto

- **BLOCKED**: Hay hallazgos BLOQUEANTE. Dev debe corregir y Adversary re-revisa.
- **APPROVED with notes**: Solo hallazgos MENOR. Documentar y continuar.
- **APPROVED**: Sin hallazgos. Pipeline limpio.
```

---

## Reglas del AR

1. **Adversary NUNCA implementa**. Solo identifica problemas. Dev corrige.
2. **BLOQUEANTE es innegociable**. No se avanza hasta que se corrija.
3. **MENOR se documenta**. Se corrige si es rapido, se deja como deuda tecnica si no.
4. **Re-review despues de correcciones**. Adversary verifica que el fix es correcto.
5. **Sin falsos positivos**. Adversary debe justificar cada hallazgo con evidencia concreta.
6. **N/A es valido**. Si una categoria no aplica a esta HU, marcar OK con nota "N/A".
7. **El AR se hace sobre codigo real**. Adversary lee los archivos modificados, no asume.

# Project Context Template — NexusAgil

> Cada proyecto que usa NexusAgil define su Golden Path en este archivo.
> Copia este template a tu proyecto y completalo.
> NexusAgil lo lee en F0 para adaptar el pipeline al stack del proyecto.

---

## Donde colocarlo

Opciones (en orden de preferencia):
1. `project-context.md` en la raiz del proyecto
2. `.claude/project-context.md`
3. Seccion en `CLAUDE.md` del proyecto

NexusAgil busca en F0: primero `project-context.md`, luego `.claude/project-context.md`, luego `CLAUDE.md`.

---

## Template

```markdown
# Project Context — [Nombre del Proyecto]

> Fuente de verdad para el Golden Path de este proyecto.
> NexusAgil lee este archivo en F0 para adaptar el pipeline.

---

## 1. Stack (Golden Path)

| Capa | Tecnologia | Version | Notas |
|------|------------|---------|-------|
| Framework | [ej: Next.js, Django, Rails] | [version] | [notas] |
| Lenguaje | [ej: TypeScript, Python, Ruby] | [version] | [notas] |
| Estilos | [ej: Tailwind CSS, SCSS, CSS Modules] | [version] | [notas] |
| Base de Datos | [ej: Supabase, PostgreSQL, MongoDB] | [version] | [notas] |
| Auth | [ej: Supabase Auth, NextAuth, Auth0] | [version] | [notas] |
| Validacion | [ej: Zod, Yup, class-validator] | [version] | [notas] |
| Estado | [ej: Zustand, Redux, Context] | [version] | [notas] |
| Testing | [ej: Vitest, Jest, Playwright] | [version] | [notas] |
| AI (si aplica) | [ej: Vercel AI SDK, LangChain] | [version] | [notas] |

> Solo las tecnologias listadas aqui estan permitidas. NO agregar dependencias fuera de esta tabla sin aprobacion explicita.

## 2. Arquitectura de Carpetas

```
[Estructura de carpetas del proyecto]
Ejemplo:
src/
+-- app/                      # Rutas/paginas
+-- features/                 # Organizadas por funcionalidad
|   +-- [feature]/
|       +-- components/
|       +-- hooks/
|       +-- services/
|       +-- types/
+-- shared/                   # Codigo reutilizable
    +-- components/
    +-- hooks/
    +-- lib/
    +-- types/
```

> NexusAgil usa esta estructura para Codebase Grounding y generar SDDs.

## 3. Comandos

| Accion | Comando | Notas |
|--------|---------|-------|
| Dev server | [ej: npm run dev] | [notas: auto-port, etc.] |
| Build | [ej: npm run build] | |
| Typecheck | [ej: npm run typecheck] | |
| Lint | [ej: npm run lint] | |
| Tests | [ej: npm run test] | |
| Full QA | [ej: npm run qa] | [o secuencia de comandos] |

> QA usa estos comandos en F4 para Quality Gates.

## 4. Reglas de Codigo

### Limites
| Regla | Limite |
|-------|--------|
| Max lineas por archivo | [ej: 500] |
| Max lineas por funcion | [ej: 50] |
| Max parametros por funcion | [ej: 4] |

### Naming
| Elemento | Convencion | Ejemplo |
|----------|-----------|---------|
| Variables/Funciones | [ej: camelCase] | `getUserName` |
| Componentes | [ej: PascalCase] | `UserProfile` |
| Constantes | [ej: UPPER_SNAKE_CASE] | `MAX_RETRIES` |
| Archivos/Carpetas | [ej: kebab-case] | `user-profile.tsx` |

### Patrones obligatorios
- [Patron 1: ej. "Server Actions con validacion Zod"]
- [Patron 2: ej. "Componentes con interface Props"]
- [Patron 3: ej. "Hooks custom con prefijo use"]

### Prohibiciones
- [Prohibicion 1: ej. "NO usar any en TypeScript"]
- [Prohibicion 2: ej. "NO usar var, solo const/let"]
- [Prohibicion 3: ej. "NO hardcodear configuraciones"]

## 5. Guardrails

> Reglas de negocio no negociables que aplican a TODO el proyecto.

| # | Guardrail | Descripcion |
|---|-----------|-------------|
| 1 | [nombre] | [descripcion] |
| 2 | [nombre] | [descripcion] |
| 3 | [nombre] | [descripcion] |

> Adversary verifica estos guardrails durante el Adversarial Review.

## 6. Base de Datos

### Configuracion
- Tipo: [ej: PostgreSQL via Supabase]
- RLS: [habilitado/deshabilitado]
- Migraciones: [como se manejan]

### Tablas principales
| Tabla | Descripcion | RLS |
|-------|-------------|-----|
| [tabla] | [que almacena] | [si/no] |

> Architect consulta esto durante Codebase Grounding en F2.

## 7. Seguridad

| Aspecto | Configuracion |
|---------|---------------|
| Auth | [como funciona: ej. Supabase Auth con email/password] |
| Sesiones | [donde se almacenan, expiracion] |
| CORS | [configuracion] |
| Rate Limiting | [donde aplica, herramienta] |
| Secrets | [donde se almacenan: ej. env vars, Vercel] |

> Adversary usa esto durante el Adversarial Review.

## 8. Patrones de Componente (Exemplars)

> Archivos que sirven como patron para crear archivos nuevos.

| Tipo de archivo | Exemplar | Patron clave |
|----------------|----------|-------------|
| Componente UI | `[path/to/exemplar]` | [patron: imports, props, exports] |
| Server Action | `[path/to/exemplar]` | [patron: validacion, auth, response] |
| Hook custom | `[path/to/exemplar]` | [patron: state, effects, return] |
| Test | `[path/to/exemplar]` | [patron: arrange, act, assert] |
| Pagina/Ruta | `[path/to/exemplar]` | [patron: layout, data fetching] |

> Architect usa estos exemplars para Codebase Grounding y Story Files.

## 9. Aprendizajes (Auto-Blindaje)

> Errores documentados que aplican a todo el proyecto.

### [YYYY-MM-DD]: [Titulo corto]
- **Error**: [Que fallo]
- **Fix**: [Como se arreglo]
- **Aplicar en**: [Donde mas aplica]
```

---

## Reglas del Project Context

1. **Fuente de verdad**: Si hay conflicto entre project-context y otro archivo, project-context gana.
2. **Actualizar al evolucionar**: Cuando el stack cambia, actualizar este archivo.
3. **No inventar**: Si el proyecto no tiene un aspecto (ej. no tiene BD), dejar la seccion vacia o N/A.
4. **Exemplars vivos**: Verificar que los archivos de referencia existen antes de usarlos.
5. **Auto-Blindaje aqui**: Errores que aplican a todo el proyecto se documentan en seccion 9.

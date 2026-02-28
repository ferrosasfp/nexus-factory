# project-context.md
> Generado por NexusAgil F0 — Bootstrap de Proyecto
> Actualizar cuando cambie el stack, arquitectura o guardrails.

---

## Proyecto

| Campo | Valor |
|-------|-------|
| **Nombre** | [nombre del proyecto] |
| **Descripcion** | [que hace el proyecto en 1-2 oraciones] |
| **Tipo** | web-app / api / mobile / cli / library / otro |
| **Estado** | prototipo / desarrollo / produccion |

---

## Stack

> Completar solo con lo que EXISTE en el proyecto. No agregar lo que no esta instalado.

| Capa | Tecnologia | Version |
|------|-----------|---------|
| Lenguaje | [ej: TypeScript, Python, Ruby, Go] | [version] |
| Framework | [ej: Next.js, Rails, Django, FastAPI] | [version] |
| Base de datos | [ej: PostgreSQL, MySQL, MongoDB, SQLite] | [version] |
| ORM / Cliente DB | [ej: Prisma, ActiveRecord, SQLAlchemy, Supabase] | [version] |
| Auth | [ej: Supabase Auth, Devise, JWT, NextAuth] | [version] |
| Estilos | [ej: Tailwind, CSS Modules, Styled Components] | [version] |
| Testing | [ej: Vitest, Jest, RSpec, pytest] | [version] |
| Deploy | [ej: Vercel, Heroku, Railway, AWS] | - |

---

## Arquitectura de Carpetas

> Describir solo la estructura real del proyecto (resultado de Glob en F0).

```
[pegar estructura real aqui]
```

**Patron de arquitectura**: [feature-first / MVC / layered / monorepo / microservicios]

---

## Comandos

```bash
# Desarrollo
[comando para levantar servidor local]

# Build produccion
[comando de build]

# Tests
[comando de tests unitarios]
[comando de tests e2e — si existe]

# Lint / Typecheck
[comando de lint]
[comando de typecheck — si aplica]

# Base de datos
[comando de migraciones — si aplica]
[comando de seed — si aplica]
```

---

## Patrones de Codigo

> Extraidos del codebase real en F0. Actualizar si cambian los patrones.

### Patron de componente / modulo
```
[pegar ejemplo real del proyecto]
```

### Patron de manejo de errores
```
[pegar ejemplo real del proyecto]
```

### Patron de acceso a base de datos
```
[pegar ejemplo real del proyecto]
```

### Patron de auth / autorizacion
```
[pegar ejemplo real del proyecto]
```

---

## Exemplars

> Archivos del proyecto a usar como referencia para nuevas implementaciones.
> El Dev DEBE leer estos archivos antes de implementar algo similar.

| Cuando crear... | Usar como exemplar |
|----------------|-------------------|
| [tipo de archivo] | [ruta/archivo.ext] |
| [tipo de archivo] | [ruta/archivo.ext] |

---

## Guardrails (Reglas del Proyecto)

### OBLIGATORIO
- [regla especifica del proyecto]
- [ej: Siempre usar el cliente de BD centralizado, no instanciar directamente]
- [ej: Toda ruta protegida debe verificar auth en el middleware]

### PROHIBIDO
- [ej: NUNCA usar any en TypeScript]
- [ej: NUNCA hardcodear URLs o keys — usar variables de entorno]
- [ej: NUNCA saltarse las migraciones — no modificar schema directamente]
- [ej: NUNCA subir secrets al repositorio]

---

## Variables de Entorno

> Solo nombres — nunca valores.

```
[NOMBRE_VAR_1] — descripcion de para que se usa
[NOMBRE_VAR_2] — descripcion de para que se usa
```

---

## Contexto de Negocio

> Lo minimo necesario para que el Architect tome decisiones correctas.

- **Usuarios objetivo**: [quien usa el producto]
- **Flujo principal**: [que hace el usuario tipicamente]
- **Integraciones externas**: [APIs de terceros que usa el proyecto]

---

## Auto-Blindaje

> Errores encontrados durante el desarrollo. Se actualiza cuando ocurre un error, no al final.

| Fecha | Error | Fix | Aplicar en |
|-------|-------|-----|-----------|
| [YYYY-MM-DD] | [que fallo] | [como se arreglo] | [donde mas aplica] |

---

*Generado por NexusAgil F0 Bootstrap — actualizar con cada cambio significativo al stack*

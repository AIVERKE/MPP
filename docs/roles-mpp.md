# Roles operativos MPP

## Regla común de acceso

Cada decisión de acceso considera:

**rol + acción + unidad organizativa + estado del procedimiento**

Tener un rol no implica poder actuar sobre cualquier recurso: el alcance por unidad y el estado del flujo limitan la acción.

## Catálogo (5 roles)

| Rol | Capacidades (resumen) |
|-----|------------------------|
| **Consultor** | Consulta procedimientos publicados (`Aprobado` / `Renovado`). No crea, modifica, observa ni valida. |
| **Elaborador** | Crea/modifica/envía borradores de sus unidades asignadas. No puede dar el visto bueno técnico del mismo procedimiento que elaboró. |
| **Validador de Planificación** | Revisa metodología y forma; observa o envía a visto bueno técnico. No certifica contenido técnico. |
| **Validador Técnico** | Revisa contenido técnico de sus unidades; observa o otorga VB técnico final (`Aprobado`). |
| **Super admin** | Gestiona usuarios, roles, alcances, catálogos y parámetros. Intervenciones excepcionales quedan auditadas. |

## Alcance por unidad

Tabla `usuario_rol_unidad` (usuario + rol + unidad).

- Obligatoria para **Elaborador** y **Validador Técnico**.
- Opcional/extensión mínima para **Consultor**.
- Un mismo usuario puede ser Elaborador de la unidad A y Validador Técnico de la unidad B.

Asignación: vista **Super admin → Usuarios**.

## Segregación de funciones

Una persona puede tener ambos roles (Elaborador y Validador Técnico), pero **no** puede elaborar y validar técnicamente el **mismo** procedimiento.

Implementación actual: al transicionar `estado_version` → `Aprobado`, se rechaza si `idUsuario === procedimiento.id_elaborador`.

## Motor de permisos (alcance de este ticket)

Base enforceable mínima:

1. Catálogo y asignación multi-rol.
2. Alcance por unidad (Elaborador / Validador Técnico).
3. Segregación Elaborador ↔ Validador Técnico en aprobación.
4. Consultor solo lectura de publicados.

**Fuera de este ticket:** matriz exhaustiva acción × estado (observaciones de Planificación/técnicas, estados intermedios del canvas) y mapeo de los 12 perfiles institucionales.

## Seed de seguridad

```bash
npm run seed -- src/database/seed-3/admin-seguridad.seeder.ts
```

- Usuario: `admin` / `Admin123!`
- Rol: **Super admin**

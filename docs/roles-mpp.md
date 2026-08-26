# Roles operativos MPP

## Regla común de acceso

Cada decisión de acceso considera:

**rol + acción + unidad organizativa + estado del procedimiento**

Tener un rol no implica poder actuar sobre cualquier recurso: el alcance por unidad y el estado del flujo limitan la acción.

## Catálogo (5 roles)

| Rol | Capacidades (resumen) |
|-----|------------------------|
| **Consultor** | Consulta universitaria de procedimientos publicados (`Aprobado` / `Renovado`): listar, buscar, detalle, diagrama, historial de versiones e imprimir/PDF. No crea, modifica, observa ni valida. Sin límite por unidad. |
| **Elaborador** | Crea/modifica/envía borradores de procedimientos de sus unidades asignadas. No puede dar el visto bueno técnico del mismo procedimiento que elaboró. |
| **Validador de Planificación** | Revisa metodología y forma; observa o envía a visto bueno técnico. No certifica contenido técnico. |
| **Validador Técnico** | Revisa contenido técnico de sus unidades; observa o otorga VB técnico final (`Aprobado`). |
| **Super admin** | Gestiona usuarios, roles, alcances, catálogos y parámetros. Intervenciones excepcionales quedan auditadas. |

## Consultor (solo lectura)

- UI: Historial MPP; sin Generador / Editar / Nueva Versión.
- API: listado/detalle/versiones solo publicados; mutaciones (proceso, procedimiento, flujo, recursos, calidad) → 403.
- Filtros: nombre/código, unidad responsable, categoría (`tipo_proceso`).
- Alcance: toda la universidad (no usa `usuario_rol_unidad`).
- Exportación: imprimir y PDF en cliente del detalle ± diagrama.

## Alcance por unidad

Tabla `usuario_rol_unidad` (usuario + rol + unidad).

- Obligatoria para **Elaborador** y **Validador Técnico**.
- **Consultor** no lleva alcance por unidad (consulta universitaria).

Asignación: vista **Super admin → Usuarios**.

## Segregación de funciones

Una persona puede tener ambos roles (Elaborador y Validador Técnico), pero **no** puede elaborar y validar técnicamente el **mismo** procedimiento.

Implementación: al transicionar `estado_version` → `Aprobado`, se rechaza si `idUsuario === procedimiento.id_elaborador`.

## Seed de seguridad

```bash
npm run seed -- src/database/seed-3/admin-seguridad.seeder.ts
```

- Usuario: `admin` / `Admin123!`
- Rol: **Super admin**

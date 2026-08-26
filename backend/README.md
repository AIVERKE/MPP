# 🚀 Backend MPP - NestJS

Este es el backend del sistema MPP, construido con [NestJS](https://github.com/nestjs/nest), [TypeORM](https://typeorm.io/) y [PostgreSQL](https://www.postgresql.org/).

## 📋 Requisitos Previos

- [Node.js](https://nodejs.org/) (v18 o superior recomendado)
- [PostgreSQL](https://www.postgresql.org/) corriendo localmente o en la nube
- [npm](https://www.npmjs.com/) o [yarn](https://yarnpkg.com/)

## 🛠️ Guía de Instalación

1. **Clonar el repositorio**
   ```bash
   git clone <url-del-repositorio>
   cd backend-mpp
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar variables de entorno**
   Copia el archivo `.env.example` a uno nuevo llamado `.env` y completa los datos de tu base de datos y JWT.
   ```bash
   cp .env.example .env
   ```

4. **Crear la base de datos**
   Asegúrate de crear una base de datos en PostgreSQL con el nombre que definiste en el archivo `.env` (por defecto `mpp_db`).

## 🐳 Ejecución con Docker

Si quieres levantar todo el stack (PostgreSQL + backend + frontend) desde la raíz del repositorio:

```bash
docker compose up --build
```

El backend quedará disponible en:

- API: `http://localhost:3000`
- Swagger: `http://localhost:3000/api`

Variables sugeridas para entorno Docker del backend:

```bash
cp backend/.env.docker.example backend/.env
```

> Nota: en Docker Compose, `DB_HOST` debe ser `db`.

## 💾 Base de Datos y Migraciones

Este proyecto utiliza migraciones para mantener sincronizada la estructura de la base de datos.

- **Generar una migración**: Compara las entidades actuales con la DB y genera el SQL necesario en `src/migrations/`.
  ```bash
  npm run migration:generate -- src/migrations/NombreDeTuMigracion
  ```
- **Ejecutar migraciones**: Aplica todas las migraciones pendientes a la base de datos.
  ```bash
  npm run migration:run
  ```
- **Revertir migración**: Deshace la última migración ejecutada.
  ```bash
  npm run migration:revert
  ```
- **CLI de TypeORM**: Acceso directo a la interfaz de comandos de TypeORM.
  ```bash
  npm run typeorm -- [comando]
  ```

### Migraciones usando Docker

Con los contenedores activos, ejecuta desde la raíz:

```bash
docker compose exec backend npm run migration:run
docker compose exec backend npm run migration:revert
docker compose exec backend npm run migration:generate -- src/migrations/NombreDeTuMigracion
docker compose exec backend npm run typeorm -- [comando]
```

Los scripts de migración en `package.json` se mantienen sin cambios y siguen siendo válidos para modo manual y modo Docker.

## 🌱 Población de Datos (Seeding)

Para llenar la base de datos con datos de prueba iniciales (usuarios, roles, procesos, etc.), utiliza el siguiente comando:

```bash
npm run seed -- src/database/seed-1/initial.seeder.ts
```

> [!IMPORTANT]
> El seeder realiza un `TRUNCATE CASCADE` de todas las tablas antes de insertar los datos para evitar duplicados. Ten cuidado si tienes datos reales.

### 👥 Usuarios de Prueba

El seeder genera 10 usuarios de prueba con el formato `user1`, `user2`, ... hasta `user10`.

- **Contraseña para todos los usuarios**: `password123`
- **Formato de Usuario**: `userX` (ej: `user1`)
- **Correo**: `userX@mpp.com`

| Usuario | Rol Asignado | Correo |
| :--- | :--- | :--- |
| **user1** | Super admin | user1@mpp.com |
| **user2** | Consultor | user2@mpp.com |
| **user3** | Elaborador | user3@mpp.com |
| **user4** | Validador de Planificación | user4@mpp.com |
| **user5** | Validador Técnico | user5@mpp.com |
| **user6** | Super admin | user6@mpp.com |
| **user7** | Consultor | user7@mpp.com |
| **user8** | Elaborador | user8@mpp.com |
| **user9** | Validador de Planificación | user9@mpp.com |
| **user10** | Validador Técnico | user10@mpp.com |

> El catálogo operativo son 5 roles (Consultor, Elaborador, Validador de Planificación, Validador Técnico, Super admin). Los usuarios `user6`–`user10` ciclan el mismo catálogo.

Para solo seguridad (idempotente, sin truncar):

```bash
npm run seed -- src/database/seed-3/admin-seguridad.seeder.ts
```

- **admin** / **Admin123!** → rol **Super admin**

## 🚀 Ejecución del Proyecto

```bash
# Modo desarrollo con watch (recomendado)
$ npm run start:dev

# Modo producción
$ npm run start:prod

# Modo debug
$ npm run start:debug
```

## 📖 Documentación de la API (Swagger)

Una vez que el servidor esté corriendo, puedes acceder a la documentación interactiva de la API en:

🔗 **[http://localhost:3000/api](http://localhost:3000/api)**

Desde aquí podrás probar todos los endpoints disponibles, incluyendo los que requieren autenticación mediante JWT (usa el botón "Authorize" con tu token).

## 🧪 Pruebas (Testing)

```bash
# Unit tests
$ npm run test

# E2E tests
$ npm run test:e2e

# Test coverage
$ npm run test:cov
```

---
Hecho con ❤️ para el sistema MPP.

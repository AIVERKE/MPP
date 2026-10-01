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

Para crear 3 procedimientos de ejemplo completos (matriz con varios cargos, figuras, decisiones SI/NO e Información Complementaria), reutilizando las unidades y cargos del MOF ya sincronizados. Es idempotente: regenera solo los procedimientos `PRC-DEMO-001..003` y sus procesos `PROC-DEMO-01..03`.

```bash
npm run seed -- src/database/seed-4/procedimientos-demo.seeder.ts
```

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

## 🔒 Despliegue con HTTPS

En producción el frontend se sirve desde `https://mpp-smau.fcpn.edu.bo` (Apache, puerto 443) y llama directamente al backend en `https://mpp-smau.fcpn.edu.bo:3000`. Por eso Nest debe servir HTTPS con el certificado de Let's Encrypt: si respondiera en HTTP, el navegador bloquearía las llamadas.

Nest activa HTTPS cuando están definidas `HTTPS_KEY_PATH` y `HTTPS_CERT_PATH`. Si las dos están vacías, levanta HTTP (desarrollo local). Si solo hay una, o no puede leer los archivos, el backend no arranca y muestra el error.

1. **Ubicar el certificado.** El nombre de la carpeta en `/etc/letsencrypt/live/` puede variar (en MOF es `fcpn.edu.bo-0002`), así que hay que revisarlo con:
   ```bash
   sudo certbot certificates
   ```
   Usar `privkey.pem` y `fullchain.pem`, no `cert.pem`.

2. **Configurar el `.env` de producción:**
   ```env
   NODE_ENV=production
   PORT=3000
   HTTPS_KEY_PATH=/etc/letsencrypt/live/mpp-smau.fcpn.edu.bo/privkey.pem
   HTTPS_CERT_PATH=/etc/letsencrypt/live/mpp-smau.fcpn.edu.bo/fullchain.pem
   CORS_ORIGIN=https://mpp-smau.fcpn.edu.bo
   ```
   Con `NODE_ENV=production`, `CORS_ORIGIN` es obligatorio y no puede ser `*`.

3. **Arrancar con PM2 como root.** Los archivos de `/etc/letsencrypt/live/` solo los puede leer root:
   ```bash
   npm run build
   sudo pm2 start dist/main.js --name mpp-backend
   sudo pm2 save
   ```

4. **Renovación del certificado.** Nest carga el certificado solo al arrancar. Cuando certbot lo renueve (cada ~90 días), reiniciar:
   ```bash
   sudo pm2 restart mpp-backend
   ```

Para comprobarlo: `curl https://mpp-smau.fcpn.edu.bo:3000/api` debe responder `200` sin errores de certificado.

## 🔗 Conexión con el MOF

MPP obtiene las unidades y los cargos del organigrama desde el MOF desplegado en [https://mof-smau.fcpn.edu.bo/](https://mof-smau.fcpn.edu.bo/). Esa URL es el frontend del MOF; el backend de MPP se conecta a su API, que escucha en el puerto `3000` del mismo dominio.

La conexión va de servidor a servidor: MPP no inicia sesión en el MOF, sino que envía un token de servicio en el header `X-Api-Key`. El token nunca debe llegar al navegador ni al frontend de MPP.

### 1. Obtener el token

El token lo define quien administra el MOF, en la variable `MPP_SERVICE_TOKEN` del `.env` de su backend. En producción debe tener al menos 32 caracteres; se puede generar con:

```bash
openssl rand -base64 48
```

MPP debe usar exactamente el mismo valor.

### 2. Configurar el `.env` de MPP

```env
MOF_API_URL=https://mof-smau.fcpn.edu.bo:3000
MOF_SERVICE_TOKEN=<mismo valor que MPP_SERVICE_TOKEN en el MOF>
MOF_TLS_REJECT_UNAUTHORIZED=false
```

- `MOF_API_URL` es la URL base de la API del MOF, **con** el puerto `:3000` y **sin** barra final. No usar `https://mof-smau.fcpn.edu.bo/` (sin puerto), porque ahí responde el frontend.
- `MOF_TLS_REJECT_UNAUTHORIZED=false` evita el error `UNABLE_TO_VERIFY_LEAF_SIGNATURE` cuando el MOF no envía el certificado intermedio. La solución correcta a medio plazo es que el MOF sirva el `fullchain`.
- Después de cambiar estas variables hay que reiniciar el backend (con PM2: `sudo pm2 restart mpp-backend --update-env`).

### 3. Verificar la conexión

Desde la máquina donde corre MPP, comprobar que el MOF responde con el token:

```bash
curl -H "X-Api-Key: $MOF_SERVICE_TOKEN" \
  https://mof-smau.fcpn.edu.bo:3000/api/v1/integraciones/mpp/unidades
```

Debe devolver `{ "data": [ ... ] }` con la lista de unidades. Un `401 UNAUTHORIZED` significa que el token falta o no coincide con el del MOF. Si no hay respuesta, el puerto `3000` del MOF no es accesible desde este servidor.

Luego, con MPP en marcha:

```bash
# Estado de la conexión
curl http://localhost:3000/mof/health

# Sincronizar unidades (primero)
curl -X POST http://localhost:3000/mof/sync

# Sincronizar cargos (requiere unidades ya sincronizadas)
curl -X POST http://localhost:3000/mof/cargos/sync

# Última sincronización y URL usada (nunca muestra el token)
curl http://localhost:3000/mof/status
```

Si el backend de MPP sirve HTTPS, cambiar `http://localhost:3000` por su URL real.

### Rutas del MOF que usa MPP

| Ruta | Uso |
|------|-----|
| `GET /api/v1/integraciones/mpp/unidades` | Unidades del organigrama (`id`, `nombre`, `codigo`, `nivel`, `tipo`) |
| `GET /api/v1/integraciones/mpp/unidades/:id/personal` | Cargos de una unidad (`id` del cargo, `descripcion`, `detalle`) |

Para el organigrama del frontend, MPP también lee con el mismo token (todas de solo lectura):

| Ruta del MOF | Ruta de MPP que la expone al frontend |
|--------------|---------------------------------------|
| `GET /api/v1/integraciones/mpp/unidades` | `GET /mof/unidades` |
| `GET /api/v1/integraciones/mpp/unidades/:id` | `GET /mof/unidades/:id` (detalle con funciones y dependencias funcionales) |
| `GET /api/v1/integraciones/mpp/unidades/:id/personal` | `GET /mof/unidades/:id/personal` |
| `GET /api/v1/integraciones/mpp/unidades/:id/pdf` | `GET /mof/unidades/:id/pdf` |
| `GET /api/v1/integraciones/mpp/cargos` | `GET /mof/cargos-catalogo` |
| `GET /api/v1/integraciones/mpp/catalogos/{tipos,niveles,relaciones,clases}` | `GET /mof/catalogos/{tipos,niveles,relaciones,clases}` |

El frontend nunca llama al MOF directamente ni conoce el token. Si el MOF no responde, estas rutas devuelven `502 Bad Gateway`; si la unidad no existe, `404`. El token solo abre las rutas de `/api/v1/integraciones/mpp`; el resto de la API del MOF exige JWT, por eso el organigrama de MPP es de solo lectura.

### Sincronización automática

- Con `NODE_ENV=production`, MPP sincroniza las unidades al arrancar. Si el MOF no responde, el error queda en el log (`sudo pm2 logs mpp-backend`) y el backend arranca igual.
- Todos los días a medianoche se vuelven a sincronizar las unidades.
- Los cargos se sincronizan solo a pedido, con `POST /mof/cargos/sync`.
- Para rotar el token, cambiarlo en el MOF y en MPP y reiniciar los dos backends.

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

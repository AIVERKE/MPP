# Cliente MPP - Manual de Procesos y Procedimientos (Frontend)

Este proyecto es el cliente web para la gestión y diseño de manuales de procesos y procedimientos. Está construido como un sistema dinámico y reactivo, diseñado para ser resiliente ante los cambios en la estructura de datos del backend.

---

## 🚀 Guía de Instalación (Paso a Paso)

### 0. Requisito Fundamental
Este sistema es un cliente que consume datos. **Debes tener el Backend corriendo** (normalmente en el puerto `3000`) para que la interfaz muestre datos y permita guardar.

### 1. Requisitos Técnicos
- **Node.js:** Versión 18 o superior (puedes verificar con `node -v`).
- **Navegador:** Chrome, Edge o Firefox (versiones actualizadas).
- **Opcional Docker:** Docker + Compose v2 si quieres levantar todo el proyecto con contenedores.

### Levantar con Docker (stack completo)
Desde la raíz del repositorio:

```bash
docker compose up --build
```

Luego abre:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

### 2. Pasos para iniciar

1.  **Entrar a la carpeta del proyecto:**
    ```bash
    cd proyecto-MPP
    ```
2.  **Instalar las dependencias (Librerías):**
    ```bash
    npm install
    ```
    *Esto creará la carpeta `node_modules`. Solo se hace la primera vez.*

3.  **Configuración de la API (Backend):**
    Por defecto, el sistema apunta a `http://localhost:3000`. Si tu backend usa otro puerto, debes actualizar las constantes `BASE_URL` en el archivo:
    `src/stores/mpp_core.js`

4.  **Iniciar el sistema:**
    ```bash
    npm run dev
    ```
5.  **Abrir el navegador:**
    Ve a la dirección que te indique la terminal (usualmente `http://localhost:5173`).

---

## 🏗️ Arquitectura y Tecnologías

El frontend utiliza un stack moderno y reactivo:

- **Vue 3 (Composition API):** Framework principal para la lógica de componentes.
- **Vuetify 3:** Librería de componentes UI para una interfaz limpia y profesional.
- **Pinia:** Gestión de estado global (Store) para la persistencia y sincronización de datos.
- **VueFlow:** Motor gráfico utilizado en el **Diseñador de Matriz** para la creación de diagramas de flujo.
- **Axios:** Cliente HTTP para la comunicación con el API.

---

## 💡 Características Principales

1.  **Motor CRUD Dinámico:** La interfaz no está estática; se adapta automáticamente a los metadatos y entidades recibidas del servidor (Estrategia Chameleon).
2.  **Persistencia Transparente:** Implementa un sistema de **Auto-Guardado (Debounce)** por fila. Los cambios se sincronizan físicamente en la base de datos tras breves pausas del usuario.
3.  **Diseñador de Matriz Modular:** El componente `DisenadorMatriz.vue` permite la creación visual de flujos con detección inteligente de formas basadas en el contexto de la acción.
4.  **Sincronización de Datos Cruzados:** Capacidad de reconstrucción de datos (Deep Stitching) para asegurar que Riesgos, Controles y Tareas se mantengan íntegros tras refrescar la página.

---

## 🛠️ Comandos de Desarrollo

| Comando           | Descripción                                                            |
| :---------------- | :--------------------------------------------------------------------- |
| `npm run dev`     | Inicia el servidor de desarrollo (Modo edición en vivo).               |
| `npm run build`   | Prepara el sistema para ser subido a un servidor real.                 |
| `npm run preview` | Prueba la versión final antes de subirla.                              |

### Ejecución manual (sin Docker)

1. Levanta el backend primero (`backend/README.md`).
2. En `frontend/` ejecuta:

```bash
npm install
npm run dev
```

---

## ⚠️ Notas de Integridad
- **Persistencia Física:** El sistema no usa almacenamiento temporal en el navegador; todo se envía mediante orquestación de APIs a la base de datos SQL del backend.
- **IDs Institucionales:** El sistema valida que cada operación esté vinculada a un proceso y procedimiento legalmente registrado.

---

## ⚖️ Licencia
Este proyecto es de uso interno y confidencial del TIC FCPN.
By TuGfaNat ☝🏻🤓 y Gemini CLI 🤖

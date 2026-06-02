<!-- 
 Create by: Jesus Reynaldo Perez Benavides 
 phone: +591 73030203
 mail: jperezbenavides@gmail.com
 -->
<script setup>
import { ref } from "vue";
import { useAuthStore } from "../../stores/auth";

const authStore = useAuthStore();
const drawer = ref(true);
const sidebarWidth = ref(260);
const isResizing = ref(false);

const handleLogout = () => {
  authStore.logout();
};

const startResizing = () => {
  isResizing.value = true;
  document.addEventListener("mousemove", handleMouseMove);
  document.addEventListener("mouseup", stopResizing);
};

const handleMouseMove = (e) => {
  if (isResizing.value) {
    const newWidth = e.clientX;
    if (newWidth > 200 && newWidth < 500) {
      sidebarWidth.value = newWidth;
    }
  }
};

const stopResizing = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", handleMouseMove);
  document.removeEventListener("mouseup", stopResizing);
};
</script>
<template>
  <v-app>
    <!-- Barra superior -->
    <!-- <v-app-bar color="primary" elevation="1"> -->
    <v-app-bar height="70">
      <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <v-icon color="primary" size="32" class="mr-2"
          >mdi-view-dashboard</v-icon
        >
        S-MAU
      </v-app-bar-title>
      <v-spacer></v-spacer>

      <!-- Nuevo iconos a la derecha -->
      <v-btn icon variant="text" class="mr-2">
        <v-icon>mdi-theme-light-dark</v-icon>
      </v-btn>

      <v-badge color="error" content="45" class="mr-2">
        <v-btn icon variant="text">
          <v-icon>mdi-bell</v-icon>
        </v-btn>
      </v-badge>

      <!-- Menú de usuario -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props">
            <v-icon>mdi-account-circle</v-icon>
          </v-btn>
          <!-- <v-avatar v-bind="props" color="primary" size="40" class="ml-2">
                        <span class="text-white font-weight-bold">MU</span>
                    </v-avatar> -->
        </template>
        <v-list>
          <v-list-item title="Mi Perfil"></v-list-item>
          <v-list-item title="Configuración"></v-list-item>
          <v-divider></v-divider>
          <v-list-item title="Cerrar Sesión" class="text-error" @click="handleLogout"></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Sidebar de navegación -->
    <v-navigation-drawer v-model="drawer" app :width="sidebarWidth">
      <div class="pa-2">
        <div class="sidebar-section-title">Menú</div>
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            to="/"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-account-multiple"
            title="Usuarios"
            to="/usuarios"
          ></v-list-item>
          <v-list-group
            class="no-indent"
            prepend-icon="mdi-package-variant"
            value="MPP"
          >
            <template #activator="{ props }">
              <v-list-item v-bind="props" title="MPP"></v-list-item>
            </template>

            <v-list-item
              prepend-icon="mdi-list-box"
              title="Listar Unidades"
              to="/mpp/listar-unidades"
            >
            </v-list-item>

            <v-list-item
              prepend-icon="mdi-tree"
              title="Arbol Unidades"
              to="/mpp/arbol-unidades"
            ></v-list-item>

            <v-list-item
              prepend-icon="mdi-sitemap"
              title="Arquitectura de Procesos"
              to="/mpp/gestion-mpp"
            ></v-list-item>

            <v-list-item
              prepend-icon="mdi-vector-polyline"
              title="Diseñador de Flujos"
              to="/mpp/diagrama-flujos"
              class="text-primary font-weight-bold"
            ></v-list-item>

            </v-list-group>
          
          <v-list-item
            prepend-icon="mdi-cog"
            title="Configuración"
            to="/configuracion"
          ></v-list-item>
        </v-list>
        <!-- Sección APPS -->
        <div class="sidebar-section-title">Sección</div>
      </div>

      <!-- Resize Handle -->
      <div
        class="resize-handle"
        @mousedown.stop="startResizing"
      ></div>

      <!-- Usuario en el footer -->

      <template v-slot:append>
        <v-divider></v-divider>
        <div class="pa-4" style="border-top: 1px solid var(--color-border)">
          <v-list-item class="px-2">
            <template v-slot:prepend>
              <v-avatar color="primary" size="40">
                <span class="text-white">{{ authStore.user?.name?.substring(0,2).toUpperCase() || 'US' }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium"
              >{{ authStore.user?.name || 'Usuario' }}</v-list-item-title
            >
            <v-list-item-subtitle class="text-caption"
              >Coordinador TIC</v-list-item-subtitle
            >
            <template v-slot:append>
              <v-icon @click="handleLogout" style="cursor: pointer;">mdi-power</v-icon>
            </template>
          </v-list-item>
        </div>
      </template>
    </v-navigation-drawer>

    <!-- Contenido principal -->
    <v-main>
      <v-container fluid class="pa-6">
        <router-view />
      </v-container>
    </v-main>
  </v-app>
</template>
<style scoped>
.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 10;
  transition: background-color 0.2s;
}
.resize-handle:hover {
  background-color: rgba(var(--v-theme-primary), 0.3);
}
</style>


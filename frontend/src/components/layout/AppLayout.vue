<!-- 
 Create by: Jesus Reynaldo Perez Benavides 
 phone: +591 73030203
 mail: jperezbenavides@gmail.com
 -->
<script setup>
import { ref, computed, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useTheme, useDisplay } from "vuetify";

const route = useRoute();
const router = useRouter();
const theme = useTheme();
const { smAndDown } = useDisplay();
const drawer = ref(true);
const authStore = useAuthStore();
const isSoloConsultor = computed(() => authStore.isSoloConsultor);
const canEditMpp = computed(() => authStore.canEditMpp);
const isSuperAdmin = computed(() => authStore.hasRole('Super admin'));

const toggleTheme = () => {
  theme.global.name.value = theme.global.current.value.dark ? "light" : "dark";
};

// --- Lógica de Redimensionamiento ---
const drawerWidth = ref(260);
const isResizing = ref(false);

const startResizing = () => {
  isResizing.value = true;
  document.addEventListener("mousemove", resize);
  document.addEventListener("mouseup", stopResizing);
  document.body.style.cursor = "col-resize";
  document.body.style.userSelect = "none";
};

const resize = (e) => {
  if (isResizing.value) {
    const newWidth = e.clientX;
    if (newWidth > 200 && newWidth < 600) {
      drawerWidth.value = newWidth;
    }
  }
};

const stopResizing = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", resize);
  document.removeEventListener("mouseup", stopResizing);
  document.body.style.cursor = "default";
  document.body.style.userSelect = "auto";
};

// --- Soporte Táctil (Móviles / Tablets) ---
const startResizingTouch = () => {
  isResizing.value = true;
  document.addEventListener("touchmove", resizeTouch);
  document.addEventListener("touchend", stopResizingTouch);
  document.body.style.userSelect = "none";
};

const resizeTouch = (e) => {
  if (isResizing.value && e.touches.length > 0) {
    const newWidth = e.touches[0].clientX;
    if (newWidth > 200 && newWidth < 600) {
      drawerWidth.value = newWidth;
    }
  }
};

const stopResizingTouch = () => {
  isResizing.value = false;
  document.removeEventListener("touchmove", resizeTouch);
  document.removeEventListener("touchend", stopResizingTouch);
  document.body.style.userSelect = "auto";
};

const actualDrawerWidth = computed(() => {
  if (typeof window !== "undefined") {
    return Math.min(drawerWidth.value, window.innerWidth);
  }
  return drawerWidth.value;
});

onUnmounted(() => {
  stopResizing();
  stopResizingTouch();
});
// ------------------------------------

const isLoginPage = computed(() => route.path === "/login");
const isMofActive = computed(() => route.path.startsWith("/mof"));
const isMppActive = computed(() => route.path.startsWith("/mpp") || route.path === "/configuracion");
const userName = computed(() => authStore.user?.nombre || "Usuario");
const userInitials = computed(() => {
  const name = authStore.user?.nombre || "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
});

const handleLogout = async () => {
  authStore.logout();
  await router.push("/login");
};
</script>
<template>
  <v-app style="height: 100vh; overflow: hidden;">
    <!-- Barra superior -->
    <v-app-bar v-if="!isLoginPage" height="70" style="position: fixed; top: 0; z-index: 1005;">
      <v-app-bar-nav-icon v-if="!smAndDown" @click="drawer = !drawer"></v-app-bar-nav-icon>
      <v-app-bar-title>
        <v-icon color="primary" size="32" class="mr-2"
          >mdi-file-document-multiple</v-icon
        >
        MPP
      </v-app-bar-title>
      <v-spacer></v-spacer>

      <!-- Icono de Tema (Dark/Light) -->
      <v-btn icon variant="text" class="mr-2" @click="toggleTheme">
        <v-icon>{{
          theme.global.current.value.dark
            ? "mdi-weather-sunny"
            : "mdi-weather-night"
        }}</v-icon>
        <v-tooltip activator="parent" location="bottom">
          Cambiar a modo
          {{ theme.global.current.value.dark ? "claro" : "oscuro" }}
        </v-tooltip>
      </v-btn>

      <!-- Menú de usuario con iniciales -->
      <v-menu>
        <template v-slot:activator="{ props }">
          <v-btn icon v-bind="props" class="ml-2">
            <v-avatar color="primary" size="32">
              <span class="text-white text-caption">{{ userInitials }}</span>
            </v-avatar>
            <v-tooltip activator="parent" location="bottom"
              >Perfil de {{ userName }}</v-tooltip
            >
          </v-btn>
        </template>
        <v-list density="compact" min-width="150">
          <v-list-item
            prepend-icon="mdi-account"
            title="Mi Perfil"
            value="profile"
          ></v-list-item>
          <v-list-item
            v-if="!isSoloConsultor"
            prepend-icon="mdi-cog"
            title="Configuración"
            value="settings"
            to="/configuracion"
          ></v-list-item>
          <v-divider></v-divider>
          <v-list-item
            prepend-icon="mdi-logout"
            title="Cerrar Sesión"
            class="text-error"
            @click="handleLogout"
          ></v-list-item>
        </v-list>
      </v-menu>
    </v-app-bar>

    <!-- Sidebar de navegación Fijo (solo en desktop) -->
    <v-navigation-drawer
      v-if="!isLoginPage && !smAndDown"
      v-model="drawer"
      app
      :width="actualDrawerWidth"
      class="resizable-drawer"
    >
      <div class="pa-2 overflow-y-auto flex-grow-1">
        <div class="sidebar-section-title">Menú</div>
        <v-list density="compact" nav>
          <v-list-item
            prepend-icon="mdi-view-dashboard"
            title="Dashboard"
            to="/"
          ></v-list-item>
          <v-list-item
            v-if="isSuperAdmin"
            prepend-icon="mdi-account-multiple"
            title="Usuarios"
            to="/usuarios"
          ></v-list-item>
          <v-list-group
            v-if="!isSoloConsultor"
            class="no-indent"
            prepend-icon="mdi-package-variant"
            value="MOF"
          >
            <template #activator="{ props }">
              <v-list-item v-bind="props" title="MOF"></v-list-item>
            </template>
            <v-list-item
              prepend-icon="mdi-sitemap"
              title="ESTRUCTURA ORGANIZACIONAL"
              to="/mof/organigrama-unidades"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-list-box"
              title="LISTAR UNIDADES"
              to="/mof/listar-unidades"
            >
            </v-list-item>

            <v-list-item
              prepend-icon="mdi-tree"
              title="ARBOL DE UNIDADES"
              to="/mof/arbol-unidades"
            ></v-list-item>
          </v-list-group>

          <v-list-group
            class="no-indent"
            prepend-icon="mdi-package-variant"
            value="MPP"
          >
            <template #activator="{ props }">
              <v-list-item v-bind="props" title="MPP"></v-list-item>
            </template>
            <v-list-item
              v-if="canEditMpp"
              prepend-icon="mdi-sitemap"
              title="GENERADOR DE PROCESOS Y PROCEDIMIENTOS"
              to="/mpp/gestion-mpp"
            ></v-list-item>
            <v-list-item
              prepend-icon="mdi-history"
              title="HISTORIAL Y RELACIONES"
              to="/mpp/historial-mpp"
            ></v-list-item>
            <v-list-item
              v-if="!isSoloConsultor"
              prepend-icon="mdi-cog"
              title="CONFIGURACIÓN DE FIGURAS"
              to="/configuracion"
            ></v-list-item>
          </v-list-group>
          <v-list-item
            v-if="!isSoloConsultor"
            prepend-icon="mdi-shield-account-outline"
            title="Auditoría del Sistema"
            to="/auditoria"
          ></v-list-item>
        </v-list>
        <div class="sidebar-section-title">Sección</div>
      </div>

      <template v-slot:append>
        <v-divider></v-divider>
        <div class="pa-4 bg-surface" style="border-top: 1px solid var(--color-border)">
          <v-list-item
            class="px-2"
            @click="handleLogout"
            style="cursor: pointer"
          >
            <template v-slot:prepend>
              <v-avatar color="primary" size="40">
                <span class="text-white">{{ userInitials }}</span>
              </v-avatar>
            </template>
            <v-list-item-title class="font-weight-medium">{{
              userName
            }}</v-list-item-title>
            <v-list-item-subtitle class="text-caption">{{
              authStore.user?.rol || "Usuario"
            }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-icon color="error">mdi-power</v-icon>
            </template>
          </v-list-item>
        </div>
      </template>

      <!-- Manejador para redimensionar -->
      <div
        class="resize-handle"
        @mousedown="startResizing"
        @touchstart="startResizingTouch"
      ></div>
    </v-navigation-drawer>

    <!-- Contenido principal con Scroll Independiente -->
    <v-main
      :style="{
        paddingTop: '70px',
        paddingBottom: smAndDown ? '64px' : '0px',
        height: '100vh',
        overflowY: 'auto',
        overflowX: 'hidden'
      }"
    >
      <v-container
        fluid
        :class="isLoginPage ? 'pa-0' : 'pa-6'"
        style="min-height: calc(100vh - 70px); max-width: 100%; overflow-x: hidden;"
      >
        <router-view />
      </v-container>
    </v-main>

    <!-- Bottom Navigation Mobile (Estilo Instagram con Submenús Flotantes) -->
    <v-bottom-navigation
      v-if="!isLoginPage && smAndDown"
      active
      grow
      color="primary"
      class="instagram-bottom-nav"
      elevation="6"
    >
      <v-btn to="/" value="dashboard">
        <v-icon size="24">mdi-view-dashboard</v-icon>
        <span class="text-caption font-weight-medium">Dashboard</span>
      </v-btn>

      <v-btn v-if="isSuperAdmin" to="/usuarios" value="usuarios">
        <v-icon size="24">mdi-account-multiple</v-icon>
        <span class="text-caption font-weight-medium">Usuarios</span>
      </v-btn>

      <!-- Pop-up desplegable para MOF -->
      <v-menu v-if="!isSoloConsultor" location="top" offset="12">
        <template #activator="{ props }">
          <v-btn v-bind="props" value="mof" :color="isMofActive ? 'primary' : undefined">
            <v-icon size="24">mdi-package-variant</v-icon>
            <span class="text-caption font-weight-medium">MOF</span>
          </v-btn>
        </template>
        <v-list density="compact" rounded="lg" class="elevation-8 py-2" min-width="230">
          <v-list-subheader class="font-weight-bold text-uppercase text-primary text-caption px-4">
            Módulo MOF
          </v-list-subheader>
          <v-list-item
            prepend-icon="mdi-sitemap"
            title="Estructura Organizacional"
            to="/mof/organigrama-unidades"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-list-box"
            title="Listar Unidades"
            to="/mof/listar-unidades"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-tree"
            title="Árbol de Unidades"
            to="/mof/arbol-unidades"
          ></v-list-item>
        </v-list>
      </v-menu>

      <!-- Pop-up desplegable para MPP -->
      <v-menu location="top" offset="12">
        <template #activator="{ props }">
          <v-btn v-bind="props" value="mpp" :color="isMppActive ? 'primary' : undefined">
            <v-icon size="24">mdi-file-document-multiple</v-icon>
            <span class="text-caption font-weight-medium">MPP</span>
          </v-btn>
        </template>
        <v-list density="compact" rounded="lg" class="elevation-8 py-2" min-width="250">
          <v-list-subheader class="font-weight-bold text-uppercase text-primary text-caption px-4">
            Módulo MPP
          </v-list-subheader>
          <v-list-item
            v-if="canEditMpp"
            prepend-icon="mdi-sitemap"
            title="Generador de Procesos"
            to="/mpp/gestion-mpp"
          ></v-list-item>
          <v-list-item
            prepend-icon="mdi-history"
            title="Historial y Relaciones"
            to="/mpp/historial-mpp"
          ></v-list-item>
          <v-list-item
            v-if="!isSoloConsultor"
            prepend-icon="mdi-cog"
            title="Configuración de Figuras"
            to="/configuracion"
          ></v-list-item>
        </v-list>
      </v-menu>

      <v-btn v-if="!isSoloConsultor" to="/auditoria" value="auditoria">
        <v-icon size="24">mdi-shield-account-outline</v-icon>
        <span class="text-caption font-weight-medium">Auditoría</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>
<style scoped>
.resizable-drawer {
  position: fixed !important;
  top: 70px !important;
  height: calc(100vh - 70px) !important;
  z-index: 1004;
  display: flex !important;
  flex-direction: column !important;
  justify-content: space-between !important;
  transition: none !important;
}

.resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  width: 4px;
  height: 100%;
  cursor: col-resize;
  z-index: 100;
  background: transparent;
  transition: background 0.2s;
}

.resize-handle:hover,
.resize-handle:active {
  background: rgba(var(--v-theme-primary), 0.3);
  width: 6px;
}

.instagram-bottom-nav {
  position: fixed !important;
  bottom: 0 !important;
  left: 0 !important;
  right: 0 !important;
  z-index: 1005;
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05) !important;
}
</style>

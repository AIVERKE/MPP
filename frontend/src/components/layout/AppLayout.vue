<!-- 
 Create by: Jesus Reynaldo Perez Benavides 
 phone: +591 73030203
 mail: jperezbenavides@gmail.com
 -->
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";
import { useTheme, useDisplay } from "vuetify";
import { useThemeStore } from "@/stores/theme";

const route = useRoute();
const router = useRouter();
const theme = useTheme();
const authStore = useAuthStore();
const themeStore = useThemeStore();
const { mdAndDown, smAndDown } = useDisplay();

const isSoloConsultor = computed(() => authStore.isSoloConsultor);
const canEditMpp = computed(() => authStore.canEditMpp);
const isSuperAdmin = computed(() => authStore.hasRole('Super admin'));

// En móvil y tablet (mdAndDown) inicia colapsado, en desktop abierto
const drawer = ref(!mdAndDown.value);

watch(mdAndDown, (val) => {
  if (val) drawer.value = false;
});

onMounted(() => {
  if (themeStore.currentTheme && theme?.global) {
    theme.global.name.value = themeStore.currentTheme;
  }
});

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

const isLoginPage = computed(() => route.path === "/login");
const userName = computed(() => {
  const raw = authStore.user?.nombre || authStore.user?.username || "Usuario";
  if (raw.includes("@")) {
    const prefix = raw.split("@")[0];
    return prefix.toLowerCase() === "admin"
      ? "Administrador"
      : prefix.charAt(0).toUpperCase() + prefix.slice(1);
  }
  if (/^user\d+$/i.test(raw)) {
    return `Usuario ${raw.replace(/\D/g, "")}`;
  }
  if (raw.toLowerCase() === "admin") {
    return "Administrador";
  }
  return raw;
});

const userRole = computed(() => {
  if (authStore.user?.roles && authStore.user.roles.length) {
    return authStore.user.roles.join(", ");
  }
  return authStore.user?.rol || "Usuario";
});

const userInitials = computed(() => {
  const name = userName.value || "U";
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
  <v-app>
    <!-- Barra superior -->
    <v-app-bar v-if="!isLoginPage" height="70" role="banner" aria-label="Barra de herramientas superior">
      <v-app-bar-nav-icon
        aria-label="Alternar menú lateral"
        @click="drawer = !drawer"
      ></v-app-bar-nav-icon>
      <v-app-bar-title>
        <v-icon color="primary" size="32" class="mr-2"
          >mdi-file-document-multiple</v-icon
        >
        MPP
      </v-app-bar-title>
      <v-spacer></v-spacer>

      <!-- Menú Selector de 5 Temas y Accesibilidad Daltónica -->
      <v-menu location="bottom end" transition="scale-transition">
        <template v-slot:activator="{ props }">
          <v-btn
            icon
            variant="text"
            v-bind="props"
            class="mr-2"
            aria-label="Seleccionar tema visual y accesibilidad"
          >
            <v-icon :color="themeStore.isColorblind ? 'warning' : 'primary'">
              {{ themeStore.activeThemeInfo.icon }}
            </v-icon>
            <v-tooltip activator="parent" location="bottom">
              Tema: {{ themeStore.activeThemeInfo.name }}
            </v-tooltip>
          </v-btn>
        </template>
        <v-list density="compact" elevation="4" class="rounded-lg py-1" min-width="230" role="menu">
          <v-list-subheader class="font-weight-black text-uppercase text-caption">
            Temas y Accesibilidad
          </v-list-subheader>
          <v-list-item
            v-for="t in themeStore.themeList"
            :key="t.id"
            :value="t.id"
            :class="{ 'bg-primary-lighten-5 font-weight-bold text-primary': themeStore.currentTheme === t.id }"
            class="cursor-pointer"
            role="menuitem"
            @click="themeStore.setTheme(t.id, theme)"
          >
            <template v-slot:prepend>
              <v-icon :color="themeStore.currentTheme === t.id ? 'primary' : 'grey-darken-1'" class="mr-2">
                {{ t.icon }}
              </v-icon>
            </template>
            <v-list-item-title class="font-weight-bold text-caption">
              {{ t.name }}
            </v-list-item-title>
            <v-list-item-subtitle style="font-size: 10px;">
              {{ t.desc }}
            </v-list-item-subtitle>
            <template v-slot:append v-if="themeStore.currentTheme === t.id">
              <v-icon color="primary" size="16">mdi-check</v-icon>
            </template>
          </v-list-item>
        </v-list>
      </v-menu>

      <!-- Notificaciones -->
      <v-btn icon variant="text" class="mr-2" aria-label="Notificaciones">
        <v-icon>mdi-bell-outline</v-icon>
        <v-tooltip activator="parent" location="bottom"
          >Notificaciones</v-tooltip
        >
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

    <!-- Sidebar de navegación -->
    <v-navigation-drawer
      v-if="!isLoginPage"
      v-model="drawer"
      app
      :temporary="mdAndDown"
      :permanent="!mdAndDown"
      :width="mdAndDown ? Math.min(280, actualDrawerWidth) : actualDrawerWidth"
      class="resizable-drawer"
    >
      <div class="pa-2">
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
      </div>

      <template v-slot:append>
        <div class="pa-4">
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
              userRole
            }}</v-list-item-subtitle>
            <template v-slot:append>
              <v-icon color="error">mdi-power</v-icon>
            </template>
          </v-list-item>
        </div>
      </template>

      <!-- Manejador para redimensionar (solo en escritorio) -->
      <div
        v-if="!mdAndDown"
        class="resize-handle"
        @mousedown="startResizing"
        @touchstart="startResizingTouch"
      ></div>
    </v-navigation-drawer>

    <!-- Contenido principal -->
    <v-main>
      <v-container
        fluid
        :class="isLoginPage ? 'pa-0' : 'pa-6'"
        :style="smAndDown && !isLoginPage ? 'padding-bottom: 76px !important;' : ''"
        class="fill-height"
      >
        <router-view />
      </v-container>
    </v-main>

    <!-- Barra de navegación inferior táctil para dispositivos móviles (xs/sm) -->
    <v-bottom-navigation
      v-if="smAndDown && !isLoginPage"
      grow
      fixed
      color="primary"
      elevation="8"
      class="border-t"
      density="comfortable"
    >
      <v-btn to="/" value="dashboard">
        <v-icon size="20">mdi-view-dashboard</v-icon>
        <span style="font-size: 10px;">Inicio</span>
      </v-btn>
      <v-btn v-if="isSuperAdmin" to="/usuarios" value="usuarios">
        <v-icon size="20">mdi-account-multiple</v-icon>
        <span style="font-size: 10px;">Usuarios</span>
      </v-btn>
      <v-btn to="/mpp/gestion-mpp" value="mpp">
        <v-icon size="20">mdi-sitemap</v-icon>
        <span style="font-size: 10px;">MPP</span>
      </v-btn>
      <v-btn to="/mpp/historial-mpp" value="historial">
        <v-icon size="20">mdi-history</v-icon>
        <span style="font-size: 10px;">Historial</span>
      </v-btn>
    </v-bottom-navigation>
  </v-app>
</template>

<style scoped>
.resizable-drawer {
  position: relative;
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
</style>

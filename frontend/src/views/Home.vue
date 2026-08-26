<script setup>
import { ref, onMounted, computed, watch } from "vue";
import { useRouter } from "vue-router";
import axios from "axios";
import { useAllUnidadesMofStore } from "@/stores/unidades_mof";
import { useAuthStore } from "@/stores/auth";
import { useMppCoreStore } from "@/stores/mpp_core";

const router = useRouter();
const unidadesStore = useAllUnidadesMofStore();
const authStore = useAuthStore();
const mppStore = useMppCoreStore();

const isSoloConsultor = computed(() => authStore.isSoloConsultor);
const PUBLICADOS = ["Aprobado", "Renovado"];

const statsData = ref({
  totalProcesos: 0,
  totalProcedimientos: 0,
  totalUsuarios: 0,
  totalUnidades: 0,
});

const loadingConsultor = ref(false);
const publicados = ref([]);
const searchQuery = ref("");
const filterUnidad = ref(null);
const filterProceso = ref(null);
const filterCategoria = ref(null);
const filterEstado = ref("Aprobado");
const favorites = ref([]);
const lastVisitIso = ref(null);
const avisosDismissed = ref(false);

const FAV_KEY = computed(
  () => `mpp_consultor_favorites_${authStore.user?.id || "anon"}`,
);
const VISIT_KEY = computed(
  () => `mpp_consultor_last_visit_${authStore.user?.id || "anon"}`,
);

function loadFavorites() {
  try {
    favorites.value = JSON.parse(localStorage.getItem(FAV_KEY.value) || "[]");
  } catch {
    favorites.value = [];
  }
}

function saveFavorites() {
  localStorage.setItem(FAV_KEY.value, JSON.stringify(favorites.value));
}

function toggleFavorite(id) {
  const n = Number(id);
  if (favorites.value.includes(n)) {
    favorites.value = favorites.value.filter((x) => x !== n);
  } else {
    favorites.value = [...favorites.value, n];
  }
  saveFavorites();
}

function isFavorite(id) {
  return favorites.value.includes(Number(id));
}

function touchLastVisit() {
  const prev = localStorage.getItem(VISIT_KEY.value);
  lastVisitIso.value = prev;
  localStorage.setItem(VISIT_KEY.value, new Date().toISOString());
}

const fetchStats = async () => {
  try {
    const response = await axios.get("http://localhost:3000/dashboard/stats", {
      headers: authStore.getAuthHeader(),
    });
    if (response.data) {
      statsData.value = response.data;
    }
  } catch (err) {
    console.error("Error al obtener estadísticas del dashboard:", err);
  }
};

const fetchPublicados = async () => {
  loadingConsultor.value = true;
  try {
    const params = {};
    if (searchQuery.value?.trim()) params.q = searchQuery.value.trim();
    if (filterUnidad.value != null) params.id_unidad = filterUnidad.value;
    if (filterCategoria.value) params.tipo_proceso = filterCategoria.value;
    const response = await axios.get(
      "http://localhost:3000/procesos/procedimientos",
      { headers: authStore.getAuthHeader(), params },
    );
    const list = response.data?.data || response.data || [];
    publicados.value = list.filter((p) =>
      PUBLICADOS.includes(p.estado_version),
    );
  } catch (err) {
    console.error("Error al cargar procedimientos publicados:", err);
    publicados.value = [];
  } finally {
    loadingConsultor.value = false;
  }
};

const fechaPublicacion = (p) => {
  const d = p.updatedAt || p.createdAt || p.updated_at || p.created_at;
  return d ? new Date(d) : null;
};

const formatFecha = (p) => {
  const d = fechaPublicacion(p);
  if (!d) return "—";
  return d.toLocaleDateString("es-BO", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const unidadResponsable = (p) => {
  const unidades = p.proceso?.unidades || [];
  if (unidades.length) return unidades.map((u) => u.nombre).join(", ");
  const inst = p.instalaciones || [];
  if (inst.length) return inst.map((u) => u.nombre).join(", ");
  return "—";
};

const filteredPublicados = computed(() => {
  let list = [...publicados.value];

  if (filterEstado.value && filterEstado.value !== "Todos") {
    list = list.filter((p) => p.estado_version === filterEstado.value);
  }

  if (filterProceso.value != null) {
    list = list.filter(
      (p) => Number(p.proceso?.id_proceso || p.id_proceso) === Number(filterProceso.value),
    );
  }

  const q = searchQuery.value?.trim().toLowerCase() || "";
  if (q) {
    list = list.filter((p) => {
      const haystack = [
        p.nombre,
        p.codigo,
        p.objetivos,
        p.alcance,
        p.proceso?.nombre,
        p.proceso?.codigo,
        p.proceso?.tipo_proceso,
        unidadResponsable(p),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }

  return list.sort((a, b) => {
    const da = fechaPublicacion(a)?.getTime() || 0;
    const db = fechaPublicacion(b)?.getTime() || 0;
    return db - da;
  });
});

const totalPublicados = computed(() =>
  publicados.value.filter((p) => PUBLICADOS.includes(p.estado_version)).length,
);

const actualizadosRecientes = computed(() => {
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  return publicados.value.filter((p) => {
    const d = fechaPublicacion(p);
    return d && d.getTime() >= since;
  }).length;
});

const proximosRevision = computed(() =>
  publicados.value.filter((p) => p.estado_version === "Renovado").length,
);

const modificadosDesdeVisita = computed(() => {
  if (!lastVisitIso.value) return filteredPublicados.value.slice(0, 8);
  const since = new Date(lastVisitIso.value).getTime();
  return filteredPublicados.value
    .filter((p) => {
      const d = fechaPublicacion(p);
      return d && d.getTime() > since;
    })
    .slice(0, 12);
});

const favoritosProcedimientos = computed(() =>
  filteredPublicados.value.filter((p) => isFavorite(p.id_procedimiento)),
);

const avisosNuevasVersiones = computed(() => {
  const since = Date.now() - 14 * 24 * 60 * 60 * 1000;
  return publicados.value
    .filter((p) => {
      const d = fechaPublicacion(p);
      return d && d.getTime() >= since && PUBLICADOS.includes(p.estado_version);
    })
    .slice(0, 5);
});

const unidadFilterItems = computed(() => {
  const items = [{ title: "Todas las unidades", value: null }];
  const seen = new Set();
  for (const p of publicados.value) {
    for (const u of p.proceso?.unidades || []) {
      if (!seen.has(u.id_unidad)) {
        seen.add(u.id_unidad);
        items.push({ title: u.nombre, value: u.id_unidad });
      }
    }
  }
  for (const u of mppStore.unidades || []) {
    if (!seen.has(u.id_unidad)) {
      seen.add(u.id_unidad);
      items.push({ title: u.nombre, value: u.id_unidad });
    }
  }
  return items;
});

const procesoFilterItems = computed(() => {
  const items = [{ title: "Todos los procesos", value: null }];
  const seen = new Set();
  for (const p of publicados.value) {
    const id = p.proceso?.id_proceso || p.id_proceso;
    const nombre = p.proceso?.nombre;
    if (id && nombre && !seen.has(id)) {
      seen.add(id);
      items.push({ title: nombre, value: id });
    }
  }
  return items;
});

const categoriaItems = ["Sustantivo", "Apoyo", "Estratégico"];
const estadoItems = ["Aprobado", "Renovado", "Todos"];

function openDetalle(proc) {
  router.push({
    name: "historial_mpp",
    query: { procedimientoId: String(proc.id_procedimiento) },
  });
}

function irHistorial() {
  router.push({ name: "historial_mpp" });
}

watch([filterUnidad, filterCategoria], () => {
  if (isSoloConsultor.value) fetchPublicados();
});

onMounted(async () => {
  if (isSoloConsultor.value) {
    loadFavorites();
    touchLastVisit();
    await Promise.all([
      fetchPublicados(),
      mppStore.fetchUnidades?.() || Promise.resolve(),
      mppStore.fetchProcesos?.() || Promise.resolve(),
    ]);
    return;
  }

  await fetchStats();
  if (unidadesStore.unidades.length === 0) {
    await unidadesStore.getFetchUnidades();
  }
});

const actividadesRecientes = computed(() => {
  return [...unidadesStore.unidades]
    .sort((a, b) => b.id - a.id)
    .slice(0, 6)
    .map((u) => ({
      id: u.id,
      nombre: u.nombre || u.denominacion,
      codigo: u.codigo,
      color: u.color || "#1976D2",
      clase: u.clase,
      fecha: "Reciente",
    }));
});

const stats = computed(() => [
  {
    title: "Procesos",
    value: statsData.value.totalProcesos,
    icon: "mdi-file-tree",
    gradient: "linear-gradient(135deg, #FF0844 0%, #FFB199 100%)",
    suffix: "Registrados",
  },
  {
    title: "Procedimientos",
    value: statsData.value.totalProcedimientos,
    icon: "mdi-file-document-outline",
    gradient: "linear-gradient(135deg, #11998E 0%, #38EF7D 100%)",
    suffix: "Registrados",
  },
  {
    title: "Usuarios del Sistema",
    value: statsData.value.totalUsuarios,
    icon: "mdi-account-multiple",
    gradient: "linear-gradient(135deg, #667EEA 0%, #764BA2 100%)",
    suffix: "Activos",
  },
  {
    title: "Unidades en MOF",
    value: unidadesStore.unidades.length || statsData.value.totalUnidades,
    icon: "mdi-sitemap",
    gradient: "linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%)",
    suffix: "Registradas",
  },
]);
</script>

<template>
  <!-- ===================== DASHBOARD CONSULTOR ===================== -->
  <v-container v-if="isSoloConsultor" fluid class="pa-0">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-black mb-1 text-slate-800">
        Consulta de procedimientos
      </h1>
      <div class="text-body-2 d-flex align-center text-slate-500">
        <v-icon size="18" class="mr-2">mdi-book-open-page-variant</v-icon>
        <span>Inicio</span>
        <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
        <span class="font-weight-bold text-primary">Procedimientos publicados</span>
      </div>
      <p class="text-body-2 text-slate-500 mt-2 mb-0">
        Encuentre y consulte la versión vigente de procedimientos Aprobados o Renovados
        de toda la universidad. Solo lectura.
      </p>
    </div>

    <!-- Buscador principal -->
    <v-card class="rounded-xl border-0 shadow-sm mb-4" elevation="2">
      <v-card-text class="pa-4">
        <v-row dense align="center">
          <v-col cols="12" md="4">
            <v-text-field
              v-model="searchQuery"
              label="Buscar por nombre, código, unidad, categoría o palabra clave"
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
              @keyup.enter="fetchPublicados"
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filterUnidad"
              :items="unidadFilterItems"
              item-title="title"
              item-value="value"
              label="Unidad"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="12" sm="6" md="2">
            <v-select
              v-model="filterProceso"
              :items="procesoFilterItems"
              item-title="title"
              item-value="value"
              label="Proceso"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="filterCategoria"
              :items="categoriaItems"
              label="Categoría"
              variant="outlined"
              density="comfortable"
              hide-details
              clearable
            />
          </v-col>
          <v-col cols="6" sm="3" md="2">
            <v-select
              v-model="filterEstado"
              :items="estadoItems"
              label="Estado"
              variant="outlined"
              density="comfortable"
              hide-details
            />
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <!-- Resumen -->
    <v-row>
      <v-col cols="12" sm="4">
        <v-card class="rounded-xl border-0 shadow-sm" elevation="2">
          <v-card-text class="pa-5">
            <div class="text-caption font-weight-bold text-uppercase text-slate-500 mb-1">
              Publicados disponibles
            </div>
            <div class="text-h4 font-weight-black text-slate-800">{{ totalPublicados }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="rounded-xl border-0 shadow-sm" elevation="2">
          <v-card-text class="pa-5">
            <div class="text-caption font-weight-bold text-uppercase text-slate-500 mb-1">
              Actualizados (30 días)
            </div>
            <div class="text-h4 font-weight-black text-teal-darken-2">{{ actualizadosRecientes }}</div>
          </v-card-text>
        </v-card>
      </v-col>
      <v-col cols="12" sm="4">
        <v-card class="rounded-xl border-0 shadow-sm" elevation="2">
          <v-card-text class="pa-5">
            <div class="text-caption font-weight-bold text-uppercase text-slate-500 mb-1">
              Renovados
            </div>
            <div class="text-h4 font-weight-black text-indigo-darken-2">{{ proximosRevision }}</div>
            <div class="text-caption text-slate-400">Estado Renovado (sin calendario de vigencia)</div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Avisos -->
    <v-alert
      v-if="!avisosDismissed && avisosNuevasVersiones.length"
      type="info"
      variant="tonal"
      class="mt-4 rounded-lg"
      closable
      title="Nuevas versiones publicadas"
      @click:close="avisosDismissed = true"
    >
      <ul class="mb-0 pl-4">
        <li v-for="a in avisosNuevasVersiones" :key="a.id_procedimiento">
          <a href="#" class="text-primary font-weight-bold" @click.prevent="openDetalle(a)">
            {{ a.codigo || "S/C" }} — {{ a.nombre }}
          </a>
          <span class="text-caption text-slate-500">
            · v{{ a.version || "—" }} · {{ formatFecha(a) }}
          </span>
        </li>
      </ul>
    </v-alert>

    <v-row class="mt-2">
      <!-- Lista principal -->
      <v-col cols="12" md="8">
        <v-card class="rounded-xl border-0 shadow-sm" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center justify-space-between flex-wrap ga-2">
            <div class="d-flex align-center">
              <v-icon start color="primary" class="mr-2">mdi-file-document-multiple</v-icon>
              <span class="text-h6 font-weight-black text-slate-800">Resultados</span>
              <v-chip size="small" class="ml-3" variant="tonal">{{ filteredPublicados.length }}</v-chip>
            </div>
            <v-btn variant="text" color="primary" class="font-weight-bold" @click="irHistorial">
              Ir al historial completo
            </v-btn>
          </v-card-title>
          <v-divider class="mx-5" />
          <v-card-text class="pa-0">
            <div v-if="loadingConsultor" class="text-center py-12">
              <v-progress-circular indeterminate color="primary" />
            </div>
            <div v-else-if="!filteredPublicados.length" class="text-center py-12 text-slate-400">
              <v-icon size="56" color="#CBD5E1">mdi-file-search-outline</v-icon>
              <p class="mt-3 font-weight-bold mb-0">No hay procedimientos publicados con esos filtros</p>
            </div>
            <v-list v-else lines="three" class="bg-transparent">
              <v-list-item
                v-for="p in filteredPublicados"
                :key="p.id_procedimiento"
                class="px-5 border-b"
              >
                <template #prepend>
                  <v-avatar color="indigo-lighten-4" size="40">
                    <v-icon color="indigo-darken-2" size="20">mdi-file-check</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold text-body-1">
                  {{ p.nombre }}
                </v-list-item-title>
                <v-list-item-subtitle class="text-caption mt-1">
                  <span class="font-weight-black text-primary">{{ p.codigo || "S/C" }}</span>
                  · {{ unidadResponsable(p) }}
                  · v{{ p.version || "—" }}
                  · {{ p.estado_version }}
                  · {{ formatFecha(p) }}
                  <span v-if="p.proceso?.tipo_proceso"> · {{ p.proceso.tipo_proceso }}</span>
                </v-list-item-subtitle>
                <template #append>
                  <div class="d-flex align-center ga-1">
                    <v-btn
                      icon
                      variant="text"
                      size="small"
                      :color="isFavorite(p.id_procedimiento) ? 'amber-darken-2' : 'grey'"
                      @click="toggleFavorite(p.id_procedimiento)"
                    >
                      <v-icon>{{ isFavorite(p.id_procedimiento) ? 'mdi-star' : 'mdi-star-outline' }}</v-icon>
                      <v-tooltip activator="parent">Favorito</v-tooltip>
                    </v-btn>
                    <v-btn
                      size="small"
                      color="primary"
                      variant="tonal"
                      class="rounded-lg font-weight-bold"
                      @click="openDetalle(p)"
                    >
                      Detalle
                    </v-btn>
                  </div>
                </template>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>

      <!-- Lateral -->
      <v-col cols="12" md="4">
        <v-card class="rounded-xl border-0 shadow-sm mb-4" elevation="2">
          <v-card-title class="pa-5 pb-2 text-subtitle-1 font-weight-black">
            Desde su última visita
          </v-card-title>
          <v-divider class="mx-5" />
          <v-card-text class="pa-0">
            <div v-if="!modificadosDesdeVisita.length" class="pa-5 text-caption text-slate-400">
              No hay cambios publicados desde su última visita.
            </div>
            <v-list v-else density="compact" class="bg-transparent">
              <v-list-item
                v-for="p in modificadosDesdeVisita"
                :key="'m-' + p.id_procedimiento"
                @click="openDetalle(p)"
              >
                <v-list-item-title class="text-body-2 font-weight-bold">{{ p.nombre }}</v-list-item-title>
                <v-list-item-subtitle>
                  v{{ p.version || "—" }} · {{ formatFecha(p) }}
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl border-0 shadow-sm" elevation="2">
          <v-card-title class="pa-5 pb-2 text-subtitle-1 font-weight-black">
            Favoritos / acceso rápido
          </v-card-title>
          <v-divider class="mx-5" />
          <v-card-text class="pa-0">
            <div v-if="!favoritosProcedimientos.length" class="pa-5 text-caption text-slate-400">
              Marque procedimientos con la estrella para acceso rápido.
            </div>
            <v-list v-else density="compact" class="bg-transparent">
              <v-list-item
                v-for="p in favoritosProcedimientos"
                :key="'f-' + p.id_procedimiento"
                @click="openDetalle(p)"
              >
                <template #prepend>
                  <v-icon color="amber-darken-2" size="18">mdi-star</v-icon>
                </template>
                <v-list-item-title class="text-body-2 font-weight-bold">{{ p.nombre }}</v-list-item-title>
                <v-list-item-subtitle>{{ p.codigo || "S/C" }} · v{{ p.version || "—" }}</v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn block variant="tonal" color="primary" class="font-weight-bold" @click="irHistorial">
              Explorar historial MPP
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>

  <!-- ===================== DASHBOARD GENERAL ===================== -->
  <v-container v-else fluid class="pa-0">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-black mb-1 text-slate-800">Panel de Control</h1>
      <div class="text-body-2 d-flex align-center text-slate-500">
        <v-icon size="18" class="mr-2">mdi-home</v-icon>
        <span>Inicio</span>
        <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
        <span class="font-weight-bold text-primary">Vista General</span>
      </div>
    </div>

    <v-row>
      <v-col v-for="stat in stats" :key="stat.title" cols="12" sm="6" md="3">
        <v-card class="rounded-xl border-0 shadow-sm" elevation="2">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-4">
              <div class="pa-3 rounded-lg" :style="{ background: stat.gradient }">
                <v-icon color="white" size="24">{{ stat.icon }}</v-icon>
              </div>
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">
                {{ stat.suffix }}
              </v-chip>
            </div>
            <div class="text-h4 font-weight-black mb-1 text-slate-800">
              {{ stat.value }}
            </div>
            <div class="text-caption font-weight-bold text-uppercase text-slate-500" style="letter-spacing: 1px;">
              {{ stat.title }}
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card class="rounded-xl border-0 shadow-sm" elevation="2">
          <v-card-title class="pa-5 pb-2 d-flex align-center">
            <v-icon start color="primary" class="mr-2">mdi-history</v-icon>
            <span class="text-h6 font-weight-black text-slate-800">
              Últimas Unidades Incorporadas
            </span>
          </v-card-title>
          <v-divider class="mx-5" />
          <v-card-text class="pa-0">
            <v-list v-if="actividadesRecientes.length" lines="two" class="bg-transparent">
              <v-list-item
                v-for="u in actividadesRecientes"
                :key="u.id"
                class="px-5 border-b"
              >
                <template #prepend>
                  <v-avatar :style="{ backgroundColor: u.color }" size="40" class="elevation-2">
                    <v-icon color="white" size="20">mdi-office-building</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-bold text-body-1">{{ u.nombre }}</v-list-item-title>
                <v-list-item-subtitle class="text-caption">
                  Código: <span class="font-weight-black text-primary">{{ u.codigo }}</span> • {{ u.fecha }}
                </v-list-item-subtitle>
                <template #append>
                  <v-btn
                    icon
                    variant="tonal"
                    size="x-small"
                    color="primary"
                    to="/mof/organigrama-unidades"
                  >
                    <v-icon size="14">mdi-arrow-right</v-icon>
                  </v-btn>
                </template>
              </v-list-item>
            </v-list>
            <div v-else class="text-center py-12" style="color: #94A3B8;">
              <v-icon size="64" color="#CBD5E1">mdi-database-off</v-icon>
              <p class="mt-4 font-weight-bold">No hay actividad registrada aún</p>
            </div>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-btn block variant="text" color="primary" to="/mof/listar-unidades" class="font-weight-bold">
              Ver todas las unidades
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="rounded-xl border-0 shadow-sm bg-indigo-darken-4 text-white" elevation="2">
          <v-card-text class="pa-6">
            <div class="text-h5 font-weight-black mb-2">Bienvenido, {{ authStore.user?.nombre }}</div>
            <p class="text-body-2 opacity-80 mb-6">
              Estás operando en el módulo de gestión organizacional de la UMSA.
            </p>
            <v-btn block color="white" variant="elevated" class="text-indigo-darken-4 font-weight-black rounded-lg" to="/mof/organigrama-unidades">
              Ir al Organigrama
            </v-btn>
          </v-card-text>
        </v-card>

        <v-card class="rounded-xl border-0 shadow-sm mt-4" elevation="2">
          <v-card-title class="pa-5 pb-0 text-subtitle-1 font-weight-black">Acceso Rápido</v-card-title>
          <v-card-text class="pa-3">
            <v-row dense>
              <v-col cols="6">
                <v-btn block variant="tonal" color="indigo" height="80" class="flex-column" to="/mof/listar-unidades">
                  <v-icon size="28" class="mb-1">mdi-format-list-bulleted</v-icon>
                  <span class="text-xxs">Lista</span>
                </v-btn>
              </v-col>
              <v-col cols="6">
                <v-btn block variant="tonal" color="teal" height="80" class="flex-column" to="/configuracion">
                  <v-icon size="28" class="mb-1">mdi-cog-outline</v-icon>
                  <span class="text-xxs">Ajustes</span>
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.line-height-1-1 { line-height: 1.1; }
.text-xxs { font-size: 10px; font-weight: 700; text-transform: uppercase; }
.border-b { border-bottom: 1px solid rgba(0, 0, 0, 0.06); }
</style>

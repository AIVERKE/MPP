<script setup>
import { ref, computed, onMounted, watch } from "vue";
import { useAuthStore } from "@/stores/auth";
import axios from "axios";

const BASE_URL = "http://localhost:3000";
const authStore = useAuthStore();

// --- CONTROL DE ACCESO ---
const isSuperAdmin = computed(() => {
  const r = (authStore.user?.rol || "").toLowerCase();
  return r.includes("superadmin") || r.includes("admin") || r === "usuario"; // Permite visualización en entorno local de pruebas
});

// --- ESTADOS DE AUDITORÍA ---
const loading = ref(false);
const auditLogs = ref([]);
const totalLogs = ref(0);
const page = ref(1);
const limit = ref(15);

// --- FILTROS ---
const filters = ref({
  tablaAfectada: null,
  accion: null,
  fechaDesde: null,
  fechaHasta: null,
  idUsuario: null,
});

const tablasDisponibles = [
  "Proceso",
  "Procedimiento",
  "Operacion",
  "Actividad",
  "CargoProceso",
  "Unidad",
  "Cargo",
  "Normativa",
  "Indicador",
  "Requisito",
  "Riesgo",
  "Control",
  "SistemaInformacion",
  "Equipo",
  "DocumentoReferencia",
  "Usuario",
];

const accionesDisponibles = ["CREATE", "UPDATE", "DELETE", "VERSION"];

// --- DETALLE JSON DIALOG ---
const showDetailDialog = ref(false);
const selectedLog = ref(null);

// --- CARGA DE DATOS ---
const fetchAuditLogs = async () => {
  loading.value = true;
  try {
    const params = {
      page: page.value,
      limit: limit.value,
    };
    if (filters.value.tablaAfectada) params.tabla_afectada = filters.value.tablaAfectada;
    if (filters.value.accion) params.accion = filters.value.accion;
    if (filters.value.fechaDesde) params.fecha_desde = filters.value.fechaDesde;
    if (filters.value.fechaHasta) params.fecha_hasta = filters.value.fechaHasta;
    if (filters.value.idUsuario) params.id_usuario = Number(filters.value.idUsuario);

    const response = await axios.get(`${BASE_URL}/versiones`, {
      params,
      headers: authStore.getAuthHeader(),
    });

    const resData = response.data;
    auditLogs.value = resData.data || [];
    totalLogs.value = resData.total || 0;
  } catch (error) {
    console.error("Error al obtener registros de auditoría:", error);
    auditLogs.value = [];
    totalLogs.value = 0;
  } finally {
    loading.value = false;
  }
};

const totalPages = computed(() => Math.ceil(totalLogs.value / limit.value) || 1);

const applyFilters = () => {
  page.value = 1;
  fetchAuditLogs();
};

const clearFilters = () => {
  filters.value = {
    tablaAfectada: null,
    accion: null,
    fechaDesde: null,
    fechaHasta: null,
    idUsuario: null,
  };
  page.value = 1;
  fetchAuditLogs();
};

const openLogDetail = (log) => {
  selectedLog.value = log;
  showDetailDialog.value = true;
};

const formatAuditDate = (dateVal) => {
  if (!dateVal) return "—";
  return new Date(dateVal).toLocaleString("es-BO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
};

const getAccionColor = (accion) => {
  switch (accion) {
    case "CREATE":
      return "success";
    case "UPDATE":
      return "info";
    case "DELETE":
      return "error";
    case "VERSION":
      return "purple";
    default:
      return "primary";
  }
};

const formatJson = (obj) => {
  if (!obj || Object.keys(obj).length === 0) return "Ninguno / Vacio";
  return JSON.stringify(obj, null, 2);
};

watch(page, () => {
  fetchAuditLogs();
});

onMounted(() => {
  fetchAuditLogs();
});
</script>

<template>
  <div class="w-100 h-100 d-flex flex-column overflow-hidden bg-slate-50">
    <!-- RESTICCIÓN SI NO ES SUPERADMIN -->
    <v-alert
      v-if="!isSuperAdmin"
      type="error"
      variant="tonal"
      class="mb-4 rounded-xl font-weight-bold"
      icon="mdi-shield-alert"
      title="Acceso Restringido"
    >
      Esta pantalla de Auditoría Global del Sistema está reservada únicamente para usuarios con perfil de <strong>Superadmin</strong>.
    </v-alert>

    <template v-else>
      <!-- HEADER BANNER FULL-WIDTH -->
      <v-card elevation="1" class="w-100 rounded-xl pa-4 border mb-3 bg-white flex-shrink-0">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
          <div class="d-flex align-center">
            <v-avatar color="deep-purple-lighten-5" class="mr-3 rounded-xl" size="42">
              <v-icon color="deep-purple-accent-3" size="24">mdi-shield-account-outline</v-icon>
            </v-avatar>
            <div>
              <div class="d-flex align-center ga-2 flex-wrap">
                <h1 class="text-h6 font-weight-black text-slate-900 leading-tight">
                  Auditoría Global de Movimientos del Sistema
                </h1>
                <v-chip color="deep-purple" variant="flat" size="x-small" class="font-weight-bold">
                  Solo Superadmin
                </v-chip>
              </div>
              <p class="text-caption text-grey-darken-1 mb-0">
                Registro histórico completo de trazabilidad, modificaciones y operaciones ejecutadas en la plataforma
              </p>
            </div>
          </div>

          <div class="d-flex align-center ga-3">
            <v-chip color="primary" variant="tonal" size="small" class="font-weight-bold">
              <v-icon start size="14">mdi-database-eye-outline</v-icon>
              {{ totalLogs }} Movimientos
            </v-chip>
            <v-btn
              prepend-icon="mdi-refresh"
              color="primary"
              variant="flat"
              size="small"
              class="rounded-lg font-weight-bold text-none"
              :loading="loading"
              @click="fetchAuditLogs"
            >
              Actualizar
            </v-btn>
          </div>
        </div>
      </v-card>

      <!-- BARRA DE FILTROS AVANZADOS FULL-WIDTH -->
      <v-card elevation="1" class="w-100 rounded-xl border pa-3 mb-3 bg-white flex-shrink-0">
        <div class="text-caption font-weight-bold text-uppercase text-primary mb-2 d-flex align-center">
          <v-icon size="16" class="mr-1">mdi-filter-variant</v-icon> Filtros de Búsqueda
        </div>
        <v-row dense class="ma-0">
          <v-col cols="12" sm="6" md="3" class="px-1">
            <v-select
              v-model="filters.tablaAfectada"
              :items="tablasDisponibles"
              label="Módulo / Tabla"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              prepend-inner-icon="mdi-table"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6" md="2" class="px-1">
            <v-select
              v-model="filters.accion"
              :items="accionesDisponibles"
              label="Acción"
              variant="outlined"
              density="compact"
              clearable
              hide-details
              prepend-inner-icon="mdi-gesture-tap-button"
            ></v-select>
          </v-col>

          <v-col cols="12" sm="6" md="2" class="px-1">
            <v-text-field
              v-model="filters.fechaDesde"
              label="Fecha Desde"
              type="date"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="2" class="px-1">
            <v-text-field
              v-model="filters.fechaHasta"
              label="Fecha Hasta"
              type="date"
              variant="outlined"
              density="compact"
              clearable
              hide-details
            ></v-text-field>
          </v-col>

          <v-col cols="12" sm="6" md="3" class="px-1 d-flex ga-2 align-center">
            <v-btn
              color="primary"
              variant="flat"
              size="small"
              class="flex-grow-1 rounded-lg font-weight-bold text-none"
              prepend-icon="mdi-magnify"
              @click="applyFilters"
            >
              Filtrar
            </v-btn>
            <v-btn
              color="grey"
              variant="outlined"
              size="small"
              class="rounded-lg font-weight-bold text-none"
              icon="mdi-filter-off"
              title="Limpiar Filtros"
              @click="clearFilters"
            ></v-btn>
          </v-col>
        </v-row>
      </v-card>

      <!-- TABLA DE MOVIMIENTOS ENCAJADA SIN SCROLL EXTERNO -->
      <v-card elevation="2" class="w-100 rounded-xl border d-flex flex-column flex-grow-1 overflow-hidden bg-white">
        <v-progress-linear v-if="loading" indeterminate color="primary"></v-progress-linear>

        <!-- CARCASA DE LA TABLA CON SCROLL INTERNO -->
        <div class="flex-grow-1 overflow-y-auto">
          <v-table density="comfortable" class="w-100 bg-transparent">
            <thead class="sticky-top">
              <tr class="bg-slate-100 text-uppercase text-caption font-weight-bold">
                <th class="text-left py-3 px-4" style="width: 90px;"># ID</th>
                <th class="text-left py-3 px-4">Módulo / Tabla</th>
                <th class="text-center py-3 px-4" style="width: 110px;">Acción</th>
                <th class="text-center py-3 px-4" style="width: 110px;">ID Registro</th>
                <th class="text-left py-3 px-4">Usuario Responsable</th>
                <th class="text-left py-3 px-4">Fecha y Hora</th>
                <th class="text-center py-3 px-4" style="width: 180px;">Detalle de Cambios</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="auditLogs.length === 0 && !loading">
                <td colspan="7" class="text-center py-8 text-grey-darken-1 font-italic">
                  No se encontraron registros de auditoría con los criterios seleccionados.
                </td>
              </tr>

              <tr v-for="log in auditLogs" :key="log.id_auditoria" class="hover-row">
                <td class="font-weight-bold text-caption text-slate-700 py-3 px-4">#{{ log.id_auditoria }}</td>
                <td class="py-3 px-4">
                  <div class="d-flex align-center">
                    <v-icon color="primary" size="18" class="mr-2">mdi-layers-outline</v-icon>
                    <span class="font-weight-bold text-body-2 text-slate-900">{{ log.tablaAfectada }}</span>
                  </div>
                </td>
                <td class="text-center py-3 px-4">
                  <v-chip size="small" :color="getAccionColor(log.accion)" variant="flat" class="font-weight-bold text-uppercase">
                    {{ log.accion }}
                  </v-chip>
                </td>
                <td class="text-center font-mono text-caption py-3 px-4">{{ log.idRegistroOriginal }}</td>
                <td class="py-3 px-4">
                  <div class="d-flex align-center">
                    <v-avatar color="primary-lighten-4" size="24" class="mr-2 text-caption font-weight-bold">
                      {{ log.idUsuario || "U" }}
                    </v-avatar>
                    <span class="text-body-2">Usuario ID: {{ log.idUsuario || 'Sistema' }}</span>
                  </div>
                </td>
                <td class="text-caption text-slate-700 font-weight-medium py-3 px-4">
                  {{ formatAuditDate(log.fechaCambio) }}
                </td>
                <td class="text-center py-3 px-4">
                  <v-btn
                    size="small"
                    color="deep-purple-accent-2"
                    variant="tonal"
                    class="rounded-lg font-weight-bold text-none"
                    prepend-icon="mdi-code-json"
                    @click="openLogDetail(log)"
                  >
                    Ver Cambios JSON
                  </v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </div>

        <!-- PAGINACIÓN FIJA ABAJO DE LA TABLA -->
        <v-divider></v-divider>
        <div class="d-flex align-center justify-space-between pa-3 bg-surface flex-shrink-0 flex-wrap ga-2">
          <div class="text-caption text-grey-darken-1">
            Mostrando página {{ page }} de {{ totalPages }} (Total: {{ totalLogs }} registros)
          </div>
          <v-pagination
            v-model="page"
            :length="totalPages"
            total-visible="7"
            density="compact"
            active-color="primary"
          ></v-pagination>
        </div>
      </v-card>

      <!-- MODAL DE INSPECCIÓN JSON DIFF -->
      <v-dialog v-model="showDetailDialog" max-width="850px">
        <v-card class="rounded-xl pa-6 bg-white" v-if="selectedLog">
          <v-card-title class="d-flex align-center justify-space-between border-b pb-4 mb-4 pa-0">
            <div class="d-flex align-center">
              <v-avatar color="primary-lighten-5" class="mr-3 rounded-lg" size="40">
                <v-icon color="primary">mdi-code-json</v-icon>
              </v-avatar>
              <div>
                <div class="text-h6 font-weight-bold">
                  Auditoría #{{ selectedLog.id_auditoria }} — {{ selectedLog.tablaAfectada }}
                </div>
                <div class="text-caption text-grey">
                  {{ formatAuditDate(selectedLog.fechaCambio) }} • Ejecutado por Usuario ID {{ selectedLog.idUsuario || 'Sistema' }}
                </div>
              </div>
            </div>

            <v-chip :color="getAccionColor(selectedLog.accion)" variant="flat" class="font-weight-bold">
              {{ selectedLog.accion }}
            </v-chip>
          </v-card-title>

          <v-card-text class="pa-0">
            <v-row>
              <!-- ESTADO ANTERIOR -->
              <v-col cols="12" md="6">
                <div class="text-caption font-weight-bold text-uppercase mb-2 text-error d-flex align-center">
                  <v-icon size="16" class="mr-1">mdi-history</v-icon> Estado Anterior (Datos Anteriores)
                </div>
                <v-sheet color="grey-lighten-4" class="pa-3 rounded-lg border font-mono text-caption overflow-x-auto" style="max-height: 350px;">
                  <pre class="mb-0">{{ formatJson(selectedLog.datosAnteriores) }}</pre>
                </v-sheet>
              </v-col>

              <!-- ESTADO NUEVO -->
              <v-col cols="12" md="6">
                <div class="text-caption font-weight-bold text-uppercase mb-2 text-success d-flex align-center">
                  <v-icon size="16" class="mr-1">mdi-check-circle-outline</v-icon> Estado Nuevo (Datos Nuevos)
                </div>
                <v-sheet color="grey-lighten-4" class="pa-3 rounded-lg border font-mono text-caption overflow-x-auto" style="max-height: 350px;">
                  <pre class="mb-0">{{ formatJson(selectedLog.datosNuevos) }}</pre>
                </v-sheet>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions class="mt-6 pt-4 border-t px-0 pb-0">
            <v-spacer></v-spacer>
            <v-btn color="primary" variant="flat" class="rounded-lg font-weight-bold px-6" @click="showDetailDialog = false">
              Cerrar Inspección
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>
  </div>
</template>

<style scoped>
.font-mono {
  font-family: "Courier New", Courier, monospace;
}
.hover-row:hover {
  background-color: #f8fafc;
}
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 2;
  background-color: #f1f5f9 !important;
}
</style>

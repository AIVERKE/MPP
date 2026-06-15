<template>
  <v-container fluid>
    <v-row>
      <v-col cols="12">
        <div class="d-flex align-center mb-2">
          <v-icon color="indigo-darken-2" size="32" class="mr-3"
            >mdi-office-building-marker</v-icon
          >
          <h1 class="text-h4 font-weight-bold">Dashboard Facultativo</h1>
        </div>
        <p class="text-subtitle-1 text-medium-emphasis mb-6">
          Análisis de unidades dependientes: Cantidades, tipos y nombres.
        </p>
      </v-col>
    </v-row>

    <!-- ENTRADA: Selección en Cascada -->
    <v-card class="mb-6 rounded-lg" elevation="2" border>
      <v-card-title
        class="bg-indigo-lighten-5 text-indigo-darken-4 text-subtitle-2 font-weight-bold"
      >
        ENTRADA: ESCOGE TIPO DE UNIDAD ORGANIZACIONAL
      </v-card-title>
      <v-card-text class="pt-4">
        <v-row align="center">
          <!-- Filtro 1: Clase (Ordenada Jerárquicamente) -->
          <v-col cols="12" md="4">
            <v-select
              v-model="claseSeleccionada"
              :items="listaClasesOrdenadas"
              item-title="descripcion"
              item-value="descripcion"
              label="1. SELECCIONE TIPO DE UNIDAD ORGANIZACIONAL"
              prepend-inner-icon="mdi-layers-outline"
              variant="outlined"
              hide-details
              clearable
              placeholder="Ej. FACULTAD..."
              @update:model-value="unidadMadre = null"
            ></v-select>
          </v-col>

          <!-- Filtro 2: Unidad Madre (Filtrada por Clase) -->
          <v-col cols="12" md="8">
            <v-autocomplete
              v-model="unidadMadre"
              :items="unidadesFiltradasPorClase"
              :item-title="(item) => item.nombre || item.denominacion"
              item-value="id"
              :disabled="!claseSeleccionada"
              :label="
                claseSeleccionada
                  ? `2. SELECCIONE ${claseSeleccionada}`
                  : '2. (PRIMERO SELECCIONE UNA UNIDAD ORGANIZACIONAL)'
              "
              prepend-inner-icon="mdi-magnify"
              variant="outlined"
              hide-details
              clearable
              return-object
              placeholder="Escriba el nombre de la unidad..."
            ></v-autocomplete>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>

    <v-row v-if="loading">
      <v-col cols="12" class="text-center pa-12">
        <v-progress-circular
          indeterminate
          color="indigo"
          size="64"
        ></v-progress-circular>
      </v-col>
    </v-row>

    <template v-else-if="unidadMadre">
      <!-- SALIDA: Cantidades Dependientes -->
      <v-row align="center" class="mb-2">
        <v-col cols="12">
          <div class="text-overline text-grey-darken-1">
            SALIDA: UNIDADES DEPENDIENTES EN CANTIDADES
          </div>
        </v-col>
      </v-row>
      <v-row>
        <v-col
          v-for="(count, type) in conteoDependientes"
          :key="type"
          cols="12"
          sm="6"
          md="3"
        >
          <v-card color="white" class="text-center pa-4 rounded-lg" border flat>
            <div class="text-overline mb-1 text-grey-darken-2 font-weight-bold">
              {{ type }}
            </div>
            <div class="text-h3 font-weight-black text-indigo-darken-3">
              {{ count }}
            </div>
          </v-card>
        </v-col>
        <v-col v-if="Object.keys(conteoDependientes).length === 0" cols="12">
          <v-alert
            type="warning"
            variant="tonal"
            text="Esta unidad no posee unidades dependientes registradas."
          ></v-alert>
        </v-col>
      </v-row>

      <v-row class="mt-6">
        <!-- Gráfica de Distribución -->
        <v-col cols="12" lg="6">
          <v-card elevation="2" class="rounded-lg h-100">
            <v-card-title
              class="pa-4 text-uppercase text-caption font-weight-bold bg-grey-lighten-4"
            >
              DISTRIBUCIÓN POR TIPO:
              {{ unidadMadre.nombre || unidadMadre.denominacion }}
            </v-card-title>
            <v-divider></v-divider>
            <v-card-text>
              <highcharts :options="chartOptions"></highcharts>
            </v-card-text>
          </v-card>
        </v-col>

        <!-- SALIDA REPORTE GENERAL: Listado de Nombres -->
        <v-col cols="12" lg="6">
          <v-card elevation="2" class="rounded-lg h-100">
            <v-card-title
              class="pa-4 d-flex align-center bg-grey-lighten-4 text-caption font-weight-bold"
            >
              <v-icon start color="indigo">mdi-file-tree</v-icon>
              SALIDA REPORTE GENERAL (NOMBRES)
            </v-card-title>
            <v-divider></v-divider>
            <v-list
              density="compact"
              class="report-list"
              style="max-height: 450px; overflow-y: auto"
            >
              <v-list-item
                v-for="item in arbolDependencias"
                :key="item.id"
                :style="{ paddingLeft: item.level * 24 + 16 + 'px' }"
                class="border-bottom py-2"
                :class="getRowClass(item)"
              >
                <template v-slot:prepend>
                  <v-icon
                    size="small"
                    :color="
                      item.level === 0
                        ? item.color ||
                          getClaseColor(item.clase, clasesStore.clases) ||
                          'indigo'
                        : 'grey-darken-1'
                    "
                  >
                    {{
                      item.level === 0
                        ? "mdi-subdirectory-arrow-right"
                        : "mdi-circle-medium"
                    }}
                  </v-icon>
                </template>
                <v-list-item-title class="text-caption font-weight-bold">
                  {{ item.nombre || item.denominacion }}
                </v-list-item-title>
                <template v-slot:append>
                  <v-chip
                    size="x-small"
                    :color="getClaseColor(item.clase, clasesStore.clases)"
                    variant="flat"
                    label
                    class="font-weight-bold text-white"
                  >
                    {{ resolveClase(item.clase) }}
                  </v-chip>
                </template>
              </v-list-item>
            </v-list>
          </v-card>
        </v-col>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted } from "vue";
import { useAllUnidadesMofStore } from "@/stores/unidades_mof";
import { useAllClasesMofStore } from "@/stores/clases_mof";
import { useAllNivelesMofStore } from "@/stores/niveles_mof";
import { useAllTiposMofStore } from "@/stores/tipos_mof";
import { useAllRelacionesMofStore } from "@/stores/relaciones_mof";
import {
  getClaseNombre,
  getClaseColor,
  isUnidadOficial,
} from "@/utils/mofHelpers";

const unidadesStore = useAllUnidadesMofStore();
const clasesStore = useAllClasesMofStore();
const nivelesStore = useAllNivelesMofStore();
const tiposStore = useAllTiposMofStore();
const relacionesStore = useAllRelacionesMofStore();

const loading = ref(true);
const claseSeleccionada = ref(null);
const unidadMadre = ref(null);

const isUnidadOficialCheck = (u) => isUnidadOficial(u, clasesStore.clases);

onMounted(async () => {
  loading.value = true;
  await Promise.all([
    unidadesStore.getFetchUnidades(),
    clasesStore.getFetchClases(),
    nivelesStore.getFetchNiveles(),
    tiposStore.getFetchTipos(),
    relacionesStore.getFetchRelaciones(),
  ]);
  loading.value = false;
});

// Resolvers usando mofHelpers
const resolveClase = (val) => getClaseNombre(val, clasesStore.clases);

// Lista de Clases ordenada por peso para el primer dropdown
const listaClasesOrdenadas = computed(() => {
  return [...clasesStore.clases]
    .filter(
      (c) =>
        c.activo === true ||
        c.activo === 1 ||
        String(c.activo).toLowerCase() === "true",
    )
    .sort((a, b) => a.peso - b.peso);
});

// Unidades filtradas por la clase seleccionada para el segundo dropdown
const unidadesFiltradasPorClase = computed(() => {
  if (!claseSeleccionada.value) return [];
  return (unidadesStore.unidades || []).filter(
    (u) => resolveClase(u.clase) === claseSeleccionada.value,
  );
});

// Lógica recursiva para encontrar TODO el árbol genealógico de una unidad
function getDescendientes(parentId, level = 0) {
  const todas = unidadesStore.unidades || [];
  let result = [];

  const hijos = todas.filter((u) => {
    const uParentId =
      u.parent && typeof u.parent === "object" ? u.parent.id : u.parent;
    return String(uParentId) === String(parentId);
  });

  hijos.forEach((hijo) => {
    result.push({ ...hijo, level });
    result = [...result, ...getDescendientes(hijo.id, level + 1)];
  });
  return result;
}

const arbolDependencias = computed(() => {
  if (!unidadMadre.value) return [];
  return getDescendientes(unidadMadre.value.id);
});

const getRowClass = (item) => {
  if (!isUnidadOficialCheck(item)) {
    return "opacity-60 grayscale bg-grey-lighten-4";
  }
  return "";
};

const conteoDependientes = computed(() => {
  const counts = {};
  arbolDependencias.value.forEach((u) => {
    const tipo = resolveClase(u.clase) || "OTRA UNIDAD";
    counts[tipo] = (counts[tipo] || 0) + 1;
  });
  return counts;
});

const chartOptions = computed(() => ({
  chart: { type: "bar", backgroundColor: "transparent" },
  title: { text: null },
  xAxis: { categories: Object.keys(conteoDependientes.value), crosshair: true },
  yAxis: { title: { text: "Nro. de Unidades" }, min: 0 },
  plotOptions: {
    bar: {
      color: "#F57C00",
      borderRadius: 4,
      dataLabels: { enabled: true },
    },
  },
  series: [
    { name: "Dependientes", data: Object.values(conteoDependientes.value) },
  ],
  credits: { enabled: false },
}));
</script>

<style scoped>
.report-list {
  background-color: #fafafa;
}
.border-bottom {
  border-bottom: 1px solid #f0f0f0;
}
.text-xxs {
  font-size: 0.65rem !important;
}
</style>

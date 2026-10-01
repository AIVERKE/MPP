<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAllUnidadesMofStore } from '../../stores/unidades_mof'
import { useAllNivelesMofStore } from "@/stores/niveles_mof";
import { useAllClasesMofStore } from "@/stores/clases_mof";

// --- PLUGINS & UTILS ---
import {
  getClaseNombre,
  getNivelNombre,
  getClaseColor,
  highlightText,
  isUnidadOficial
} from "@/utils/mofHelpers";

const unidadesStore = useAllUnidadesMofStore();
const nivelesStore = useAllNivelesMofStore();
const clasesStore = useAllClasesMofStore();

const search = ref('')
const snackbar = ref(false)
const snackbarText = ref("")
const snackbarColor = ref("success")

const headers = [
  { title: 'CÓDIGO', key: 'codigo', align: 'start', sortable: true },
  { title: 'UNIDAD ADMINISTRATIVA', key: 'display_name', align: 'start', sortable: true },
  { title: 'JERARQUÍA / CLASE', key: 'clase', align: 'start', sortable: true },
  { title: 'NIVEL', key: 'nivel', align: 'start', sortable: true },
  { title: 'ESTADO', key: 'oficial', align: 'center', sortable: true },
  { title: 'ACCIONES', key: 'actions', align: 'center', sortable: false },
]

const vistaModo = ref('analitico')

const filteredUnidades = computed(() => {
  let list = unidadesStore.unidades;

  // Filtro Estructural para Modo Estricto
  if (vistaModo.value === 'estricto') {
    list = list.filter(u => isUnidadOficial(u, clasesStore.clases));
  }

  if (search.value) {
    const q = search.value.toLowerCase();
    list = list.filter(u => 
      (u.nombre || u.denominacion || '').toLowerCase().includes(q) ||
      (u.codigo || '').toLowerCase().includes(q)
    );
  }

  return list.map(u => ({
    ...u,
    display_name: u.denominacion || u.nombre
  }));
});

const getFadedClass = (item) => {
  if (vistaModo.value === 'analitico' && !isUnidadOficial(item, clasesStore.clases)) {
    return 'opacity-60 grayscale';
  }
  return '';
};

const resolveClase = (val) => getClaseNombre(val, clasesStore.clases);
const resolveNivel = (val) => getNivelNombre(val, nivelesStore.niveles);
const resolveClaseColor = (val) => getClaseColor(val, clasesStore.clases);

onMounted(async () => {
  await Promise.all([
    unidadesStore.getFetchUnidades(),
    nivelesStore.getFetchNiveles(),
    clasesStore.getFetchClases(),
  ]);
  if (unidadesStore.error) {
    snackbarText.value = unidadesStore.error;
    snackbarColor.value = "error";
    snackbar.value = true;
  }
});

async function verReporte(id) {
  try {
    await unidadesStore.abrirPdfUnidad(id);
  } catch (e) {
    snackbarText.value = "Error al generar el PDF: " + e.message;
    snackbarColor.value = "error";
    snackbar.value = true;
  }
}
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- Header & Breadcrumb -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-black mb-1 text-slate-800">Listado de Unidades</h1>
      <div class="text-body-2 d-flex align-center text-slate-500">
        <v-icon size="18" class="mr-2">mdi-office-building</v-icon>
        <span>MOF</span>
        <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
        <span class="font-weight-bold text-primary">Unidades UMSA</span>
      </div>
    </div>

    <v-progress-linear v-if="unidadesStore.loading" indeterminate color="primary" class="mb-4 rounded-pill" height="6" />

    <v-card class="rounded-xl border-0 shadow-sm" elevation="3">
      <v-card-title class="pa-5 d-flex align-center flex-wrap gap-4">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Filtrar por código o nombre..."
          variant="outlined"
          density="compact"
          hide-details
          class="max-width-400"
          clearable
          autocomplete="off"
        ></v-text-field>
        
        <v-spacer></v-spacer>

        <v-btn-toggle
          v-model="vistaModo"
          mandatory
          color="primary"
          variant="outlined"
          density="comfortable"
          rounded="lg"
        >
          <v-btn value="integral" class="px-3 text-caption">
            <v-icon start size="16">mdi-eye</v-icon>
            INTEGRAL
          </v-btn>
          <v-btn value="analitico" class="px-3 text-caption">
            <v-icon start size="16">mdi-chart-scatter-plot</v-icon>
            ANALÍTICA
          </v-btn>
          <v-btn value="estricto" class="px-3 text-caption">
            <v-icon start size="16">mdi-check-decagram</v-icon>
            OFICIAL ESTRICTO
          </v-btn>
        </v-btn-toggle>
      </v-card-title>

      <v-divider></v-divider>

      <v-data-table
        :headers="headers"
        :items="filteredUnidades"
        :search="search"
        hover
        density="comfortable"
        class="bg-transparent"
      >
        <!-- Custom Row Rendering for Fading -->
        <template v-slot:item="{ item }">
          <tr :class="getFadedClass(item)">
            <!-- Custom Slot: Código -->
            <td class="text-start">
              <div class="d-flex align-center">
                <div :style="{ backgroundColor: item.color || resolveClaseColor(item.clase), height: '24px', width: '4px' }" class="mr-2 rounded-pill"></div>
                <span class="font-weight-black text-caption" :style="{ color: item.color || resolveClaseColor(item.clase) }">
                  {{ item.codigo }}
                </span>
              </div>
            </td>

            <!-- Custom Slot: Nombre -->
            <td class="text-start">
              <div class="py-2">
                <div class="text-body-2 font-weight-bold text-slate-800">
                    <div v-html="highlightText(item.display_name, search)"></div>
                </div>
                <div class="text-xxs text-grey-darken-1 text-uppercase">{{ item.tipo }}</div>
              </div>
            </td>

            <!-- Custom Slot: Clase -->
            <td class="text-start">
              <v-chip 
                size="x-small" 
                label 
                class="font-weight-bold" 
                :style="{ backgroundColor: resolveClaseColor(item.clase), color: '#1E293B' }"
              >
                {{ resolveClase(item.clase) }}
              </v-chip>
            </td>

            <!-- Custom Slot: Nivel -->
            <td class="text-start">
              <v-chip size="x-small" label variant="tonal" color="indigo-darken-2" class="font-weight-bold chip-nivel">
                {{ resolveNivel(item.nivel) }}
              </v-chip>
            </td>

            <!-- Custom Slot: Estado -->
            <td class="text-center">
              <div class="d-flex align-center justify-center">
                <span :class="isUnidadOficial(item, clasesStore.clases) ? 'text-success font-weight-bold' : 'text-grey'" style="font-size: 11px;">
                  {{ isUnidadOficial(item, clasesStore.clases) ? 'OFICIAL' : 'NO OFICIAL' }}
                </span>
              </div>
            </td>

            <!-- Custom Slot: Acciones -->
            <td class="text-center">
              <div class="d-flex justify-center gap-1">
                <v-btn icon variant="text" size="small" color="error" @click="verReporte(item.id)">
                  <v-icon size="20">mdi-file-pdf-box</v-icon>
                  <v-tooltip activator="parent" location="top">Ver reporte PDF</v-tooltip>
                </v-btn>
              </div>
            </td>
          </tr>
        </template>
      </v-data-table>
    </v-card>

    <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000" class="mb-4">{{ snackbarText }}</v-snackbar>
  </v-container>
</template>

<style scoped>
.max-width-400 { max-width: 400px; }
.shadow-sm { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important; }
.text-xxs { font-size: 10px; font-weight: 700; }
</style>
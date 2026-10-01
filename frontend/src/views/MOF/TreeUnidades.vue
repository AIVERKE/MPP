<script setup>
import { ref, onMounted, computed } from "vue";
import { useAllUnidadesMofStore } from "../../stores/unidades_mof";
import { useAllNivelesMofStore } from "@/stores/niveles_mof";
import { useAllClasesMofStore } from "@/stores/clases_mof";

// --- PLUGINS & UTILS ---
import {
  getClaseNombre,
  getNivelNombre,
  getClaseColor,
  highlightText,
} from "@/utils/mofHelpers";

const unidadesStore = useAllUnidadesMofStore();
const nivelesStore = useAllNivelesMofStore();
const clasesStore = useAllClasesMofStore();

const snackbar = ref(false);
const snackbarText = ref("");
const snackbarColor = ref("success");

const search = ref("");

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

function buildTree(list) {
  const map = {};
  const roots = [];
  list.forEach((item) => {
    map[item.id] = {
      ...item,
      display_name: item.denominacion || item.nombre,
      children: [],
    };
  });
  list.forEach((item) => {
    let pId = null;
    if (item.parent) {
      pId = typeof item.parent === "object" ? item.parent.id : item.parent;
    }

    if (pId && map[pId]) {
      map[pId].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  return roots;
}

const treeItems = computed(() => buildTree(unidadesStore.unidades));

async function verReporte(id) {
  try {
    await unidadesStore.abrirPdfUnidad(id);
  } catch (e) {
    snackbarText.value = "Error al generar el PDF: " + e.message;
    snackbarColor.value = "error";
    snackbar.value = true;
  }
}

const resolveClaseColor = (val) => getClaseColor(val, clasesStore.clases);
const resolveClase = (val) => getClaseNombre(val, clasesStore.clases);
const resolveNivel = (val) => getNivelNombre(val, nivelesStore.niveles);
</script>

<template>
  <v-container fluid class="pa-0">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-black mb-1 text-slate-800">
        Estructura Organizacional
      </h1>
      <div class="text-body-2 d-flex align-center text-slate-500">
        <v-icon size="18" class="mr-2">mdi-tree</v-icon>
        <span>MOF</span>
        <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
        <span class="font-weight-bold text-primary">Árbol de Unidades</span>
      </div>
    </div>

    <v-progress-linear
      v-if="unidadesStore.loading"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <v-card class="rounded-lg border shadow-sm" elevation="0">
      <v-card-title class="pa-4 d-flex align-center flex-wrap gap-2">
        <v-text-field
          v-model="search"
          prepend-inner-icon="mdi-magnify"
          label="Buscar unidad..."
          variant="outlined"
          density="compact"
          hide-details
          class="max-width-300"
          clearable
        ></v-text-field>
        <v-spacer></v-spacer>
      </v-card-title>

      <v-divider></v-divider>

      <v-card-text class="pa-2">
        <v-treeview
          v-if="treeItems.length"
          :items="treeItems"
          :search="search"
          item-title="display_name"
          item-value="id"
          item-children="children"
          open-all
          density="comfortable"
          class="simple-tree"
        >
          <template #prepend="{ item }">
            <v-icon
              :color="item.color || resolveClaseColor(item.clase)"
              size="24"
            >
              {{
                item.children?.length ? "mdi-sitemap" : "mdi-office-building"
              }}
            </v-icon>
          </template>

          <template #label="{ item }">
            <div class="d-flex align-center gap-2">
              <span
                class="text-body-2 font-weight-bold"
                v-html="highlightText(item.display_name, search)"
              ></span>
              <v-chip
                size="x-small"
                label
                density="compact"
                class="text-xxs px-1 font-weight-bold"
                :style="{ backgroundColor: resolveClaseColor(item.clase), color: '#1E293B' }"
              >
                {{ resolveClase(item.clase) }}
              </v-chip>
              <span v-if="item.oficial" class="text-success font-weight-black ml-1" style="font-size: 8px;">OFICIAL</span>
            </div>
          </template>

          <template #append="{ item }">
            <div class="d-flex align-center">
              <v-tooltip text="Ver reporte PDF" location="top">
                <template v-slot:activator="{ props }">
                  <v-btn
                    v-bind="props"
                    icon="mdi-file-pdf-box"
                    variant="text"
                    size="x-small"
                    color="error"
                    @click.stop="verReporte(item.id)"
                  ></v-btn>
                </template>
              </v-tooltip>
            </div>
          </template>
        </v-treeview>

        <div v-else-if="!unidadesStore.loading" class="text-center py-8">
          <v-icon size="48" color="grey-lighten-2">mdi-database-off</v-icon>
          <p class="text-body-1 text-grey mt-2">No hay datos para mostrar</p>
        </div>
      </v-card-text>
    </v-card>
  </v-container>

  <v-snackbar v-model="snackbar" :color="snackbarColor" timeout="4000">{{
    snackbarText
  }}</v-snackbar>
</template>

<style scoped>
.max-width-300 {
  max-width: 300px;
}
.text-xxs {
  font-size: 9px;
  font-weight: bold;
}
.simple-tree :deep(.v-treeview-node__root) {
  min-height: 40px !important;
  border-bottom: 1px solid #f1f5f9;
}
.simple-tree :deep(.v-treeview-node__root:hover) {
  background-color: #f8fafc;
}
</style>

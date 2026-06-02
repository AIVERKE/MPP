<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useMppCoreStore } from "@/stores/mpp_core";
import DisenadorMatriz from "./DisenadorMatriz.vue";

const mppStore = useMppCoreStore();

// --- ESTADOS DE UI Y NAVEGACIÓN ---
const isLocked = ref(false);
const isSaving = ref(false);
const lastSaved = ref(null);

const showEntityDialog = ref(false);
const showResourceDialog = ref(false);

// --- DATOS DE NEGOCIO ---
const selectedProceso = ref(null);
const selectedProcedimiento = ref(null);
const selectedCargo = ref(null);
const selectedNormativa = ref(null);

const entityMode = ref("create");
const entityType = ref("");
const entityData = ref({
  id: null,
  codigo: "",
  nombre: "",
  descripcion: "",
  id_unidades: [],
  objetivos: "",
  alcance: "",
  periodicidad: "",
  version: "1.0",
  estado: "Activo",
});

const procedureHeader = ref({ objetivos: "", alcance: "", periodicidad: "" });

const resourceMode = ref("create");
const resourceType = ref("");
const resourceData = ref({
  id: null,
  nombre: "",
  descripcion: "",
  codigo: "",
  url: "",
});

const snackbar = ref({ show: false, text: "", color: "success" });

// --- TIMERS ---
let autoSaveTimer = null;
let debounceTimer = null;

// --- LÓGICA DE AUTO-GUARDADO TRANSPARENTE ---
const triggerAutoSave = (saveFn, delay = 1500) => {
  if (isSaving.value) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    try {
      await saveFn(true);
    } catch (e) {
      console.error("Auto-save failed:", e);
    }
  }, delay);
};

// --- FUNCIONES DE PERSISTENCIA ---

const saveCargoRelation = async (silent = false) => {
  if (!selectedProceso.value || !selectedCargo.value) return;
  try {
    isSaving.value = true;
    const existing = mppStore.cargoProcesos.find(
      (cp) => cp.es_responsable_principal,
    );
    if (existing) {
      await mppStore.updateCargoProceso(existing.id, {
        id_cargo: Number(selectedCargo.value),
        id_proceso: Number(selectedProceso.value),
        es_responsable_principal: true,
      });
    } else {
      await mppStore.saveCargoProceso({
        id_cargo: Number(selectedCargo.value),
        id_proceso: Number(selectedProceso.value),
        es_responsable_principal: true,
      });
    }
    await mppStore.fetchCargoProcesos(selectedProceso.value);
    if (!silent)
      snackbar.value = { show: true, text: "Cargo guardado", color: "success" };
    lastSaved.value = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    if (!silent)
      snackbar.value = { show: true, text: "Error cargo", color: "error" };
    throw e;
  } finally {
    isSaving.value = false;
  }
};

const saveProcessUnits = async (silent = false) => {
  if (!selectedProceso.value) return;
  try {
    isSaving.value = true;
    await mppStore.updateProceso(selectedProceso.value, {
      id_unidades: entityData.value.id_unidades.map((id) => Number(id)),
    });
    await mppStore.fetchProcesos();
    if (!silent)
      snackbar.value = {
        show: true,
        text: "Unidades guardadas",
        color: "success",
      };
    lastSaved.value = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    if (!silent)
      snackbar.value = { show: true, text: "Error unidades", color: "error" };
    throw e;
  } finally {
    isSaving.value = false;
  }
};

const saveProcedureHeader = async (silent = false) => {
  if (!selectedProcedimiento.value) return;
  try {
    isSaving.value = true;
    const procedureId = Number(selectedProcedimiento.value);
    const updates = [
      mppStore.updateProcedimiento(procedureId, { ...procedureHeader.value }),
    ];

    if (selectedNormativa.value) {
      const nId =
        typeof selectedNormativa.value === "object"
          ? selectedNormativa.value.id_normativa || selectedNormativa.value.id
          : Number(selectedNormativa.value);
      if (nId)
        updates.push(
          mppStore.updateNormativa(nId, { id_procedimientos: [procedureId] }),
        );
    }

    await Promise.all(updates);
    await Promise.all([
      mppStore.fetchProcedimientos(selectedProceso.value),
      mppStore.fetchNormativas(),
    ]);

    if (!silent)
      snackbar.value = {
        show: true,
        text: "Datos guardados",
        color: "success",
      };
    lastSaved.value = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    if (!silent)
      snackbar.value = { show: true, text: "Error guardado", color: "error" };
  } finally {
    isSaving.value = false;
  }
};

const handleFullSync = async () => {
  try {
    snackbar.value = {
      show: true,
      text: "Iniciando sincronización...",
      color: "info",
    };
    const resUnidades = await mppStore.syncUnidades();
    if (!resUnidades) throw new Error("Error unidades");
    const resCargos = await mppStore.syncCargos();
    if (resCargos)
      snackbar.value = {
        show: true,
        text: "Sincronización completa",
        color: "success",
      };
    else
      snackbar.value = {
        show: true,
        text: "Error parcial cargos",
        color: "warning",
      };
  } catch (e) {
    snackbar.value = {
      show: true,
      text: "Fallo: " + e.message,
      color: "error",
    };
  }
};

const confirmEstructura = async () => {
  if (!selectedProcedimiento.value) return;
  try {
    isSaving.value = true;
    const deep = [
      saveProcedureHeader(true),
      saveCargoRelation(true),
      saveProcessUnits(true),
    ];
    await Promise.all(deep);

    snackbar.value = {
      show: true,
      text: "Estructura sincronizada, iniciando diseñador...",
      color: "primary",
    };
    isLocked.value = true;
  } catch (e) {
    snackbar.value = {
      show: true,
      text: "Error al iniciar: " + e.message,
      color: "error",
    };
  } finally {
    isSaving.value = false;
  }
};

// --- FILTRADO Y WATCHERS ---

const filteredCargos = computed(() => {
  if (!selectedProceso.value) return [];
  const proceso = mppStore.procesos.find(
    (p) => p.id_proceso === selectedProceso.value,
  );
  if (!proceso || !proceso.unidades) return [];
  const idsUnidadesProceso = proceso.unidades.map((u) => u.id_unidad);
  const unidadesConCargos = mppStore.unidades.filter((u) =>
    idsUnidadesProceso.includes(u.id_unidad),
  );
  const todosLosCargos = unidadesConCargos.flatMap((u) => u.cargos || []);
  return Array.from(
    new Map(todosLosCargos.map((c) => [c.id_cargo, c])).values(),
  );
});

watch(selectedProcedimiento, async (id) => {
  if (id) {
    const proc = mppStore.procedimientos.find((p) => p.id_procedimiento === id);
    if (proc) {
      procedureHeader.value = {
        objetivos: proc.objetivos || "",
        alcance: proc.alcance || "",
        periodicidad: proc.periodicidad || "",
      };

      const linkedNormativa = mppStore.normativas.find((n) =>
        n.procedimientos?.some((p) => p.id_procedimiento === id),
      );
      selectedNormativa.value = linkedNormativa
        ? linkedNormativa.id_normativa
        : null;
    }
    await mppStore.fetchOperaciones();
  }
});

// Auto-Guardado Transparente
watch(
  () => procedureHeader.value,
  () => {
    if (selectedProcedimiento.value && !isSaving.value)
      triggerAutoSave(saveProcedureHeader, 2000);
  },
  { deep: true },
);

watch(selectedNormativa, (newVal, oldVal) => {
  if (selectedProcedimiento.value && !isSaving.value && newVal !== oldVal) {
    triggerAutoSave(saveProcedureHeader, 500);
  }
});

watch(selectedCargo, (newVal) => {
  if (selectedProceso.value && !isSaving.value)
    triggerAutoSave(saveCargoRelation, 500);
});

watch(
  () => entityData.value.id_unidades,
  (newVal) => {
    if (selectedProceso.value && !isSaving.value)
      triggerAutoSave(saveProcessUnits, 800);
  },
  { deep: true },
);

watch(selectedProceso, async (v) => {
  if (!isLocked.value) {
    selectedProcedimiento.value = null;
    selectedCargo.value = null;
    if (v) {
      await mppStore.fetchProcedimientos(v);
      await mppStore.fetchCargoProcesos(v);
      const proceso = mppStore.procesos.find((p) => p.id_proceso === v);
      if (proceso && proceso.unidades)
        entityData.value.id_unidades = proceso.unidades.map((u) => u.id_unidad);
      else entityData.value.id_unidades = [];
    }
  }
});

// --- AUXILIARES UI ---

const getItemTitle = (item) =>
  item?.denominacion ||
  item?.nombre_unidad ||
  item?.nombre ||
  item?.descripcion ||
  "Sin nombre";
const getProcedimientoProps = (item) => ({
  subtitle: item.estado === "Inactivo" ? "Inactivo" : null,
  class: item.estado === "Inactivo" ? "text-grey bg-grey-lighten-4" : "",
});
const isProcedimientoInactivo = computed(
  () =>
    mppStore.procedimientos.find(
      (p) => p.id_procedimiento === selectedProcedimiento.value,
    )?.estado === "Inactivo",
);

// --- DIÁLOGOS CRUD (ENTIDADES) ---

const openDialog = async (type, mode = "create") => {
  entityType.value = type;
  entityMode.value = mode;
  const schema = mppStore.schemas[type];
  const list = type === "proceso" ? mppStore.procesos : mppStore.procedimientos;
  const id = type === "proceso" ? selectedProceso.value : selectedProcedimiento.value;
  const item = list.find((i) => (type === "proceso" ? i.id_proceso : i.id_procedimiento) === id);

  // Inicializar data preservando el estado de unidades que no está en el esquema del modal
  const newData = { 
    id: (mode === "edit" && item) ? (type === "proceso" ? item.id_proceso : item.id_procedimiento) : null,
    id_unidades: entityData.value.id_unidades || []
  };

  schema.fields.forEach(field => {
    if (field.type === "hidden") {
        if (field.key === "id_proceso") newData[field.key] = selectedProceso.value;
    } else {
        // 1. Intentar obtener el valor directo
        newData[field.key] = (mode === "edit" && item && item[field.key] !== undefined) ? item[field.key] : (field.default || (field.type.includes("multiple") ? [] : ""));
        
        // 2. Mapeo automático de Objetos a IDs para campos relacionales (Chameleon Logic)
        if (mode === "edit" && item && field.type === "select-multiple") {
            const relationalKey = field.key.replace("id_", ""); 
            if (item[relationalKey] && Array.isArray(item[relationalKey])) {
                const idKey = field.itemValue || "id";
                newData[field.key] = item[relationalKey].map(obj => obj[idKey]);
            }
        }
    }
  });
  entityData.value = newData;
  showEntityDialog.value = true;
};

const handleSaveEntity = async () => {
  try {
    isSaving.value = true;
    const type = entityType.value;
    const isEdit = entityMode.value === "edit";
    const payload = { ...entityData.value };
    const id = payload.id;
    delete payload.id;

    let result;
    if (isEdit) {
      result = await mppStore.updateEntity(type, id, payload);
    } else {
      result = await mppStore.saveEntity(type, payload);
    }

    if (type === "proceso") {
        await mppStore.fetchProcesos();
        if (!isEdit) selectedProceso.value = result.id_proceso;
    } else {
        await mppStore.fetchProcedimientos(selectedProceso.value);
        if (!isEdit) selectedProcedimiento.value = result.id_procedimiento;
    }

    showEntityDialog.value = false;
    snackbar.value = { show: true, text: "Guardado correctamente", color: "success" };
  } catch (e) {
    snackbar.value = { show: true, text: "Error al guardar", color: "error" };
  } finally {
    isSaving.value = false;
  }
};

const openResourceDialog = (type, mode = "create", item = null) => {
  resourceType.value = type;
  resourceMode.value = mode;
  const schema = mppStore.schemas[type];
  
  const newData = { id: (mode === "edit" && item) ? (item.id_normativa || item.id) : null };
  schema.fields.forEach(field => {
    newData[field.key] = (mode === "edit" && item) ? item[field.key] : (field.default || "");
  });
  resourceData.value = newData;
  showResourceDialog.value = true;
};

const handleSaveResource = async () => {
  try {
    isSaving.value = true;
    const type = resourceType.value;
    const schema = mppStore.schemas[type];
    const isEdit = resourceMode.value === "edit";
    const payload = { ...resourceData.value };
    const id = payload.id;
    delete payload.id;

    let result;
    if (isEdit) {
      result = await mppStore.updateEntity(type, id, payload);
    } else {
      result = await mppStore.saveEntity(type, payload);
    }

    if (type === "normativa" && selectedProcedimiento.value && !isEdit) {
      const procedureId = Number(selectedProcedimiento.value);
      const normativaId = result.id_normativa || result.id;
      await mppStore.updateEntity("normativa", normativaId, { id_procedimientos: [procedureId] });
      selectedNormativa.value = normativaId;
    }

    await mppStore.fetchNormativas();
    showResourceDialog.value = false;
    snackbar.value = { show: true, text: `${schema.title} guardado`, color: "success" };
  } catch (e) {
    snackbar.value = { show: true, text: "Error: " + (e.response?.data?.message || e.message), color: "error" };
  } finally {
    isSaving.value = false;
  }
};

const handleDeleteResource = async () => {
  if (!confirm("¿Está seguro de eliminar?")) return;
  try {
    const type = resourceType.value;
    const id = resourceData.value.id;
    await mppStore.deleteEntity(type, id);
    await mppStore.fetchNormativas();
    if (selectedNormativa.value === id) selectedNormativa.value = null;
    showResourceDialog.value = false;
    snackbar.value = { show: true, text: "Eliminado", color: "success" };
  } catch (e) {
    snackbar.value = { show: true, text: "Error al eliminar", color: "error" };
  }
};

// --- CICLO DE VIDA ---
onMounted(async () => {
  try {
    await mppStore.fetchProcesos();
    await Promise.all([
      mppStore.fetchUnidades(),
      mppStore.fetchCargos(),
      mppStore.fetchNormativas(),
      mppStore.fetchAcciones(),
    ]);
  } catch (e) {
    console.error("Error inicial:", e);
  }
});

onUnmounted(() => {
  if (autoSaveTimer) clearInterval(autoSaveTimer);
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <v-container fluid class="pa-0 fill-height bg-grey-lighten-4 overflow-hidden">
    <!-- PANTALLA 1: CONFIGURADOR -->
    <v-row
      v-if="!isLocked"
      justify="center"
      align="center"
      class="fill-height ma-0"
      style="flex-direction: column; align-content: center"
    >
      <v-col cols="12" sm="10" md="8" lg="5">
        <v-card elevation="12" class="rounded-xl pa-8 border-top-primary">
          <div class="d-flex justify-end mb-n8">
            <v-btn
              icon="mdi-sync"
              color="info"
              variant="text"
              :loading="mppStore.loading"
              @click="handleFullSync"
              title="Sincronizar"
            ></v-btn>
          </div>

          <div class="text-center mb-8">
            <v-avatar color="primary-lighten-5" size="80" class="mb-4"
              ><v-icon size="40" color="primary"
                >mdi-sitemap-outline</v-icon
              ></v-avatar
            >
            <h1 class="text-h4 font-weight-bold grey-darken-3">
              Manual de Procesos y procedimientos
            </h1>
            <p class="text-subtitle-1 text-grey-darken-1">
              Configuración de Estructura
            </p>
          </div>

          <v-row class="px-2">
            <!-- CAMPO 1: PROCESO -->
            <v-col cols="12" class="d-flex align-center mb-1">
              <v-select
                v-model="selectedProceso"
                :items="mppStore.procesos"
                :item-title="getItemTitle"
                item-value="id_proceso"
                label="1. Proceso"
                variant="solo-filled"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-hexagon-multiple-outline"
                class="flex-grow-1"
              ></v-select>
              <div class="ml-2 d-flex">
                <v-btn icon color="primary" variant="tonal" size="small" @click="openDialog('proceso')" class="mr-1"><v-icon>mdi-plus</v-icon></v-btn>
                <v-btn icon color="info" variant="tonal" size="small" :disabled="!selectedProceso" @click="openDialog('proceso', 'edit')"><v-icon>mdi-pencil</v-icon></v-btn>
              </div>
            </v-col>

            <!-- CAMPO 2: UNIDAD RESPONSABLE -->
            <v-col cols="12" class="d-flex align-center mb-1">
              <v-select
                v-model="entityData.id_unidades"
                :items="mppStore.unidades"
                :item-title="getItemTitle"
                item-value="id_unidad"
                label="2. Unidades Responsables"
                variant="solo-filled"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-domain"
                multiple
                chips
                closable-chips
                class="flex-grow-1"
                :disabled="!selectedProceso"
              ></v-select>
            </v-col>

            <!-- CAMPO 3: RESPONSABLE PRINCIPAL -->
            <v-col cols="12" class="d-flex align-center mb-1" v-if="selectedProceso">
              <v-select
                v-model="selectedCargo"
                :items="filteredCargos"
                :item-title="getItemTitle"
                item-value="id_cargo"
                label="3. Responsable Principal"
                variant="solo-filled"
                density="compact"
                hide-details
                prepend-inner-icon="mdi-account-tie-outline"
                class="flex-grow-1"
              ></v-select>
            </v-col>

            <!-- CAMPO 4: PROCEDIMIENTO -->
            <v-col cols="12" class="d-flex align-center mb-1">
              <v-select
                v-model="selectedProcedimiento"
                :items="mppStore.procedimientos"
                :item-title="getItemTitle"
                item-value="id_procedimiento"
                :item-props="getProcedimientoProps"
                label="4. Procedimiento"
                variant="solo-filled"
                density="compact"
                :disabled="!selectedProceso"
                hide-details
                prepend-inner-icon="mdi-file-edit-outline"
                class="flex-grow-1"
              ></v-select>
              <div class="ml-2 d-flex">
                <v-btn icon color="primary" variant="tonal" size="small" @click="openDialog('procedimiento')" class="mr-1"><v-icon>mdi-plus</v-icon></v-btn>
                <v-btn icon color="info" variant="tonal" size="small" :disabled="!selectedProcedimiento" @click="openDialog('procedimiento', 'edit')"><v-icon>mdi-pencil</v-icon></v-btn>
              </div>
            </v-col>

            <!-- BLOQUE DETALLES (5-8) -->
            <v-expand-transition>
              <v-col cols="12" v-if="selectedProcedimiento" class="pt-0">
                <v-row dense>
                  <v-col cols="12" class="d-flex align-center mb-1">
                    <v-text-field v-model="procedureHeader.periodicidad" label="5. Periodicidad" variant="solo-filled" density="compact" hide-details prepend-inner-icon="mdi-calendar-sync" class="flex-grow-1"></v-text-field>
                  </v-col>
                  <v-col cols="12" class="d-flex align-start mb-1">
                    <v-textarea v-model="procedureHeader.objetivos" label="6. Objetivo" variant="solo-filled" density="compact" rows="2" hide-details prepend-inner-icon="mdi-target-variant" class="flex-grow-1"></v-textarea>
                  </v-col>
                  <v-col cols="12" class="d-flex align-center mb-1">
                    <v-select v-model="selectedNormativa" :items="mppStore.normativas" item-title="nombre" item-value="id_normativa" label="7. Marco Normativo" variant="solo-filled" density="compact" hide-details prepend-inner-icon="mdi-gavel" class="flex-grow-1"></v-select>
                    <div class="ml-2 d-flex">
                      <v-btn icon color="primary" variant="tonal" size="small" @click="openResourceDialog('normativa')" class="mr-1"><v-icon>mdi-plus</v-icon></v-btn>
                      <v-btn icon color="info" variant="tonal" size="small" :disabled="!selectedNormativa" @click="openResourceDialog('normativa', 'edit', mppStore.normativas.find(n => n.id_normativa === selectedNormativa))"><v-icon>mdi-pencil</v-icon></v-btn>
                    </div>
                  </v-col>
                  <v-col cols="12" class="d-flex align-start">
                    <v-textarea v-model="procedureHeader.alcance" label="8. Alcance" variant="solo-filled" density="compact" rows="2" hide-details prepend-inner-icon="mdi-arrow-expand-all" class="flex-grow-1"></v-textarea>
                  </v-col>
                </v-row>
              </v-col>
            </v-expand-transition>
          </v-row>

          <v-btn color="primary" block size="x-large" class="mt-6 rounded-lg font-weight-bold text-uppercase" :disabled="!selectedProcedimiento || isProcedimientoInactivo || !selectedCargo" @click="confirmEstructura" height="60">Comenzar Diseño</v-btn>
        </v-card>
      </v-col>
    </v-row>

    <!-- PANTALLA 2: DISEÑADOR MATRIZ -->
    <DisenadorMatriz 
        v-else 
        :procesoId="selectedProceso" 
        :procedimientoId="selectedProcedimiento" 
        :cargoId="selectedCargo" 
        :unidadesIds="entityData.id_unidades"
        @back="isLocked = false"
    />

    <!-- MODALES UNIFICADOS (Chameleon Engine) -->
    <v-dialog v-model="showEntityDialog" max-width="600px">
      <v-card class="rounded-xl pa-4" v-if="entityType && mppStore.schemas[entityType]">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-2">{{ mppStore.schemas[entityType].icon }}</v-icon>
          {{ entityMode === "create" ? "Nuevo" : "Editar" }} {{ mppStore.schemas[entityType].title.toUpperCase() }}
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col v-for="field in mppStore.schemas[entityType].fields.filter(f => f.type !== 'hidden')" :key="field.key" cols="12">
              <v-text-field v-if="['text', 'date'].includes(field.type)" v-model="entityData[field.key]" :label="field.label" :type="field.type" variant="outlined" density="compact"></v-text-field>
              <v-textarea v-else-if="field.type === 'textarea'" v-model="entityData[field.key]" :label="field.label" variant="outlined" density="compact" rows="2"></v-textarea>
              <v-select v-else-if="field.type === 'select-multiple'" v-model="entityData[field.key]" :items="mppStore[field.optionsSource]" :item-title="field.itemTitle" :item-value="field.itemValue" :label="field.label" multiple chips closable-chips variant="outlined" density="compact"></v-select>
              <v-select v-else-if="field.type === 'select'" v-model="entityData[field.key]" :items="field.options" :label="field.label" variant="outlined" density="compact"></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showEntityDialog = false" class="rounded-lg text-uppercase">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveEntity" :loading="isSaving" class="rounded-lg px-6 text-uppercase">Guardar {{ mppStore.schemas[entityType].title }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showResourceDialog" max-width="600px">
      <v-card class="rounded-xl pa-4" v-if="resourceType && mppStore.schemas[resourceType]">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-2">{{ mppStore.schemas[resourceType].icon }}</v-icon>
          {{ resourceMode === "create" ? "Nuevo" : "Editar" }} {{ mppStore.schemas[resourceType].title.toUpperCase() }}
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col v-for="field in mppStore.schemas[resourceType].fields" :key="field.key" cols="12">
              <v-text-field v-if="['text', 'date'].includes(field.type)" v-model="resourceData[field.key]" :label="field.label" :type="field.type" variant="outlined" density="compact"></v-text-field>
              <v-textarea v-else-if="field.type === 'textarea'" v-model="resourceData[field.key]" :label="field.label" variant="outlined" density="compact" rows="3"></v-textarea>
              <v-select v-else-if="field.type === 'select'" v-model="resourceData[field.key]" :items="field.options" :label="field.label" variant="outlined" density="compact"></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-btn v-if="resourceMode === 'edit'" color="error" variant="text" @click="handleDeleteResource" class="rounded-lg text-uppercase">Eliminar</v-btn>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showResourceDialog = false" class="rounded-lg text-uppercase">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSaveResource" :loading="isSaving" class="rounded-lg px-6 text-uppercase">Guardar {{ mppStore.schemas[resourceType].title }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">{{ snackbar.text }}</v-snackbar>
  </v-container>
</template>

<style scoped>
.fill-height { height: 100vh; }
.border-top-primary { border-top: 8px solid #6366f1 !important; }
</style>

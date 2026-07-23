<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMppCoreStore } from "@/stores/mpp_core";
import { rules } from "@/utils/rules";
import MatrizMpp from "./MatrizMpp.vue";
import PieMpp from "./PieMpp.vue";

const route = useRoute();
const router = useRouter();
const mppStore = useMppCoreStore();

const handleExit = () => {
  router.push("/mpp/historial-mpp");
};

// --- ESTADOS DE UI Y NAVEGACIÓN ---
const step = ref(1);

// --- VALIDACIONES DE NAVEGACIÓN (Bloqueo de Siguiente/Comenzar) ---
const isStep1Valid = computed(() => !!selectedProceso.value && !!selectedProcedimiento.value);
const isStep2Valid = computed(() => (entityData.value.id_unidades?.length > 0) && !!selectedCargo.value);
const isStep3Valid = computed(() => 
    !!procedureHeader.value.periodicidad && 
    !!procedureHeader.value.objetivos && 
    !!procedureHeader.value.alcance &&
    !!selectedNormativa.value
);
const canStartDesign = computed(() => isStep1Valid.value && isStep2Valid.value && isStep3Valid.value && !isProcedimientoInactivo.value);

const isLocked = ref(false);
const currentScreen = ref("setup"); // "setup", "matrix", "complementary"
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

const procedureHeader = ref({ objetivos: "", alcance: "", periodicidad: "", estado_version: "Borrador" });

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
    const existing = mppStore.cargoProcesos.find((cp) => cp.es_responsable_principal);
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
    lastSaved.value = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    if (!silent) snackbar.value = { show: true, text: "ERROR CARGO", color: "error" };
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
    lastSaved.value = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    if (!silent) snackbar.value = { show: true, text: "ERROR UNIDADES", color: "error" };
    throw e;
  } finally {
    isSaving.value = false;
  }
};

const saveProcedureHeader = async (silent = false) => {
  if (!selectedProcedimiento.value) return;
  try {
    const procedureId = Number(selectedProcedimiento.value);
    const payload = {
      ...procedureHeader.value,
      estado: procedureHeader.value.estado_version || "Borrador"
    };
    const updates = [mppStore.updateProcedimiento(procedureId, payload)];

    if (selectedNormativa.value) {
      const nId = typeof selectedNormativa.value === "object" ? selectedNormativa.value.id_normativa || selectedNormativa.value.id : Number(selectedNormativa.value);
      if (nId) updates.push(mppStore.updateNormativa(nId, { id_procedimientos: [procedureId] }));
    }

    await Promise.all(updates);
    await Promise.all([mppStore.fetchProcedimientos(selectedProceso.value), mppStore.fetchNormativas()]);
    lastSaved.value = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    if (!silent) snackbar.value = { show: true, text: "ERROR GUARDADO", color: "error" };
  } finally {
    isSaving.value = false;
  }
};

const handleFullSync = async () => {
  try {
    snackbar.value = { show: true, text: "INICIANDO SINCRONIZACIÓN...", color: "info" };
    const resUnidades = await mppStore.syncUnidades();
    if (!resUnidades) throw new Error("ERROR UNIDADES");
    const resCargos = await mppStore.syncCargos();
    if (resCargos) snackbar.value = { show: true, text: "SINCRONIZACIÓN COMPLETA", color: "success" };
    else snackbar.value = { show: true, text: "ERROR PARCIAL CARGOS", color: "warning" };
  } catch (e) {
    snackbar.value = { show: true, text: "FALLO: " + e.message, color: "error" };
  }
};

const confirmEstructura = async () => {
  if (!selectedProcedimiento.value) return;
  try {
    isSaving.value = true;
    await Promise.all([saveProcedureHeader(true), saveCargoRelation(true), saveProcessUnits(true)]);
    snackbar.value = { show: true, text: "ESTRUCTURA SINCRONIZADA", color: "primary" };
    isLocked.value = true;
    currentScreen.value = "matrix";
  } catch (e) {
    snackbar.value = { show: true, text: "ERROR AL INICIAR: " + e.message, color: "error" };
  } finally {
    isSaving.value = false;
  }
};

// --- FILTRADO Y WATCHERS ---
const filteredCargos = computed(() => {
  if (!selectedProceso.value) return [];
  const proceso = mppStore.procesos.find((p) => p.id_proceso === selectedProceso.value);
  if (!proceso || !proceso.unidades) return [];
  const idsUnidadesProceso = proceso.unidades.map((u) => u.id_unidad);
  const unidadesConCargos = mppStore.unidades.filter((u) => idsUnidadesProceso.includes(u.id_unidad));

  return unidadesConCargos.flatMap((u) => 
    (u.cargos || []).map(c => ({ 
        ...c, 
        nombre_unidad_display: u.nombre || u.nombre_unidad || "Unidad desconocida"
    }))
  );
});

// ... resto de watchers ...
watch(selectedProcedimiento, async (id) => {
  if (id) {
    const proc = mppStore.procedimientos.find((p) => p.id_procedimiento === id);
    if (proc) {
      procedureHeader.value = { 
        objetivos: proc.objetivos || "", 
        alcance: proc.alcance || "", 
        periodicidad: proc.periodicidad || "",
        estado_version: proc.estado_version || proc.estado || "Borrador"
      };
      const linkedNormativa = mppStore.normativas.find((n) => n.procedimientos?.some((p) => p.id_procedimiento === id));
      selectedNormativa.value = linkedNormativa ? linkedNormativa.id_normativa : null;
    }
    await mppStore.fetchOperaciones();
  }
});

watch(() => procedureHeader.value, () => { if (selectedProcedimiento.value && !isSaving.value) triggerAutoSave(saveProcedureHeader, 2000); }, { deep: true });
watch(selectedNormativa, (newVal, oldVal) => { if (selectedProcedimiento.value && !isSaving.value && newVal !== oldVal) triggerAutoSave(saveProcedureHeader, 500); });
watch(selectedCargo, (newVal) => { if (selectedProceso.value && !isSaving.value) triggerAutoSave(saveCargoRelation, 500); });
watch(() => entityData.value.id_unidades, (newVal) => { if (selectedProceso.value && !isSaving.value) triggerAutoSave(saveProcessUnits, 800); }, { deep: true });

watch(selectedProceso, async (v) => {
  if (!isLocked.value) {
    selectedProcedimiento.value = null;
    selectedCargo.value = null;
    if (v) {
      await Promise.all([
        mppStore.fetchProcedimientos(v),
        mppStore.fetchCargoProcesos(v)
      ]);
      
      // Auto-seleccionar el responsable principal guardado en DB
      const responsible = mppStore.cargoProcesos.find(cp => cp.es_responsable_principal);
      if (responsible) {
          selectedCargo.value = responsible.cargo?.id_cargo || responsible.id_cargo;
      }

      const proceso = mppStore.procesos.find((p) => p.id_proceso === v);
      if (proceso && proceso.unidades) entityData.value.id_unidades = proceso.unidades.map((u) => u.id_unidad);
      else entityData.value.id_unidades = [];
    }
  }
});

// --- AUXILIARES UI ---
const getItemTitle = (item) => item?.denominacion || item?.nombre_unidad || item?.nombre || item?.descripcion || "Sin nombre";

const selectedProcesoObj = computed(() => {
  if (!selectedProceso.value) return null;
  return mppStore.procesos.find((p) => p.id_proceso === selectedProceso.value) || null;
});

const selectedCargoObj = computed(() => {
  if (!selectedCargo.value) return null;
  return filteredCargos.value.find((c) => c.id_cargo === selectedCargo.value) || null;
});

const selectedNormativaObj = computed(() => {
  if (!selectedNormativa.value) return null;
  const nId = typeof selectedNormativa.value === "object" ? selectedNormativa.value.id_normativa || selectedNormativa.value.id : Number(selectedNormativa.value);
  return mppStore.normativas.find((n) => n.id_normativa === nId) || null;
});

const selectedUnidadesObjs = computed(() => {
  if (!entityData.value.id_unidades || entityData.value.id_unidades.length === 0) return [];
  return mppStore.unidades.filter((u) => entityData.value.id_unidades.map(id => Number(id)).includes(u.id_unidad));
});

const selectedProcedimientoObj = computed(() => {
  if (!selectedProcedimiento.value) return null;
  return mppStore.procedimientos.find((p) => p.id_procedimiento === selectedProcedimiento.value) || null;
});

watch(
  selectedProcedimientoObj,
  (proc) => {
    if (proc && !isSaving.value) {
      procedureHeader.value = {
        ...procedureHeader.value,
        estado_version: proc.estado_version || proc.estado || "Borrador",
      };
    }
  },
  { deep: true, immediate: true }
);

const selectedProcedimientoStatus = computed(() => {
  if (!selectedProcedimientoObj.value) return "Borrador";
  return selectedProcedimientoObj.value.estado_version || selectedProcedimientoObj.value.estado || "Borrador";
});

const selectedProcedimientoStatusColor = computed(() => {
  const st = selectedProcedimientoStatus.value;
  if (st === "Aprobado" || st === "Activo") return "success";
  if (st === "En Revisión") return "info";
  if (st === "Borrador") return "warning";
  return "grey";
});

const getProcedimientoProps = (item) => {
  const st = item.estado_version || item.estado || "Borrador";
  return {
    subtitle: `v${item.version || "1.0"} • Estado: ${st}`,
    class: st === "Obsoleto" || item.estado === "Inactivo" ? "text-slate-500 bg-slate-50" : ""
  };
};

const isProcedimientoInactivo = computed(() => {
  const st = selectedProcedimientoStatus.value;
  return st === "Obsoleto" || mppStore.procedimientos.find((p) => p.id_procedimiento === selectedProcedimiento.value)?.estado === "Inactivo";
});

// --- DIÁLOGOS CRUD (ENTIDADES) ---
const openDialog = async (type, mode = "create") => {
  entityType.value = type;
  entityMode.value = mode;
  const schema = mppStore.schemas[type];
  const list = type === "proceso" ? mppStore.procesos : mppStore.procedimientos;
  const id = type === "proceso" ? selectedProceso.value : selectedProcedimiento.value;
  
  let item = null;
  if (mode === "edit" && id) {
    item = list.find((i) => {
        const itemId = type === "proceso" ? i.id_proceso : i.id_procedimiento;
        return itemId === id;
    });
  }

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
            const relationalKey = field.key.replace("id_", ""); // ej: id_instalaciones -> instalaciones
            if (item[relationalKey] && Array.isArray(item[relationalKey])) {
                // Extraer el ID correcto basándose en la fuente de opciones
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

    // Refrescar y auto-seleccionar
    if (type === "proceso") {
        await mppStore.fetchProcesos();
        if (!isEdit) selectedProceso.value = result.id_proceso;
    } else {
        await mppStore.fetchProcedimientos(selectedProceso.value);
        if (!isEdit) selectedProcedimiento.value = result.id_procedimiento;
    }

    showEntityDialog.value = false;
    snackbar.value = { show: true, text: "GUARDADO CORRECTAMENTE", color: "success" };
  } catch (e) {
    snackbar.value = { show: true, text: "ERROR AL GUARDAR", color: "error" };
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

    // Link automático con procedimiento si es normativa
    if (type === "normativa" && selectedProcedimiento.value && !isEdit) {
      const procedureId = Number(selectedProcedimiento.value);
      const normativaId = result.id_normativa || result.id;
      await mppStore.updateEntity("normativa", normativaId, { id_procedimientos: [procedureId] });
      selectedNormativa.value = normativaId;
    }

    await Promise.all([mppStore.fetchNormativas()]);
    showResourceDialog.value = false;
    snackbar.value = { show: true, text: `${schema.title.toUpperCase()} GUARDADO`, color: "success" };
  } catch (e) {
    snackbar.value = { show: true, text: "ERROR: " + (e.response?.data?.message || e.message), color: "error" };
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
    snackbar.value = { show: true, text: "ELIMINADO", color: "success" };
  } catch (e) {
    snackbar.value = { show: true, text: "ERROR AL ELIMINAR", color: "error" };
  }
};

onMounted(async () => {
  try {
    await mppStore.fetchProcesos();
    await Promise.all([mppStore.fetchUnidades(), mppStore.fetchCargos(), mppStore.fetchNormativas(), mppStore.fetchAcciones()]);
    
    if (route.query.procesoId) {
      selectedProceso.value = Number(route.query.procesoId);
      await Promise.all([
        mppStore.fetchProcedimientos(selectedProceso.value),
        mppStore.fetchCargoProcesos(selectedProceso.value)
      ]);
      if (route.query.procedimientoId) {
        selectedProcedimiento.value = Number(route.query.procedimientoId);
      }
    }
  } catch (e) { console.error("Error inicial:", e); }
});

onUnmounted(() => {
  if (debounceTimer) clearTimeout(debounceTimer);
});
</script>

<template>
  <v-container fluid class="pa-0 fill-height bg-slate-50 overflow-hidden d-flex flex-column">
    <!-- PANTALLA 1: GESTIÓN POR PASOS INTEGRADA FULL-WIDTH -->
    <template v-if="currentScreen === 'setup'">
      <!-- HEADER CORPORATIVO FULL-WIDTH -->
      <v-sheet color="surface" elevation="1" class="px-6 py-3 border-b flex-shrink-0">
        <div class="d-flex align-center justify-space-between flex-wrap ga-3">
          <div class="d-flex align-center">
            <v-avatar color="primary-lighten-5" class="mr-3 rounded-lg" size="44">
              <v-icon color="primary" size="24">mdi-sitemap</v-icon>
            </v-avatar>
            <div>
              <div class="text-h6 font-weight-bold grey-darken-3 leading-tight">
                Arquitectura de Procesos y Procedimientos
              </div>
              <div class="text-caption text-grey-darken-1">
                Configure la estructura organizativa, responsabilidades y marco normativo del documento
              </div>
            </div>
          </div>

          <div class="d-flex align-center ga-3">
            <v-chip v-if="lastSaved" color="success" size="small" variant="tonal" class="text-uppercase font-weight-bold">
              <v-icon start size="14">mdi-check-circle</v-icon>
              Sincronizado: {{ lastSaved }}
            </v-chip>
            <v-btn
              prepend-icon="mdi-sync"
              color="primary"
              variant="tonal"
              size="small"
              class="rounded-lg text-none"
              :loading="mppStore.loading"
              @click="handleFullSync"
            >
              Sincronizar Datos
            </v-btn>
          </div>
        </div>

        <!-- BARRA DE PASOS ENLAZADOS (STEPS PIPELINE) -->
        <v-divider class="my-3"></v-divider>
        <div class="d-flex align-center justify-space-between ga-2 flex-wrap">
          <div
            v-for="(stTitle, stIdx) in ['1. Contexto & Selección', '2. Unidades & Responsables', '3. Detalles Técnicos & Normativa']"
            :key="stIdx"
            class="step-pipeline-item flex-grow-1 cursor-pointer pa-2 px-3 rounded-lg d-flex align-center ga-3 transition-all"
            :class="[
              step === stIdx + 1 ? 'bg-primary-lighten-5 border-primary-active' : 'bg-surface border-subtle',
              (stIdx === 0 ? isStep1Valid : stIdx === 1 ? isStep2Valid : isStep3Valid) ? 'step-completed' : ''
            ]"
            @click="step = stIdx + 1"
          >
            <v-avatar
              size="28"
              :color="step === stIdx + 1 ? 'primary' : (stIdx === 0 ? isStep1Valid : stIdx === 1 ? isStep2Valid : isStep3Valid) ? 'success' : 'grey-lighten-2'"
              class="text-caption font-weight-bold"
            >
              <v-icon v-if="(stIdx === 0 ? isStep1Valid : stIdx === 1 ? isStep2Valid : isStep3Valid) && step !== stIdx + 1" size="16">mdi-check</v-icon>
              <span v-else>{{ stIdx + 1 }}</span>
            </v-avatar>
            <div class="text-body-2 font-weight-bold" :class="step === stIdx + 1 ? 'text-primary' : 'text-grey-darken-2'">
              {{ stTitle }}
            </div>
          </div>
        </div>
      </v-sheet>

      <!-- ÁREA DE TRABAJO EN DOS COLUMNAS (SPLIT VIEW 100% ANCHO) -->
      <v-container fluid class="pa-6 flex-grow-1 overflow-y-auto">
        <v-row dense class="fill-height ma-0">
          <!-- COLUMNA IZQUIERDA: FORMULARIO DEL PASO ACTUAL -->
          <v-col cols="12" lg="7" xl="7" class="pr-lg-3">
            <v-card elevation="2" class="rounded-xl border pa-6 fill-height d-flex flex-column justify-space-between bg-white">
              <div>
                <!-- PASO 1: CONTEXTO -->
                <div v-if="step === 1">
                  <div class="d-flex align-center mb-4">
                    <v-icon color="primary" class="mr-2">mdi-hexagon-multiple-outline</v-icon>
                    <h3 class="text-h6 font-weight-bold">Paso 1: Contexto de Proceso y Procedimiento</h3>
                  </div>

                  <v-row>
                    <v-col cols="12">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary">Proceso Principal</div>
                      <div class="d-flex align-center ga-2">
                        <v-select
                          v-model="selectedProceso"
                          :items="mppStore.procesos"
                          :item-title="getItemTitle"
                          item-value="id_proceso"
                          label="Seleccione el Proceso"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-hexagon-multiple-outline"
                          class="flex-grow-1"
                          :rules="[rules.required]"
                        ></v-select>
                        <v-btn icon color="primary" variant="tonal" size="small" @click="openDialog('proceso')" title="Crear Proceso"><v-icon size="18">mdi-plus</v-icon></v-btn>
                        <v-btn icon color="info" variant="tonal" size="small" :disabled="!selectedProceso" @click="openDialog('proceso', 'edit')" title="Editar Proceso"><v-icon size="18">mdi-pencil</v-icon></v-btn>
                      </div>
                    </v-col>

                    <v-col cols="12" class="mt-2">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary d-flex align-center justify-space-between">
                        <span>Procedimiento Asociado</span>
                        <div v-if="selectedProcedimientoObj" class="d-flex align-center ga-1">
                          <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">v{{ selectedProcedimientoObj.version || "1.0" }}</v-chip>
                          <v-chip size="x-small" :color="selectedProcedimientoStatusColor" variant="tonal" class="font-weight-bold text-uppercase">{{ selectedProcedimientoStatus }}</v-chip>
                        </div>
                      </div>
                      <div class="d-flex align-center ga-2">
                        <v-select
                          v-model="selectedProcedimiento"
                          :items="mppStore.procedimientos"
                          :item-title="getItemTitle"
                          item-value="id_procedimiento"
                          :item-props="getProcedimientoProps"
                          label="Seleccione el Procedimiento"
                          variant="outlined"
                          density="comfortable"
                          :disabled="!selectedProceso"
                          prepend-inner-icon="mdi-file-edit-outline"
                          class="flex-grow-1"
                          :rules="[rules.required]"
                        ></v-select>
                        <v-btn icon color="primary" variant="tonal" size="small" :disabled="!selectedProceso" @click="openDialog('procedimiento')" title="Crear Procedimiento"><v-icon size="18">mdi-plus</v-icon></v-btn>
                        <v-btn icon color="info" variant="tonal" size="small" :disabled="!selectedProcedimiento" @click="openDialog('procedimiento', 'edit')" title="Editar Procedimiento"><v-icon size="18">mdi-pencil</v-icon></v-btn>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <!-- PASO 2: RESPONSABLES -->
                <div v-else-if="step === 2">
                  <div class="d-flex align-center mb-4">
                    <v-icon color="primary" class="mr-2">mdi-account-group-outline</v-icon>
                    <h3 class="text-h6 font-weight-bold">Paso 2: Unidades Organizacionales y Cargo Responsable</h3>
                  </div>

                  <v-row>
                    <v-col cols="12">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary">Unidades Participantes</div>
                      <v-select
                        v-model="entityData.id_unidades"
                        :items="mppStore.unidades"
                        :item-title="getItemTitle"
                        item-value="id_unidad"
                        label="Seleccione las Unidades"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-domain"
                        multiple
                        chips
                        closable-chips
                        :disabled="!selectedProceso"
                        :rules="[v => (v && v.length > 0) || 'Seleccione al menos una unidad']"
                      ></v-select>
                    </v-col>

                    <v-col cols="12" class="mt-2">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary">Cargo Responsable Principal</div>
                      <v-select
                        v-model="selectedCargo"
                        :items="filteredCargos"
                        :item-title="getItemTitle"
                        item-value="id_cargo"
                        label="Seleccione el Cargo Responsable"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-account-tie-outline"
                        :disabled="!selectedProceso"
                        :rules="[rules.required]"
                      >
                        <template v-slot:item="{ props, item }">
                          <v-list-item v-bind="props">
                            <template v-slot:subtitle>
                              <span class="text-caption font-italic text-grey-darken-1">{{ item.raw.nombre_unidad_display }}</span>
                            </template>
                          </v-list-item>
                        </template>
                      </v-select>
                    </v-col>
                  </v-row>
                </div>

                <!-- PASO 3: DETALLES TÉCNICOS -->
                <div v-else-if="step === 3">
                  <div class="d-flex align-center mb-4">
                    <v-icon color="primary" class="mr-2">mdi-file-document-edit-outline</v-icon>
                    <h3 class="text-h6 font-weight-bold">Paso 3: Parámetros Técnicos y Marco Normativo</h3>
                  </div>

                  <v-row dense>
                    <v-col cols="12" sm="6">
                      <v-text-field
                        v-model="procedureHeader.periodicidad"
                        label="Periodicidad de Revisión"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar-sync"
                        placeholder="Ej: Anual, Semestral"
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6">
                      <v-select
                        v-model="procedureHeader.estado_version"
                        :items="['Borrador', 'En Revisión', 'Aprobado', 'Obsoleto']"
                        label="Estado de Versión"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-label-outline"
                        :rules="[rules.required]"
                      ></v-select>
                    </v-col>
                    <v-col cols="12">
                      <div class="d-flex align-center ga-2">
                        <v-select
                          v-model="selectedNormativa"
                          :items="mppStore.normativas"
                          item-title="nombre"
                          item-value="id_normativa"
                          label="Marco Normativo Aplicable"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-gavel"
                          class="flex-grow-1"
                          :rules="[rules.required]"
                        ></v-select>
                        <v-btn icon color="primary" variant="tonal" size="small" @click="openResourceDialog('normativa')" title="Crear Normativa"><v-icon size="18">mdi-plus</v-icon></v-btn>
                        <v-btn icon color="info" variant="tonal" size="small" :disabled="!selectedNormativa" @click="openResourceDialog('normativa', 'edit', mppStore.normativas.find(n => n.id_normativa === selectedNormativa))" title="Editar Normativa"><v-icon size="18">mdi-pencil</v-icon></v-btn>
                      </div>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="procedureHeader.objetivos"
                        label="Objetivo del Procedimiento"
                        variant="outlined"
                        density="comfortable"
                        rows="2"
                        prepend-inner-icon="mdi-target-variant"
                        auto-grow
                        :rules="[rules.required]"
                      ></v-textarea>
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="procedureHeader.alcance"
                        label="Alcance del Procedimiento"
                        variant="outlined"
                        density="comfortable"
                        rows="2"
                        prepend-inner-icon="mdi-arrow-expand-all"
                        auto-grow
                        :rules="[rules.required]"
                      ></v-textarea>
                    </v-col>
                  </v-row>
                </div>
              </div>

              <!-- CONTROLES NAVEGACIÓN PASOS -->
              <div class="d-flex align-center justify-space-between pt-4 border-t mt-4">
                <v-btn
                  v-if="step > 1"
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-arrow-left"
                  class="rounded-lg font-weight-bold text-uppercase text-caption"
                  @click="step--"
                >
                  Anterior
                </v-btn>
                <div v-else></div>

                <v-btn
                  v-if="step < 3"
                  color="primary"
                  variant="flat"
                  append-icon="mdi-arrow-right"
                  class="rounded-lg font-weight-bold text-uppercase text-caption px-6"
                  :disabled="step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : false"
                  @click="step++"
                >
                  Siguiente
                </v-btn>
              </div>
            </v-card>
          </v-col>

          <!-- COLUMNA DERECHA: FICHA RESUMEN EN TIEMPO REAL -->
          <v-col cols="12" lg="5" xl="5" class="pl-lg-3 mt-4 mt-lg-0">
            <v-card elevation="3" class="rounded-xl border pa-6 fill-height d-flex flex-column justify-space-between bg-gradient-sidebar">
              <div>
                <div class="d-flex align-center justify-space-between mb-4 pb-2 border-b">
                  <div class="d-flex align-center">
                    <v-icon color="primary" class="mr-2">mdi-card-bulleted-settings-outline</v-icon>
                    <h3 class="text-h6 font-weight-bold text-slate-800">Resumen de Configuración</h3>
                  </div>
                  <v-chip
                    size="small"
                    :color="canStartDesign ? 'success' : 'warning'"
                    variant="tonal"
                    class="font-weight-bold text-uppercase"
                  >
                    {{ canStartDesign ? 'Listo para Matriz' : 'Incompleto' }}
                  </v-chip>
                </div>

                <!-- FICHA DE COMPONENTES -->
                <div class="d-flex flex-column ga-3">
                  <!-- PROCESO -->
                  <div class="pa-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-1">Proceso</div>
                    <div v-if="selectedProcesoObj" class="d-flex align-center">
                      <v-icon color="primary" size="20" class="mr-2">mdi-hexagon-multiple</v-icon>
                      <span class="font-weight-bold text-body-2 text-slate-900">{{ getItemTitle(selectedProcesoObj) }}</span>
                    </div>
                    <div v-else class="text-caption font-italic text-grey-medium">Sin proceso seleccionado</div>
                  </div>

                  <!-- PROCEDIMIENTO & ESTADO -->
                  <div class="pa-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-1">Procedimiento</div>
                    <div v-if="selectedProcedimientoObj">
                      <div class="d-flex align-center mb-1">
                        <v-icon color="primary" size="20" class="mr-2">mdi-file-document-outline</v-icon>
                        <span class="font-weight-bold text-body-2 text-slate-900">{{ getItemTitle(selectedProcedimientoObj) }}</span>
                      </div>
                      <div class="d-flex ga-2 mt-2">
                        <v-chip size="x-small" color="primary" variant="flat">v{{ selectedProcedimientoObj.version || "1.0" }}</v-chip>
                        <v-chip size="x-small" :color="selectedProcedimientoStatusColor" variant="tonal" class="font-weight-bold">{{ selectedProcedimientoStatus }}</v-chip>
                      </div>
                    </div>
                    <div v-else class="text-caption font-italic text-grey-medium">Sin procedimiento seleccionado</div>
                  </div>

                  <!-- UNIDADES & CARGO RESPONSABLE -->
                  <div class="pa-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-1">Responsables y Unidades</div>
                    <div v-if="selectedCargoObj || selectedUnidadesObjs.length > 0">
                      <div v-if="selectedCargoObj" class="d-flex align-center mb-2">
                        <v-icon color="indigo-darken-1" size="20" class="mr-2">mdi-account-tie</v-icon>
                        <div>
                          <div class="font-weight-bold text-body-2 text-slate-900">{{ getItemTitle(selectedCargoObj) }}</div>
                          <div class="text-caption text-grey-darken-1 font-italic">{{ selectedCargoObj.nombre_unidad_display }}</div>
                        </div>
                      </div>
                      <div v-if="selectedUnidadesObjs.length > 0" class="d-flex flex-wrap ga-1 mt-1">
                        <v-chip v-for="u in selectedUnidadesObjs" :key="u.id_unidad" size="x-small" color="secondary" variant="tonal" prepend-icon="mdi-domain">
                          {{ getItemTitle(u) }}
                        </v-chip>
                      </div>
                    </div>
                    <div v-else class="text-caption font-italic text-grey-medium">Sin responsable/unidades asignadas</div>
                  </div>

                  <!-- MARCO NORMATIVO Y DETALLES -->
                  <div class="pa-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-1">Detalles Técnicos</div>
                    <div class="d-flex flex-column ga-1 text-caption">
                      <div><strong class="text-slate-700">Periodicidad:</strong> {{ procedureHeader.periodicidad || '—' }}</div>
                      <div><strong class="text-slate-700">Normativa:</strong> {{ selectedNormativaObj ? selectedNormativaObj.nombre : '—' }}</div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BOTÓN PRINCIPAL HÉROE -->
              <div class="pt-4 border-t mt-4">
                <v-btn
                  color="primary"
                  block
                  size="x-large"
                  class="rounded-xl font-weight-bold text-uppercase shadow-lg"
                  height="56"
                  prepend-icon="mdi-vector-combine"
                  :disabled="!canStartDesign"
                  @click="confirmEstructura"
                  :loading="isSaving"
                >
                  Comenzar diseño de matriz
                </v-btn>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </v-container>
    </template>

    <!-- PANTALLA 2: DISEÑADOR MATRIZ -->
    <MatrizMpp 
        v-else-if="currentScreen === 'matrix'" 
        :procesoId="selectedProceso" 
        :procedimientoId="selectedProcedimiento" 
        :cargoId="selectedCargo" 
        :unidadesIds="entityData.id_unidades" 
        @back="currentScreen = 'setup'; isLocked = false;" 
        @finalize="currentScreen = 'complementary'"
    />

    <!-- PANTALLA 3: FORMULARIO COMPLEMENTARIO (KPIs, Instalaciones, etc.) -->
    <PieMpp
        v-else-if="currentScreen === 'complementary'"
        :procedimientoId="selectedProcedimiento"
        :procesoId="selectedProceso"
        @back="currentScreen = 'matrix'"
        @exit="handleExit"
    />

    <!-- MODALES UNIFICADOS (Chameleon Engine) -->
    <v-dialog v-model="showEntityDialog" max-width="600px">
      <v-card class="rounded-xl pa-4" v-if="entityType && mppStore.schemas[entityType]">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-2">{{ mppStore.schemas[entityType].icon }}</v-icon>
          {{ entityMode === "create" ? "NUEVO" : "EDITAR" }} {{ mppStore.schemas[entityType].title.toUpperCase() }}
        </v-card-title>
        <v-card-text>
          <v-row dense>
            <v-col v-for="field in mppStore.schemas[entityType].fields.filter(f => f.type !== 'hidden')" :key="field.key" cols="12">
              <v-text-field v-if="['text', 'date'].includes(field.type)" v-model="entityData[field.key]" :label="field.label" :type="field.type" variant="outlined" density="compact"></v-text-field>
              <v-text-field v-else-if="field.type === 'readonly'" :model-value="entityData[field.key] || '—'" :label="field.label" variant="outlined" density="compact" readonly></v-text-field>
              <v-textarea v-else-if="field.type === 'textarea'" v-model="entityData[field.key]" :label="field.label" variant="outlined" density="compact" rows="2"></v-textarea>
              <v-select v-else-if="field.type === 'select-multiple'" v-model="entityData[field.key]" :items="mppStore[field.optionsSource]" :item-title="field.itemTitle" :item-value="field.itemValue" :label="field.label" multiple chips closable-chips variant="outlined" density="compact"></v-select>
              <v-select v-else-if="field.type === 'select'" v-model="entityData[field.key]" :items="field.options" :label="field.label" variant="outlined" density="compact"></v-select>
            </v-col>
          </v-row>
        </v-card-text>
        <v-card-actions class="px-6 pb-4">
          <v-spacer></v-spacer>
           <v-btn color="primary" variant="outlined" class="rounded-lg font-weight-bold text-uppercase text-caption mr-2" @click="showEntityDialog = false">Cancelar</v-btn>
           <v-btn color="primary" variant="flat" class="rounded-lg font-weight-bold text-uppercase text-caption px-6" @click="handleSaveEntity" :loading="isSaving">Guardar {{ mppStore.schemas[entityType].title }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showResourceDialog" max-width="600px">
      <v-card class="rounded-xl pa-4" v-if="resourceType && mppStore.schemas[resourceType]">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-2">{{ mppStore.schemas[resourceType].icon }}</v-icon>
          {{ resourceMode === "create" ? "NUEVO" : "EDITAR" }} {{ mppStore.schemas[resourceType].title.toUpperCase() }}
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
           <v-btn v-if="resourceMode === 'edit'" color="error" variant="outlined" class="rounded-lg font-weight-bold text-uppercase text-caption" @click="handleDeleteResource">Eliminar</v-btn>
           <v-spacer></v-spacer>
           <v-btn color="primary" variant="outlined" class="rounded-lg font-weight-bold text-uppercase text-caption mr-2" @click="showResourceDialog = false">Cancelar</v-btn>
           <v-btn color="primary" variant="flat" class="rounded-lg font-weight-bold text-uppercase text-caption px-6" @click="handleSaveResource" :loading="isSaving">Guardar {{ mppStore.schemas[resourceType].title }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" :timeout="3000">{{ snackbar.text }}</v-snackbar>
  </v-container>
</template>

<style scoped>
.fill-height { height: 100%; }
.step-pipeline-item {
  border: 1px solid #e2e8f0;
  transition: all 0.2s ease-in-out;
}
.step-pipeline-item:hover {
  border-color: #6366f1;
  background-color: #f8fafc;
}
.border-primary-active {
  border: 2px solid #6366f1 !important;
}
.border-subtle {
  border: 1px solid #e2e8f0 !important;
}
.step-completed {
  border-left: 4px solid #10b981 !important;
}
.bg-gradient-sidebar {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}
</style>

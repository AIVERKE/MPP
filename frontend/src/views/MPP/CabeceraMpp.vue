<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useMppCoreStore } from "@/stores/mpp_core";
import { rules } from "@/utils/rules";
import MatrizMpp from "./MatrizMpp.vue";
import PieMpp from "./PieMpp.vue";
import EntitySelectWithActions from "@/components/common/EntitySelectWithActions.vue";
import SchemaEntityDialog from "@/components/common/SchemaEntityDialog.vue";

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

// --- TIMERS Y COLA DE AUTO-GUARDADO ---
let debounceTimer = null;
let pendingSaveFn = null;

// --- LÓGICA DE AUTO-GUARDADO TRANSPARENTE ---
const triggerAutoSave = (saveFn, delay = 1000) => {
  pendingSaveFn = saveFn;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    if (isSaving.value) {
      // Si hay una petición en vuelo, reintentar en 300ms sin perder la función pendiente
      triggerAutoSave(pendingSaveFn, 300);
      return;
    }
    const fn = pendingSaveFn;
    pendingSaveFn = null;
    if (fn) {
      try {
        await fn(true);
      } catch (e) {
        console.error("Auto-save failed:", e);
      }
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
    isSaving.value = true;
    const procedureId = Number(selectedProcedimiento.value);
    const payload = {
      ...procedureHeader.value,
      estado: procedureHeader.value.estado_version || "Borrador"
    };
    const updates = [mppStore.updateProcedimiento(procedureId, payload)];

    if (selectedNormativa.value) {
      const nId = typeof selectedNormativa.value === "object" ? selectedNormativa.value.id_normativa || selectedNormativa.value.id : Number(selectedNormativa.value);
      if (nId) {
        // Desvincular este procedimiento de cualquier otra normativa previa
        const prevNormativas = mppStore.normativas.filter(
          (n) => n.id_normativa !== nId && n.procedimientos?.some((p) => p.id_procedimiento === procedureId)
        );
        for (const prev of prevNormativas) {
          const remainingProcIds = (prev.procedimientos || [])
            .map((p) => p.id_procedimiento)
            .filter((pId) => pId !== procedureId);
          updates.push(mppStore.updateNormativa(prev.id_normativa, { id_procedimientos: remainingProcIds }));
        }

        // Vincular a la nueva normativa sin sobreescribir otros procedimientos que ya tenga
        const targetNormativa = mppStore.normativas.find((n) => n.id_normativa === nId);
        const currentProcIds = (targetNormativa?.procedimientos || []).map((p) => p.id_procedimiento);
        const newProcIds = Array.from(new Set([...currentProcIds, procedureId]));
        updates.push(mppStore.updateNormativa(nId, { id_procedimientos: newProcIds }));
      }
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

watch(() => procedureHeader.value, () => { if (selectedProcedimiento.value) triggerAutoSave(saveProcedureHeader, 1500); }, { deep: true });
watch(selectedNormativa, (newVal, oldVal) => { if (selectedProcedimiento.value && newVal !== oldVal) triggerAutoSave(saveProcedureHeader, 300); });
watch(selectedCargo, (newVal) => { if (selectedProceso.value) triggerAutoSave(saveCargoRelation, 400); });
watch(() => entityData.value.id_unidades, (newVal) => { if (selectedProceso.value) triggerAutoSave(saveProcessUnits, 600); }, { deep: true });

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

const handleSaveEntity = async (formData) => {
  try {
    isSaving.value = true;
    const type = entityType.value;
    const isEdit = entityMode.value === "edit";
    const payload = formData ? { ...formData } : { ...entityData.value };
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

const handleSaveResource = async (formData) => {
  try {
    isSaving.value = true;
    const type = resourceType.value;
    const schema = mppStore.schemas[type];
    const isEdit = resourceMode.value === "edit";
    const payload = formData ? { ...formData } : { ...resourceData.value };
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
  <v-container fluid class="pa-0 fill-height overflow-hidden d-flex flex-column bg-slate-50">
    <!-- PANTALLA 1: GESTIÓN POR PASOS INTEGRADA FULL-WIDTH -->
    <template v-if="currentScreen === 'setup'">
      <!-- ÁREA DE TRABAJO EN DOS COLUMNAS (SPLIT VIEW 100% ANCHO, AJUSTADO A PANTALLA) -->
      <v-container fluid class="px-4 py-3 flex-grow-1 overflow-y-auto">
        <!-- HEADER CORPORATIVO (TARJETA ROUNDED-XL HOMOLOGADA) -->
        <v-card elevation="2" class="rounded-xl border pa-4 mb-4 bg-white flex-shrink-0 overflow-hidden">
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
                class="rounded-lg text-none font-weight-bold"
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
        </v-card>

        <v-row dense class="ma-0 align-stretch">
          <!-- COLUMNA IZQUIERDA: FORMULARIO DEL PASO ACTUAL -->
          <v-col cols="12" lg="7" xl="7" class="pr-lg-2 d-flex flex-column">
            <v-card elevation="2" class="rounded-xl border pa-4 fill-height d-flex flex-column justify-space-between bg-white overflow-hidden">
              <div>
                <!-- PASO 1: CONTEXTO -->
                <div v-if="step === 1">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="primary" size="20" class="mr-2">mdi-hexagon-multiple-outline</v-icon>
                    <h3 class="text-subtitle-1 font-weight-bold">Paso 1: Contexto de Proceso y Procedimiento</h3>
                  </div>

                  <v-row class="ma-0 ga-y-2.5">
                    <v-col cols="12" class="pa-0">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary">Proceso Principal</div>
                      <EntitySelectWithActions
                        v-model="selectedProceso"
                        :items="mppStore.procesos"
                        :item-title="getItemTitle"
                        item-value="id_proceso"
                        placeholder="Seleccionar un Proceso Principal..."
                        prepend-inner-icon="mdi-hexagon-multiple-outline"
                        :rules="[rules.required]"
                        add-title="Crear Proceso"
                        edit-title="Editar Proceso"
                        no-data-text="No se encontraron procesos registrados"
                        @add="openDialog('proceso')"
                        @edit="openDialog('proceso', 'edit')"
                      />
                    </v-col>

                    <v-col cols="12" class="pa-0">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary d-flex align-center justify-space-between">
                        <span>Procedimiento Asociado</span>
                        <div v-if="selectedProcedimientoObj" class="d-flex align-center ga-1">
                          <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold">v{{ selectedProcedimientoObj.version || "1.0" }}</v-chip>
                          <v-chip size="x-small" :color="selectedProcedimientoStatusColor" variant="tonal" class="font-weight-bold text-uppercase">{{ selectedProcedimientoStatus }}</v-chip>
                        </div>
                      </div>
                      <EntitySelectWithActions
                        v-model="selectedProcedimiento"
                        :items="mppStore.procedimientos"
                        :item-title="getItemTitle"
                        item-value="id_procedimiento"
                        :item-props="getProcedimientoProps"
                        :placeholder="!selectedProceso ? 'Primero seleccione un proceso principal...' : 'Seleccionar un Procedimiento Asociado...'"
                        :disabled="!selectedProceso"
                        prepend-inner-icon="mdi-file-edit-outline"
                        :rules="[rules.required]"
                        add-title="Crear Procedimiento"
                        edit-title="Editar Procedimiento"
                        :no-data-text="!selectedProceso ? 'Seleccione primero un proceso principal' : 'No hay procedimientos disponibles para este proceso'"
                        @add="openDialog('procedimiento')"
                        @edit="openDialog('procedimiento', 'edit')"
                      />
                    </v-col>
                  </v-row>
                </div>

                <!-- PASO 2: RESPONSABLES -->
                <div v-else-if="step === 2">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="primary" size="20" class="mr-2">mdi-account-group-outline</v-icon>
                    <h3 class="text-subtitle-1 font-weight-bold">Paso 2: Unidades Organizacionales y Cargo Responsable</h3>
                  </div>

                  <v-row class="ma-0 ga-y-2.5">
                    <v-col cols="12" class="pa-0">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary">Unidades Participantes</div>
                      <div class="position-relative w-100">
                        <div
                          v-if="!entityData.id_unidades || entityData.id_unidades.length === 0"
                          class="custom-field-placeholder has-prepend"
                          :class="{ 'placeholder-disabled': !selectedProceso }"
                        >
                          <span>{{ !selectedProceso ? 'Primero seleccione un proceso principal...' : 'Seleccione una o más unidades participantes...' }}</span>
                        </div>
                        <v-select
                          v-model="entityData.id_unidades"
                          :items="mppStore.unidades"
                          :item-title="getItemTitle"
                          item-value="id_unidad"
                          variant="outlined"
                          density="comfortable"
                          prepend-inner-icon="mdi-domain"
                          multiple
                          chips
                          closable-chips
                          :disabled="!selectedProceso"
                          :rules="[v => (v && v.length > 0) || 'Seleccione al menos una unidad']"
                        >
                          <template #no-data>
                            <div class="pa-4 text-center d-flex flex-column align-center text-slate-600">
                              <v-icon size="24" color="primary" class="mb-1">mdi-domain-plus</v-icon>
                              <span class="text-caption font-weight-bold">No hay unidades disponibles</span>
                            </div>
                          </template>
                        </v-select>
                      </div>
                    </v-col>

                    <v-col cols="12" class="pa-0">
                      <div class="text-caption font-weight-bold text-uppercase mb-1 text-primary">Cargo Responsable Principal</div>
                      <div class="position-relative w-100">
                        <div
                          v-if="!selectedCargo"
                          class="custom-field-placeholder has-prepend"
                          :class="{ 'placeholder-disabled': !selectedProceso }"
                        >
                          <span>{{ !selectedProceso ? 'Primero seleccione un proceso principal...' : (filteredCargos.length === 0 ? 'Seleccione unidades participantes para ver cargos...' : 'Seleccione el Cargo Responsable Principal...') }}</span>
                        </div>
                        <v-select
                          v-model="selectedCargo"
                          :items="filteredCargos"
                          :item-title="getItemTitle"
                          item-value="id_cargo"
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
                          <template #no-data>
                            <div class="pa-4 text-center d-flex flex-column align-center text-slate-600">
                              <v-icon size="24" color="primary" class="mb-1">mdi-account-search-outline</v-icon>
                              <span class="text-caption font-weight-bold">No hay cargos disponibles para las unidades seleccionadas</span>
                            </div>
                          </template>
                        </v-select>
                      </div>
                    </v-col>
                  </v-row>
                </div>

                <!-- PASO 3: DETALLES TÉCNICOS -->
                <div v-else-if="step === 3">
                  <div class="d-flex align-center mb-3">
                    <v-icon color="primary" size="20" class="mr-2">mdi-file-document-edit-outline</v-icon>
                    <h3 class="text-subtitle-1 font-weight-bold">Paso 3: Parámetros Técnicos y Marco Normativo</h3>
                  </div>

                  <v-row class="ma-0 ga-y-2">
                    <v-col cols="12" sm="6" class="pa-0 pr-sm-2">
                      <v-text-field
                        v-model="procedureHeader.periodicidad"
                        label="Periodicidad de Revisión"
                        variant="outlined"
                        density="comfortable"
                        prepend-inner-icon="mdi-calendar-sync"
                        placeholder="Ej: Anual, Semestral, Según requerimiento"
                        persistent-placeholder
                        :rules="[rules.required]"
                      ></v-text-field>
                    </v-col>
                    <v-col cols="12" sm="6" class="pa-0 pl-sm-2">
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
                    <v-col cols="12" class="pa-0">
                      <EntitySelectWithActions
                        v-model="selectedNormativa"
                        :items="mppStore.normativas"
                        item-title="nombre"
                        item-value="id_normativa"
                        placeholder="Seleccionar el Marco Normativo Aplicable..."
                        prepend-inner-icon="mdi-gavel"
                        :rules="[rules.required]"
                        add-title="Crear Normativa"
                        edit-title="Editar Normativa"
                        no-data-text="No hay normativas registradas"
                        @add="openResourceDialog('normativa')"
                        @edit="openResourceDialog('normativa', 'edit', mppStore.normativas.find(n => n.id_normativa === selectedNormativa))"
                      />
                    </v-col>
                    <v-col cols="12" class="pa-0">
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
                    <v-col cols="12" class="pa-0">
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
              <div class="d-flex align-center justify-space-between pt-3 border-t mt-3">
                <v-btn
                  v-if="step > 1"
                  color="primary"
                  variant="outlined"
                  prepend-icon="mdi-arrow-left"
                  class="rounded-lg font-weight-bold text-uppercase text-caption"
                  size="small"
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
                  class="rounded-lg font-weight-bold text-uppercase text-caption px-5"
                  size="small"
                  :disabled="step === 1 ? !isStep1Valid : step === 2 ? !isStep2Valid : false"
                  @click="step++"
                >
                  Siguiente
                </v-btn>
              </div>
            </v-card>
          </v-col>

          <!-- COLUMNA DERECHA: FICHA RESUMEN EN TIEMPO REAL -->
          <v-col cols="12" lg="5" xl="5" class="pl-lg-2 mt-3 mt-lg-0 d-flex flex-column">
            <v-card elevation="2" class="rounded-xl border pa-4 fill-height d-flex flex-column justify-space-between bg-gradient-sidebar overflow-hidden">
              <div>
                <div class="d-flex align-center justify-space-between mb-3 pb-2 border-b">
                  <div class="d-flex align-center">
                    <v-icon color="primary" size="20" class="mr-2">mdi-card-bulleted-settings-outline</v-icon>
                    <h3 class="text-subtitle-1 font-weight-bold text-slate-800">Resumen de Configuración</h3>
                  </div>
                  <v-chip
                    size="x-small"
                    :color="canStartDesign ? 'success' : 'warning'"
                    variant="tonal"
                    class="font-weight-bold text-uppercase"
                  >
                    {{ canStartDesign ? 'Listo para Matriz' : 'Incompleto' }}
                  </v-chip>
                </div>

                <!-- FICHA DE COMPONENTES -->
                <div class="d-flex flex-column ga-2">
                  <!-- PROCESO -->
                  <div class="py-2 px-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-0.5">Proceso</div>
                    <div v-if="selectedProcesoObj" class="d-flex align-center">
                      <v-icon color="success" size="18" class="mr-2">mdi-check-decagram</v-icon>
                      <span class="font-weight-bold text-body-2 text-slate-900">{{ getItemTitle(selectedProcesoObj) }}</span>
                    </div>
                    <div v-else class="d-flex align-center ga-2 text-caption text-amber-darken-3 bg-amber-lighten-5 py-1.5 px-2 rounded-lg border border-amber-lighten-3">
                      <v-icon size="16" color="amber-darken-3">mdi-arrow-left-bold-circle-outline</v-icon>
                      <span class="font-weight-medium">Por favor seleccione un proceso</span>
                    </div>
                  </div>

                  <!-- PROCEDIMIENTO & ESTADO -->
                  <div class="py-2 px-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-0.5">Procedimiento</div>
                    <div v-if="selectedProcedimientoObj">
                      <div class="d-flex align-center mb-1">
                        <v-icon color="success" size="18" class="mr-2">mdi-check-decagram</v-icon>
                        <span class="font-weight-bold text-body-2 text-slate-900">{{ getItemTitle(selectedProcedimientoObj) }}</span>
                      </div>
                      <div class="d-flex ga-2 mt-1">
                        <v-chip size="x-small" color="primary" variant="flat">v{{ selectedProcedimientoObj.version || "1.0" }}</v-chip>
                        <v-chip size="x-small" :color="selectedProcedimientoStatusColor" variant="tonal" class="font-weight-bold">{{ selectedProcedimientoStatus }}</v-chip>
                      </div>
                    </div>
                    <div v-else class="d-flex align-center ga-2 text-caption text-slate-600 bg-slate-50 py-1.5 px-2 rounded-lg border border-dashed">
                      <v-icon size="16" color="grey">mdi-file-question-outline</v-icon>
                      <span>{{ selectedProceso ? 'Seleccione el procedimiento a diagramar' : 'Pendiente de selección de proceso' }}</span>
                    </div>
                  </div>

                  <!-- UNIDADES & CARGO RESPONSABLE -->
                  <div class="py-2 px-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-0.5">Responsables y Unidades</div>
                    <div v-if="selectedCargoObj || selectedUnidadesObjs.length > 0">
                      <div v-if="selectedCargoObj" class="d-flex align-center mb-1">
                        <v-icon color="success" size="16" class="mr-2">mdi-check-circle-outline</v-icon>
                        <div>
                          <div class="font-weight-bold text-caption text-slate-900">{{ getItemTitle(selectedCargoObj) }}</div>
                          <div class="text-caption text-grey-darken-1 font-italic" style="font-size: 0.72rem !important;">{{ selectedCargoObj.nombre_unidad_display }}</div>
                        </div>
                      </div>
                      <div v-if="selectedUnidadesObjs.length > 0" class="d-flex flex-wrap ga-1 mt-1">
                        <v-chip v-for="u in selectedUnidadesObjs" :key="u.id_unidad" size="x-small" color="secondary" variant="tonal" prepend-icon="mdi-domain">
                          {{ getItemTitle(u) }}
                        </v-chip>
                      </div>
                    </div>
                    <div v-else class="d-flex align-center ga-2 text-caption text-slate-600 bg-slate-50 py-1.5 px-2 rounded-lg border border-dashed">
                      <v-icon size="16" color="grey">mdi-account-group-outline</v-icon>
                      <span>Se configurará en el Paso 2 (Unidades y Cargo)</span>
                    </div>
                  </div>

                  <!-- MARCO NORMATIVO Y DETALLES -->
                  <div class="py-2 px-3 rounded-lg bg-white border">
                    <div class="text-caption font-weight-bold text-grey-darken-1 text-uppercase mb-0.5">Detalles Técnicos</div>
                    <div class="d-flex flex-column ga-1 text-caption">
                      <div class="d-flex align-center justify-space-between py-0.5 border-b">
                        <span class="text-slate-700 font-weight-medium">Periodicidad:</span>
                        <span :class="procedureHeader.periodicidad ? 'font-weight-bold text-slate-900' : 'text-grey font-italic'">
                          {{ procedureHeader.periodicidad || 'Sin definir (Paso 3)' }}
                        </span>
                      </div>
                      <div class="d-flex align-center justify-space-between py-0.5">
                        <span class="text-slate-700 font-weight-medium">Normativa:</span>
                        <span :class="selectedNormativaObj ? 'font-weight-bold text-slate-900' : 'text-grey font-italic'">
                          {{ selectedNormativaObj ? selectedNormativaObj.nombre : 'Sin asignar (Paso 3)' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BOTÓN PRINCIPAL HÉROE -->
              <div class="pt-3 border-t mt-3">
                <v-btn
                  color="primary"
                  block
                  size="large"
                  class="rounded-xl font-weight-bold text-uppercase shadow-md"
                  height="46"
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
    <SchemaEntityDialog
      v-model="showEntityDialog"
      :schema="entityType ? mppStore.schemas[entityType] : null"
      :mode="entityMode"
      :initial-data="entityData"
      :options-sources="mppStore"
      :loading="isSaving"
      @save="handleSaveEntity"
    />

    <SchemaEntityDialog
      v-model="showResourceDialog"
      :schema="resourceType ? mppStore.schemas[resourceType] : null"
      :mode="resourceMode"
      :initial-data="resourceData"
      :options-sources="mppStore"
      :loading="isSaving"
      :show-delete="resourceMode === 'edit'"
      @save="handleSaveResource"
      @delete="handleDeleteResource"
    />

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
  border-color: var(--mof-turquesa);
  background-color: #f8fafc;
}
.border-primary-active {
  border: 2px solid var(--mof-turquesa) !important;
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

.custom-field-placeholder {
  position: absolute;
  top: 24px;
  left: 16px;
  transform: translateY(-50%);
  color: #64748b; /* slate-500: visible y nítido */
  font-size: 0.875rem;
  font-weight: 400;
  pointer-events: none;
  z-index: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 50px);
  user-select: none;
}

.custom-field-placeholder.has-prepend {
  left: 44px;
  max-width: calc(100% - 78px);
}

.custom-field-placeholder.placeholder-disabled {
  color: #94a3b8;
  opacity: 0.75;
}

:deep(.v-select:not(.v-autocomplete):not(.v-combobox) input) {
  opacity: 0 !important;
  color: transparent !important;
  -webkit-text-fill-color: transparent !important;
  width: 0 !important;
  min-width: 0 !important;
  max-width: 0 !important;
  height: 0 !important;
  padding: 0 !important;
  margin: 0 !important;
  border: 0 !important;
  position: absolute !important;
  pointer-events: none !important;
  visibility: hidden !important;
}
</style>

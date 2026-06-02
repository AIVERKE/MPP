<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useMppCoreStore } from "@/stores/mpp_core";

const props = defineProps({
  procesoId: Number,
  procedimientoId: Number,
  cargoId: Number,
  unidadesIds: Array,
});

const emit = defineEmits(["back"]);
const mppStore = useMppCoreStore();

// --- ESTADOS DE UI ---
const isSaving = ref(false);
const isHydrating = ref(false);
const lastSaved = ref(null);
const snackbar = ref({ show: false, text: "", color: "success" });
const showLaneManager = ref(false);
const unitSearch = ref("");
const selectedUnitId = ref(null);

// Obtener nombres dinámicos
const procedimientoNombre = computed(() => {
  const proc = mppStore.procedimientos.find(
    (p) => p.id_procedimiento === props.procedimientoId,
  );
  return proc
    ? proc.nombre || proc.nombre_procedimiento
    : `Procedimiento #${props.procedimientoId}`;
});

const procesoNombre = computed(() => {
  const proc = mppStore.procesos.find((p) => p.id_proceso === props.procesoId);
  return proc
    ? proc.nombre || proc.nombre_proceso
    : `Proceso #${props.procesoId}`;
});

// --- ESTADO DE LA MATRIZ ---
const selectedCargoIds = ref([]);
const rows = ref([
  {
    id: Date.now().toString(),
    nro: 1,
    requisitos: "",
    actividad: "",
    tarea: "",
    referencia: "",
    riesgo: "",
    control: "",
    salida: "",
    plazo: 1,
    solicitante: "",
    accionId: null,
    responsableCargoId: null,
    status: "idle", // 'idle', 'saving', 'saved', 'error'
    savedIds: {
      operacion: null,
      actividad: null,
      tarea: null,
      responsable: null,
      riesgo: null,
      control: null,
      requisito: null,
    },
  },
]);

// Lógica de Guardado por Fila (Persistencia Real con IDs y Bloqueo de Concurrencia)
const savingRows = new Set();

const saveMatrixRow = async (row) => {
  console.log(`[MatrixUI] Intentando guardar fila ${row.nro}:`, JSON.parse(JSON.stringify(row)));
  if (!props.procedimientoId || savingRows.has(row.id)) {
    console.log(`[MatrixUI] Abortando guardado: procedimientoId=${props.procedimientoId}, isSaving=${savingRows.has(row.id)}`);
    return;
  }

  // Solo guardar si hay contenido mínimo
  if (
    !row.actividad &&
    !row.tarea &&
    !row.accionId &&
    !row.responsableCargoId &&
    !row.riesgo &&
    !row.control &&
    !row.requisitos
  ) {
    console.log(`[MatrixUI] Abortando guardado: Fila vacía`);
    return;
  }

  try {
    savingRows.add(row.id);
    row.status = "saving";

    const ids = await mppStore.saveMatrixRow(row, props.procedimientoId);
    console.log(`[MatrixUI] Fila ${row.nro} guardada exitosamente. IDs retornados:`, ids);

    // Actualización atómica de IDs y estado
    row.savedIds = ids;
    row.status = "saved";

    lastSaved.value = new Date().toLocaleTimeString();

    // Limpiar el estado de éxito después de 3 segundos
    setTimeout(() => {
      if (row.status === "saved") row.status = "idle";
    }, 3000);
  } catch (e) {
    console.error(`[MatrixUI] Error en fila ${row.nro}:`, e);
    row.status = "error";
    snackbar.value = {
      show: true,
      text: `Error al sincronizar fila ${row.nro}`,
      color: "error",
    };
  } finally {
    savingRows.delete(row.id);
  }
};

// Auto-guardado inteligente (Debounce mejorado)
let saveTimeouts = {};
watch(
  () => JSON.parse(JSON.stringify(rows.value)),
  (newRows, oldRows) => {
    if (isHydrating.value) {
      console.log("[MatrixUI] Watch ignorado: Cargando datos iniciales...");
      return;
    }
    
    console.log("[MatrixUI] Watch detectó cambio en filas.");
    
    newRows.forEach((row, index) => {
      const oldRow = oldRows ? oldRows[index] : null;
      
      if (!oldRow) {
        console.log(`[MatrixUI] Fila ${row.nro} es nueva o inicial.`);
      } else {
        const fieldsToWatch = ['actividad', 'tarea', 'accionId', 'responsableCargoId', 'riesgo', 'control', 'requisitos', 'referencia', 'solicitante', 'salida', 'plazo'];
        const changedField = fieldsToWatch.find(f => row[f] !== oldRow[f]);

        if (!changedField) return;
        
        console.log(`[MatrixUI] Cambio detectado en fila ${row.nro}, campo: ${changedField}. Antes: "${oldRow[changedField]}", Ahora: "${row[changedField]}"`);
      }

      // Programar guardado usando el objeto reactivo original (no el clon del watch)
      const originalRow = rows.value[index];
      if (saveTimeouts[row.id]) clearTimeout(saveTimeouts[row.id]);
      saveTimeouts[row.id] = setTimeout(() => {
        console.log(`[MatrixUI] Ejecutando saveMatrixRow para fila ${row.nro} ahora!`);
        saveMatrixRow(originalRow);
      }, 2500);
    });
  },
  { deep: true },
);

// Función para manejar el clic en la celda del carril (Asignar Responsable y Guardar)
const handleCellClick = (row, cargoId) => {
  // Si ya es el responsable, lo quitamos (toggle)
  if (row.responsableCargoId === cargoId) {
    row.responsableCargoId = null;
  } else {
    row.responsableCargoId = cargoId;
  }
  // El watch de rows detectará el cambio y disparará el auto-guardado
};

// Función para que el textarea nativo crezca solo
const adjustHeight = (e) => {
  const el = e.target;
  el.style.height = "auto";
  el.style.height = el.scrollHeight + "px";
};

// --- CÁLCULO DE COLUMNAS DINÁMICAS (Swimlanes Agrupados) ---
const swimlaneGroups = computed(() => {
  const groups = [];
  const cargosData = mppStore.unidades.flatMap((u) =>
    (u.cargos || []).map((c) => ({
      ...c,
      unitId: u.id_unidad || u.id,
      unitName: u.nombre || u.nombre_unidad,
    })),
  );

  const selectedCargos = cargosData.filter((c) =>
    selectedCargoIds.value.includes(c.id_cargo),
  );

  const map = new Map();
  selectedCargos.forEach((c) => {
    if (!map.has(c.unitId))
      map.set(c.unitId, { id: c.unitId, name: c.unitName, cargos: [] });
    map.get(c.unitId).cargos.push(c);
  });

  return Array.from(map.values());
});

const allDisplayCargos = computed(() =>
  swimlaneGroups.value.flatMap((g) => g.cargos),
);

const filteredUnits = computed(() => {
  if (!unitSearch.value) return mppStore.unidades;
  const s = unitSearch.value.toLowerCase();
  return mppStore.unidades.filter((u) =>
    (u.nombre || u.nombre_unidad || "").toLowerCase().includes(s),
  );
});

const activeUnitCargos = computed(() => {
  const unit = mppStore.unidades.find(
    (u) => u.id_unidad === selectedUnitId.value,
  );
  return unit ? unit.cargos || [] : [];
});

// --- ACCIONES DE LA MATRIZ ---
const addRow = () => {
  rows.value.push({
    id: Date.now().toString(),
    nro: rows.value.length + 1,
    requisitos: "",
    actividad: "",
    tarea: "",
    referencia: "",
    riesgo: "",
    control: "",
    salida: "",
    plazo: 1,
    solicitante: "",
    accionId: null,
    responsableCargoId: null,
    status: "idle",
    savedIds: {
      operacion: null,
      actividad: null,
      tarea: null,
      responsable: null,
      riesgo: null,
      control: null,
      requisito: null,
    },
  });
};

const removeRow = async (index) => {
  const row = rows.value[index];
  
  // Si la fila tiene IDs guardados, borrar físicamente en el backend
  if (row.savedIds && row.savedIds.operacion) {
    try {
      const confirmDelete = confirm(`¿Estás seguro de eliminar físicamente la fila ${row.nro} y todos sus datos vinculados?`);
      if (!confirmDelete) return;

      console.log(`[MatrixUI] Solicitando eliminación física de fila ${row.nro}...`);
      row.status = "saving"; // Mostrar spinner mientras borra
      
      await mppStore.deleteMatrixRow(row.savedIds);
      
      snackbar.value = {
        show: true,
        text: `Fila ${row.nro} eliminada físicamente de la base de datos`,
        color: "success",
      };
    } catch (e) {
      console.error(`[MatrixUI] Error eliminando fila ${row.nro}:`, e);
      snackbar.value = {
        show: true,
        text: `Error al borrar fila ${row.nro} en el servidor`,
        color: "error",
      };
      row.status = "error";
      return; // Abortar borrado en el front si falló el back
    }
  }

  // Eliminar del arreglo local
  if (rows.value.length > 1) {
    rows.value.splice(index, 1);
    rows.value.forEach((r, i) => (r.nro = i + 1));
  } else {
    // Si es la última fila, solo limpiarla
    rows.value[0] = {
      id: Date.now().toString(),
      nro: 1,
      requisitos: "",
      actividad: "",
      tarea: "",
      referencia: "",
      riesgo: "",
      control: "",
      salida: "",
      plazo: 1,
      solicitante: "",
      accionId: null,
      responsableCargoId: null,
      status: "idle",
      savedIds: {
        operacion: null,
        actividad: null,
        tarea: null,
        responsable: null,
        riesgo: null,
        control: null,
        requisito: null,
      },
    };
  }
};

// --- LÓGICA DE FIGURAS DINÁMICAS ---
const getActionVisuals = (accionId) => {
  const accion = mppStore.acciones.find((a) => a.id_accion === accionId);
  if (!accion) return { icon: "mdi-checkbox-blank-circle", color: "primary" };

  const nombre = (accion.nombre_accion || "").toLowerCase();

  if (nombre.includes("inicio"))
    return { icon: "mdi-play-circle", color: "success" };
  if (nombre.includes("fin"))
    return { icon: "mdi-stop-circle", color: "error" };
  if (
    nombre.includes("decisión") ||
    nombre.includes("validar") ||
    nombre.includes("aprob")
  )
    return { icon: "mdi-rhombus", color: "orange-darken-2" };

  return { icon: "mdi-checkbox-blank-circle", color: "primary" };
};

const toggleCargo = (cId) => {
  const index = selectedCargoIds.value.indexOf(cId);
  if (index === -1) selectedCargoIds.value.push(cId);
  else selectedCargoIds.value.splice(index, 1);
};

onMounted(async () => {
  isHydrating.value = true; // ACTIVAR ESCUDO
  try {
    if (!mppStore.unidades.length) await mppStore.fetchUnidades();
    if (!mppStore.acciones.length) await mppStore.fetchAcciones();
    if (!mppStore.procedimientos.length) await mppStore.fetchProcedimientos();
    if (!mppStore.procesos.length) await mppStore.fetchProcesos();

    // Hidratación de la Matriz: Cargar datos existentes si hay procedimientoId
    if (props.procedimientoId) {
      console.log("[MatrixUI] Solicitando hidratación para procedimiento:", props.procedimientoId);
      const existingRows = await mppStore.fetchMatrixData(props.procedimientoId);
      if (existingRows && existingRows.length > 0) {
        rows.value = existingRows;

        // Auto-activar carriles basados en los cargos responsables encontrados
        const activeCargos = [
          ...new Set(existingRows.map((r) => r.responsableCargoId).filter(Boolean)),
        ];
        activeCargos.forEach((cId) => {
          if (!selectedCargoIds.value.includes(cId)) {
            selectedCargoIds.value.push(cId);
          }
        });
      }
    }
  } catch (e) {
    console.error("[MatrixUI] Error cargando matriz inicial:", e);
    snackbar.value = {
      show: true,
      text: "Error al cargar datos previos de la matriz",
      color: "error",
    };
  } finally {
    // IMPORTANTE: Esperar al siguiente ciclo de renderizado para apagar el escudo
    nextTick(() => {
      isHydrating.value = false; // APAGAR ESCUDO
      console.log("[MatrixUI] Escudo de hidratación apagado. Auto-guardado activo.");
    });
  }
});
</script>

<template>
  <div class="matrix-designer fill-height d-flex flex-column bg-white">
    <!-- TOOLBAR SUPERIOR -->
    <v-toolbar
      density="compact"
      color="white"
      border
      class="px-4 flex-shrink-0"
    >
      <v-btn icon="mdi-arrow-left" variant="text" @click="emit('back')"></v-btn>
      <v-divider vertical class="mx-2"></v-divider>
      <div class="d-flex flex-column">
        <span class="text-subtitle-2 font-weight-bold uppercase">{{
          procesoNombre
        }}</span>
        <span class="text-caption text-grey-darken-1 mt-n1">{{
          procedimientoNombre
        }}</span>
      </div>
      <v-spacer></v-spacer>

      <v-btn
        variant="tonal"
        color="info"
        @click="showLaneManager = true"
        prepend-icon="mdi-account-multiple-plus"
        class="mr-2"
        >Gestionar Unidades</v-btn
      >

      <v-chip
        v-if="lastSaved"
        size="small"
        color="success"
        variant="tonal"
        class="mr-4 uppercase"
        >Ult. Sincro: {{ lastSaved }}</v-chip
      >
      <v-chip
        size="small"
        color="primary"
        variant="flat"
        class="uppercase px-4 font-weight-black"
        >Persistencia: Auto-Fila</v-chip
      >
    </v-toolbar>

    <!-- ÁREA DE LA MATRIZ -->
    <div class="flex-grow-1 pa-2 bg-grey-lighten-5 overflow-visible">
      <table class="mpp-matrix-table">
        <thead>
          <tr>
            <th rowspan="2" class="sticky-col nro-col">Nro</th>
            <th rowspan="2" class="data-col">Requisitos (Entrada)</th>
            <th colspan="2" class="text-center group-header">Operaciones</th>
            <th rowspan="2" class="data-col">
              Documento o Material de Referencia
            </th>
            <th rowspan="2" class="data-col">Riesgos</th>
            <th rowspan="2" class="data-col">Controles</th>
            <th rowspan="2" class="data-col">
              Documento, Registro o Disposición Resultante (Salida)
            </th>
            <th rowspan="2" class="plazo-col">Plazo [días]</th>
            <th class="solicitante-header text-center">Solicitante</th>

            <th
              v-for="group in swimlaneGroups"
              :key="group.id"
              :colspan="group.cargos.length"
              class="text-center swimlane-header"
            >
              {{ group.name }}
            </th>

            <th class="accion-header text-center border-left-bold">Acción</th>
            <th rowspan="2" width="40"></th>
          </tr>
          <tr>
            <th class="sub-header text-center">Actividades</th>
            <th class="sub-header text-center">Tareas</th>
            <th class="sub-header solicitante-sub text-center">
              Persona / Unidad Solicitante
            </th>

            <th
              v-for="cargo in allDisplayCargos"
              :key="cargo.id_cargo"
              class="cargo-header text-center"
            >
              {{ cargo.nombre }}
            </th>

            <th class="sub-header accion-sub text-center border-left-bold">
              Verbo
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, index) in rows" :key="row.id">
            <td
              class="text-center font-weight-bold sticky-col nro-col"
              style="vertical-align: middle"
            >
              <div class="d-flex flex-column align-center">
                <span>{{ row.nro }}</span>
                <v-progress-circular
                  v-if="row.status === 'saving'"
                  indeterminate
                  size="12"
                  width="2"
                  color="primary"
                  class="mt-1"
                ></v-progress-circular>
                <v-icon
                  v-if="row.status === 'saved'"
                  color="success"
                  size="14"
                  class="mt-1"
                  >mdi-check-circle</v-icon
                >
                <v-icon
                  v-if="row.status === 'error'"
                  color="error"
                  size="14"
                  class="mt-1"
                  >mdi-alert-circle</v-icon
                >
              </div>
            </td>
            <td>
              <textarea
                v-model="row.requisitos"
                class="cell-textarea"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>
            <td class="bg-grey-lighten-4">
              <textarea
                v-model="row.actividad"
                class="cell-textarea font-weight-bold"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>
            <td>
              <textarea
                v-model="row.tarea"
                class="cell-textarea"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>
            <td>
              <textarea
                v-model="row.referencia"
                class="cell-textarea"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>
            <td>
              <textarea
                v-model="row.riesgo"
                class="cell-textarea"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>
            <td>
              <textarea
                v-model="row.control"
                class="cell-textarea"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>
            <td>
              <textarea
                v-model="row.salida"
                class="cell-textarea"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>
            <td>
              <input
                type="number"
                v-model.number="row.plazo"
                class="cell-input-number text-center"
              />
            </td>
            <td class="bg-blue-lighten-5">
              <textarea
                v-model="row.solicitante"
                class="cell-textarea"
                placeholder="..."
                @input="adjustHeight"
              ></textarea>
            </td>

            <td
              v-for="cargo in allDisplayCargos"
              :key="cargo.id_cargo"
              class="text-center diagram-cell"
              @click="handleCellClick(row, cargo.id_cargo)"
            >
              <div
                v-if="row.responsableCargoId === cargo.id_cargo"
                class="flow-node"
              >
                <v-icon :color="getActionVisuals(row.accionId).color" size="24">
                  {{ getActionVisuals(row.accionId).icon }}
                </v-icon>
              </div>
            </td>
            <td
              class="bg-indigo-lighten-5 border-left-bold"
              style="vertical-align: middle"
            >
              <v-select
                v-model="row.accionId"
                :items="mppStore.acciones"
                item-title="nombre_accion"
                item-value="id_accion"
                density="compact"
                variant="plain"
                hide-details
                placeholder="Verbo"
                class="px-2"
              ></v-select>
            </td>

            <td class="text-center" style="vertical-align: middle">
              <v-btn
                icon="mdi-delete-outline"
                variant="text"
                color="error"
                size="x-small"
                @click="removeRow(index)"
                :disabled="rows.length === 1"
              ></v-btn>
            </td>
          </tr>
        </tbody>
      </table>
      <div class="mt-4 pb-16">
        <v-btn
          color="secondary"
          block
          variant="tonal"
          @click="addRow"
          prepend-icon="mdi-plus"
          height="40"
          class="border-dashed"
          >Añadir Nueva Fila de Operación</v-btn
        >
      </div>
    </div>

    <!-- MODAL GESTOR DE CARRILES -->
    <v-dialog v-model="showLaneManager" max-width="900">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" dark density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold"
            >GESTIÓN DE CARRILES INSTITUCIONALES</v-toolbar-title
          >
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="showLaneManager = false"></v-btn>
        </v-toolbar>

        <div style="display: flex; height: 500px">
          <div
            style="
              flex: 0 0 320px;
              border-right: 1px solid #e0e0e0;
              display: flex;
              flex-direction: column;
            "
          >
            <div class="pa-4 bg-grey-lighten-4">
              <v-text-field
                v-model="unitSearch"
                placeholder="Buscar unidad..."
                density="compact"
                variant="outlined"
                hide-details
                prepend-inner-icon="mdi-magnify"
                bg-color="white"
              ></v-text-field>
            </div>
            <v-list density="compact" class="flex-grow-1 overflow-y-auto">
              <v-list-item
                v-for="u in filteredUnits"
                :key="u.id_unidad"
                :active="selectedUnitId === u.id_unidad"
                @click="selectedUnitId = u.id_unidad"
                color="primary"
              >
                <v-list-item-title class="text-caption font-weight-bold">{{
                  u.nombre || u.nombre_unidad
                }}</v-list-item-title>
                <template v-slot:append>
                  <v-badge
                    v-if="
                      u.cargos?.some((c) =>
                        selectedCargoIds.includes(c.id_cargo),
                      )
                    "
                    color="info"
                    dot
                    inline
                  ></v-badge>
                </template>
              </v-list-item>
            </v-list>
          </div>

          <div
            style="flex: 1; display: flex; flex-direction: column"
            class="bg-grey-lighten-5"
          >
            <div v-if="selectedUnitId" class="pa-4">
              <div class="text-overline font-weight-black mb-2 text-primary">
                Seleccionar Cargos
              </div>
              <v-list density="compact" class="rounded-lg border bg-white">
                <v-list-item
                  v-for="c in activeUnitCargos"
                  :key="c.id_cargo"
                  @click="toggleCargo(c.id_cargo)"
                >
                  <template v-slot:prepend>
                    <v-checkbox-btn
                      :model-value="selectedCargoIds.includes(c.id_cargo)"
                      color="primary"
                    ></v-checkbox-btn>
                  </template>
                  <v-list-item-title class="text-body-2">{{
                    c.nombre
                  }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </div>
            <div
              v-else
              class="fill-height d-flex align-center justify-center text-grey-darken-1 text-center pa-10"
            >
              <div>
                <v-icon size="64" color="grey-lighten-2"
                  >mdi-office-building-outline</v-icon
                >
                <p class="mt-4 text-body-2">
                  Haz clic en una unidad para ver sus cargos disponibles
                </p>
              </div>
            </div>
          </div>

          <div
            style="
              flex: 0 0 250px;
              border-left: 1px solid #e0e0e0;
              display: flex;
              flex-direction: column;
            "
            class="bg-white"
          >
            <div
              class="pa-4 text-overline font-weight-black border-bottom bg-grey-lighten-4"
            >
              Columnas Activas
            </div>
            <v-list density="compact" class="flex-grow-1 overflow-y-auto">
              <v-list-item
                v-for="cargo in allDisplayCargos"
                :key="cargo.id_cargo"
                class="px-2 border-bottom"
              >
                <v-list-item-title
                  style="font-size: 0.65rem"
                  class="font-weight-bold text-truncate"
                  >{{ cargo.nombre }}</v-list-item-title
                >
                <v-list-item-subtitle
                  style="font-size: 0.6rem"
                  class="text-truncate"
                  >{{ cargo.unitName }}</v-list-item-subtitle
                >
                <template v-slot:append>
                  <v-btn
                    icon="mdi-close-circle-outline"
                    variant="text"
                    size="x-small"
                    color="error"
                    @click="toggleCargo(cargo.id_cargo)"
                  ></v-btn>
                </template>
              </v-list-item>
            </v-list>
          </div>
        </div>
        <v-divider></v-divider>
        <v-card-actions class="pa-4">
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="elevated"
            width="250"
            @click="showLaneManager = false"
            height="45"
            >Cerrar y Actualizar Matriz</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color">{{
      snackbar.text
    }}</v-snackbar>
  </div>
</template>

<style scoped>
.mpp-matrix-table {
  border-collapse: collapse;
  font-size: 0.7rem;
  background: white;
  min-width: 100%;
}
.mpp-matrix-table th,
.mpp-matrix-table td {
  border: 1px solid #cfd8dc;
  padding: 0;
}

.mpp-matrix-table th {
  background: #f8fafc;
  font-weight: 900;
  text-transform: uppercase;
  color: #334155;
  padding: 4px;
  resize: none;
}

.cell-textarea {
  min-width: 70px;
  min-height: 28px;
  padding: 4px 6px;
  border: none;
  outline: none;
  resize: both;
  font-family: inherit;
  font-size: 0.65rem;
  line-height: 1.2;
  display: block;
  background: transparent;
  overflow: auto;
  box-sizing: border-box;
  margin: 0;
}
.cell-textarea:focus {
  background: #fff;
  box-shadow: inset 0 0 0 1px #6366f1;
}

.cell-input-number {
  width: 100%;
  height: 28px;
  border: none;
  outline: none;
  font-size: 0.65rem;
}

.group-header {
  background: #e2e8f0 !important;
  font-size: 0.6rem !important;
}
.sub-header {
  background: #f1f5f9 !important;
  font-size: 0.55rem !important;
}

.solicitante-header {
  background: #e3f2fd !important;
  border-bottom: none !important;
  font-size: 0.6rem !important;
}
.solicitante-sub {
  background: #e3f2fd !important;
  border-top: none !important;
}
.accion-header {
  background: #e8eaf6 !important;
  border-bottom: none !important;
  font-size: 0.6rem !important;
}
.accion-sub {
  background: #e8eaf6 !important;
  border-top: none !important;
}

.border-left-bold {
  border-left: 2px solid #3949ab !important;
}

.swimlane-header {
  background: #fdfdfd !important;
  border-bottom: 2px solid #6366f1 !important;
  color: #6366f1 !important;
  font-size: 0.6rem !important;
}
.cargo-header {
  background: #ffffff !important;
  font-size: 0.55rem !important;
  font-weight: 600;
  color: #475569;
}

.diagram-cell {
  cursor: pointer;
  background: #fcfcfc;
  transition: background 0.2s;
  border-left: 1px dashed #cbd5e1 !important;
  border-right: 1px dashed #cbd5e1 !important;
}
.diagram-cell:hover {
  background: #f5f3ff;
}

.flow-node {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  animation: pop-in 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes pop-in {
  from {
    transform: scale(0);
    opacity: 0;
  }
  to {
    transform: scale(1);
    opacity: 1;
  }
}

.nro-col {
  width: 35px;
}
.data-col {
  width: 90px;
}
.plazo-col {
  width: 35px;
}
.uppercase {
  text-transform: uppercase;
}
</style>

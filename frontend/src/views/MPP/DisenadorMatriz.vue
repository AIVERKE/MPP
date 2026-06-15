<script setup>
import { ref, onMounted, computed, watch, nextTick } from "vue";
import { useMppCoreStore } from "@/stores/mpp_core";
import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

const props = defineProps({
  procesoId: Number,
  procedimientoId: Number,
  cargoId: Number,
  unidadesIds: Array,
});

const emit = defineEmits(["back", "finalize"]);
const mppStore = useMppCoreStore();

// --- ESTADOS DE UI ---
const isSaving = ref(false);
const isHydrating = ref(false);
const lastSaved = ref(null);
const snackbar = ref({ show: false, text: "", color: "success" });
const showLaneManager = ref(false);
const showPreview = ref(false);
const unitSearch = ref("");
const selectedUnitId = ref(null);

// Registro rápido de Verbo/Acción
const showCreateAction = ref(false);
const newActionName = ref("");
const newActionFiguraId = ref(null);
const isSavingAction = ref(false);

// Ref para exportar diagrama
const diagramContainer = ref(null);

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
const rows = ref([
  {
    id: Date.now().toString(),
    nro: 1,
    requisitos: "",
    actividad: "",
    tarea: "",
    texto_figura: "",
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
  if (!props.procedimientoId || savingRows.has(row.id)) {
    console.log(`⏳ [Matriz-UI] Guardado Fila ${row.nro} omitido (ya guardándose o sin procedimientoId)`);
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
    console.log(`⏳ [Matriz-UI] Guardado Fila ${row.nro} omitido (sin contenido mínimo)`);
    return;
  }

  try {
    savingRows.add(row.id);
    row.status = "saving";
    console.log(`💾 [Matriz-UI] Iniciando sincronización de Fila ${row.nro} en base de datos. Responsable ID: ${row.responsableCargoId}`);

    const ids = await mppStore.saveMatrixRow(row, props.procedimientoId);
    console.log(`✅ [Matriz-UI] Fila ${row.nro} sincronizada exitosamente. Nuevos IDs de registros guardados:`, JSON.stringify(ids));

    // Actualización atómica de IDs y estado
    row.savedIds = ids;
    row.status = "saved";

    lastSaved.value = new Date().toLocaleTimeString();

    // Limpiar el estado de éxito después de 3 segundos
    setTimeout(() => {
      if (row.status === "saved") row.status = "idle";
    }, 3000);
  } catch (e) {
    console.error(`❌ [Matriz-UI] Error al sincronizar fila ${row.nro}:`, e);
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
      return;
    }
    
    newRows.forEach((row, index) => {
      const oldRow = oldRows ? oldRows[index] : null;
      
      if (!oldRow) {
        // Nueva fila
      } else {
        const fieldsToWatch = ['actividad', 'tarea', 'texto_figura', 'accionId', 'responsableCargoId', 'riesgo', 'control', 'requisitos', 'referencia', 'solicitante', 'salida', 'plazo'];
        const changedField = fieldsToWatch.find(f => row[f] !== oldRow[f]);

        if (!changedField) return;
        
        console.log(`🔔 [Matriz-UI] Detectado cambio en Fila ${row.nro} en campo [${changedField}]. Antes: "${oldRow[changedField]}", Ahora: "${row[changedField]}"`);
      }

      // Programar guardado usando el objeto reactivo original (no el clon del watch)
      const originalRow = rows.value[index];
      if (saveTimeouts[row.id]) clearTimeout(saveTimeouts[row.id]);
      saveTimeouts[row.id] = setTimeout(() => {
        saveMatrixRow(originalRow);
      }, 2500);
    });
  },
  { deep: true },
);

// Función para manejar el clic en la celda del carril (Asignar Responsable y Guardar)
const handleCellClick = (row, cargoId) => {
  const cId = Number(cargoId);
  const oldCargoId = row.responsableCargoId;
  console.log(`🖱️ [Matriz-UI] Click en celda responsable - Fila: ${row.nro}, Cargo ID clicado: ${cId}, Responsable previo: ${oldCargoId}`);

  // Si ya es el responsable, lo quitamos (toggle)
  if (row.responsableCargoId && Number(row.responsableCargoId) === cId) {
    row.responsableCargoId = null;
    console.log(`❌ [Matriz-UI] Click removió al responsable. Nuevo responsableCargoId: null`);
  } else {
    row.responsableCargoId = cId;
    console.log(`✅ [Matriz-UI] Click asignó nuevo responsableCargoId: ${cId}`);
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
const selectedCargoIds = ref([]);

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
    selectedCargoIds.value.some((id) => Number(id) === Number(c.id_cargo)),
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
    texto_figura: "",
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
      texto_figura: "",
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
  if (!accion || !accion.figura) return { icon: "mdi-checkbox-blank-circle", color: "primary", colorHex: "#6366f1", codigoFigura: "rectangulo" };

  const codigoFigura = accion.figura.codigo;
  const nombreAccion = (accion.nombre_accion || "").toLowerCase();

  // Color basado en semántica del nombre
  let color = "primary";
  let colorHex = "#6366f1";
  if (nombreAccion.includes("inicio") || nombreAccion.includes("empezar") || nombreAccion.includes("comenzar") || nombreAccion.includes("start")) { 
    color = "success"; 
    colorHex = "#10b981"; 
  } else if (nombreAccion.includes("fin") || nombreAccion.includes("terminar") || nombreAccion.includes("concluir") || nombreAccion.includes("archivar") || nombreAccion.includes("end")) { 
    color = "error"; 
    colorHex = "#ef4444"; 
  } else if (nombreAccion.includes("decisión") || nombreAccion.includes("validar") || nombreAccion.includes("aprob") || nombreAccion.includes("revisar") || nombreAccion.includes("control") || nombreAccion.includes("analiz") || nombreAccion.includes("decid")) { 
    color = "orange-darken-2"; 
    colorHex = "#f59e0b"; 
  }

  // Icono basado en el código de la figura del backend (extensible)
  let icon = "mdi-circle";
  if (codigoFigura === "circulo") icon = "mdi-circle";
  else if (codigoFigura === "rectangulo") icon = "mdi-rectangle";
  else if (codigoFigura === "rombo") icon = "mdi-rhombus";
  else if (codigoFigura === "elipse") icon = "mdi-ellipse";
  else if (codigoFigura === "paralelogramo") icon = "mdi-rhombus-split";
  else if (codigoFigura === "triangulo") icon = "mdi-triangle";
  else if (codigoFigura === "hexagono") icon = "mdi-hexagon";

  return { icon, color, colorHex, codigoFigura };
};

// Obtener nombre del cargo
const getCargoName = (cargoId) => {
  if (!cargoId) return "";
  if (mppStore.cargos.length) {
    const c = mppStore.cargos.find((cargo) => cargo.id_cargo === cargoId);
    if (c) return c.nombre;
  }
  for (const u of mppStore.unidades) {
    const c = (u.cargos || []).find((cargo) => cargo.id_cargo === cargoId);
    if (c) return c.nombre;
  }
  return `Cargo #${cargoId}`;
};

// Registro rápido de acción
const createQuickAction = async () => {
  if (!newActionName.value || !newActionFiguraId.value) {
    snackbar.value = {
      show: true,
      text: "Por favor, completa todos los campos",
      color: "error",
    };
    return;
  }
  try {
    isSavingAction.value = true;
    await mppStore.saveAccion({
      nombre_accion: newActionName.value.trim(),
      id_figura: Number(newActionFiguraId.value),
    });
    // Volver a cargar acciones para actualizar los dropdowns
    await mppStore.fetchAcciones();
    snackbar.value = {
      show: true,
      text: `Acción "${newActionName.value}" creada con éxito`,
      color: "success",
    };
    newActionName.value = "";
    newActionFiguraId.value = null;
    showCreateAction.value = false;
  } catch (e) {
    console.error("Error al registrar acción rápida:", e);
    snackbar.value = {
      show: true,
      text: "Error al guardar el nuevo verbo en el servidor",
      color: "error",
    };
  } finally {
    isSavingAction.value = false;
  }
};

// Exportación del diagrama
const exportDiagramPng = async () => {
  if (!diagramContainer.value) return;
  try {
    const dataUrl = await toPng(diagramContainer.value, {
      backgroundColor: "#ffffff",
      quality: 1,
      pixelRatio: 2,
      cacheBust: true,
    });
    const link = document.createElement("a");
    link.download = `Diagrama_${procedimientoNombre.value.replace(/\s+/g, "_")}.png`;
    link.href = dataUrl;
    link.click();
    snackbar.value = {
      show: true,
      text: "Diagrama exportado a PNG con éxito",
      color: "success",
    };
  } catch (e) {
    console.error("Error al exportar a PNG:", e);
    snackbar.value = {
      show: true,
      text: "Fallo al exportar diagrama a PNG",
      color: "error",
    };
  }
};

const exportDiagramPdf = async () => {
  if (!diagramContainer.value) return;
  try {
    const dataUrl = await toPng(diagramContainer.value, {
      backgroundColor: "#ffffff",
      quality: 1,
      pixelRatio: 2,
      cacheBust: true,
    });
    
    const rect = diagramContainer.value.getBoundingClientRect();
    const widthMm = rect.width * 0.264583;
    const heightMm = rect.height * 0.264583;
    
    const pdf = new jsPDF({
      orientation: widthMm > heightMm ? "landscape" : "portrait",
      unit: "mm",
      format: [widthMm + 20, heightMm + 20]
    });
    
    pdf.addImage(dataUrl, "PNG", 10, 10, widthMm, heightMm);
    pdf.save(`Diagrama_${procedimientoNombre.value.replace(/\s+/g, "_")}.pdf`);
    
    snackbar.value = {
      show: true,
      text: "Diagrama exportado a PDF con éxito",
      color: "success",
    };
  } catch (e) {
    console.error("Error al exportar a PDF:", e);
    snackbar.value = {
      show: true,
      text: "Fallo al exportar diagrama a PDF",
      color: "error",
    };
  }
};

const toggleCargo = async (cId) => {
  const numId = Number(cId);
  const index = selectedCargoIds.value.findIndex((id) => Number(id) === numId);
  const wasChecked = index !== -1;

  if (!wasChecked) {
    // Agregar localmente
    selectedCargoIds.value.push(numId);
    if (props.procesoId) {
      try {
        await mppStore.saveCargoProceso({
          id_cargo: numId,
          id_proceso: Number(props.procesoId),
          es_responsable_principal: false,
        });
        await mppStore.fetchCargoProcesos(props.procesoId);
      } catch (e) {
        console.error("[MatrixUI] Error al guardar relación cargo-proceso:", e);
        // Revertir
        const revIdx = selectedCargoIds.value.findIndex((id) => Number(id) === numId);
        if (revIdx !== -1) selectedCargoIds.value.splice(revIdx, 1);
        snackbar.value = {
          show: true,
          text: "Error al guardar la columna de unidad en el servidor",
          color: "error",
        };
      }
    }
  } else {
    // Quitar localmente
    selectedCargoIds.value.splice(index, 1);
    if (props.procesoId) {
      try {
        const relationship = mppStore.cargoProcesos.find((cp) => {
          const cpCargoId = cp.cargo?.id_cargo || cp.id_cargo;
          return Number(cpCargoId) === numId;
        });
        if (relationship) {
          await mppStore.deleteCargoProceso(relationship.id);
          await mppStore.fetchCargoProcesos(props.procesoId);
        }
      } catch (e) {
        console.error("[MatrixUI] Error al eliminar relación cargo-proceso:", e);
        // Revertir
        if (!selectedCargoIds.value.some((id) => Number(id) === numId)) {
          selectedCargoIds.value.push(numId);
        }
        snackbar.value = {
          show: true,
          text: "Error al eliminar la columna de unidad en el servidor",
          color: "error",
        };
      }
    }
  }
};

onMounted(async () => {
  isHydrating.value = true; // ACTIVAR ESCUDO
  try {
    if (!mppStore.unidades.length) await mppStore.fetchUnidades();
    if (!mppStore.cargos.length) await mppStore.fetchCargos();
    if (!mppStore.acciones.length) await mppStore.fetchAcciones();
    if (!mppStore.figuras.length) await mppStore.fetchFiguras();
    if (!mppStore.procedimientos.length) await mppStore.fetchProcedimientos();
    if (!mppStore.procesos.length) await mppStore.fetchProcesos();

    // Cargar cargos ya asociados al proceso (columnas persistidas)
    if (props.procesoId) {
      console.log("👉 [Matriz-UI] Cargando cargos asociados al proceso ID:", props.procesoId);
      await mppStore.fetchCargoProcesos(props.procesoId);
      mppStore.cargoProcesos.forEach((cp) => {
        const cId = cp.cargo?.id_cargo || cp.id_cargo;
        if (cId) {
          const numId = Number(cId);
          if (!selectedCargoIds.value.some((id) => Number(id) === numId)) {
            selectedCargoIds.value.push(numId);
          }
        }
      });
    }

    // Hidratación de la Matriz: Cargar datos existentes si hay procedimientoId
    if (props.procedimientoId) {
      console.log("👉 [Matriz-UI] Solicitando hidratación de matriz para procedimiento ID:", props.procedimientoId);
      const existingRows = await mppStore.fetchMatrixData(props.procedimientoId);
      if (existingRows && existingRows.length > 0) {
        rows.value = existingRows;

        // Auto-activar carriles basados en los cargos responsables encontrados (por consistencia)
        const activeCargos = [
          ...new Set(existingRows.map((r) => r.responsableCargoId).filter(Boolean)),
        ];
        activeCargos.forEach((cId) => {
          const numId = Number(cId);
          if (!selectedCargoIds.value.some((id) => Number(id) === numId)) {
            selectedCargoIds.value.push(numId);
          }
        });
      }
    }
  } catch (e) {
    console.error("❌ [Matriz-UI] Error cargando matriz inicial:", e);
    snackbar.value = {
      show: true,
      text: "Error al cargar datos previos de la matriz",
      color: "error",
    };
  } finally {
    // IMPORTANTE: Esperar al siguiente ciclo de renderizado para apagar el escudo
    nextTick(() => {
      isHydrating.value = false; // APAGAR ESCUDO
      console.log("👉 [Matriz-UI] Escudo de hidratación apagado. Auto-guardado de matriz activo.");
    });
  }
});

// Calcular las conexiones visuales (flechas) del diagrama en la cuadrícula de vista previa
const connectionPaths = ref([]);

const calculateConnections = () => {
  if (!diagramContainer.value) return;
  nextTick(() => {
    setTimeout(() => {
      const container = diagramContainer.value;
      const containerRect = container.getBoundingClientRect();
      const nodes = container.querySelectorAll(".preview-node");
      
      const pts = [];
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const cx = rect.left - containerRect.left + rect.width / 2;
        const cy = rect.top - containerRect.top + rect.height / 2;
        
        // Asociar cada nodo al paso de la fila correspondiente por data-row-nro
        const rowNro = Number(node.getAttribute("data-row-nro"));
        const row = rows.value.find(r => Number(r.nro) === rowNro) || rows.value[index];
        pts.push({
          cx,
          cy,
          w: rect.width,
          h: rect.height,
          nro: row ? row.nro : rowNro || (index + 1),
          rowText: row ? (row.texto_figura || row.tarea || "") : ""
        });
      });

      const newPaths = [];
      
      // 1. Dibujar conexiones secuenciales lineales (Azules)
      for (let i = 0; i < pts.length - 1; i++) {
        const start = pts[i];
        const end = pts[i + 1];

        const x1 = start.cx;
        const y1 = start.cy + start.h / 2;

        const x2 = end.cx;
        const y2 = end.cy - end.h / 2;

        const offsetCtrl = Math.abs(y2 - y1) * 0.4;
        const path = `M ${x1} ${y1} C ${x1} ${y1 + offsetCtrl}, ${x2} ${y2 - offsetCtrl}, ${x2} ${y2}`;
        newPaths.push({ path, color: "#6366f1", dash: "2,2", isReturn: false });
      }

      // Función helper para buscar el paso destino de retorno en el texto
      const getReturnTarget = (text) => {
        if (!text) return null;
        // Captura: "vuelve a X", "vuelve al paso X", "retorna al paso X", "no -> X", etc.
        const match = text.match(/(?:vuelve\s+a|vuelve\s+al|retorna\s+a|retorna\s+al|regresa\s+a|regresa\s+al|no\s*->|->|ir\s+a|paso)\s*(?:paso\s+)?(\d+)/i);
        return match ? parseInt(match[1], 10) : null;
      };

      // 2. Dibujar retornos/bucles condicionales (Rojos) si se detecta texto de retorno
      pts.forEach((start) => {
        const targetNro = getReturnTarget(start.rowText);
        if (targetNro && targetNro !== start.nro) {
          const dest = pts.find(p => p.nro === targetNro);
          if (dest) {
            // El retorno sale por el lado derecho y sube haciendo un arco hacia el lado derecho del destino
            const xStart = start.cx + start.w / 2;
            const yStart = start.cy;
            const xEnd = dest.cx + dest.w / 2;
            const yEnd = dest.cy;

            // Offset horizontal hacia la derecha proporcional a la distancia y posición
            const offset = Math.max(120, Math.abs(xStart - xEnd) + 100);
            const path = `M ${xStart} ${yStart} C ${xStart + offset} ${yStart}, ${xEnd + offset} ${yEnd}, ${xEnd} ${yEnd}`;
            newPaths.push({ path, color: "#ef4444", dash: "3,3", isReturn: true });
          }
        }
      });

      connectionPaths.value = newPaths;
    }, 150); // Tiempo para estabilización de renderizado en DOM
  });
};

watch(showPreview, (val) => {
  if (val) {
    calculateConnections();
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
        color="indigo"
        @click="showCreateAction = true"
        prepend-icon="mdi-plus-box-multiple"
        class="mr-2"
        >Crear Verbo/Acción</v-btn
      >

      <v-btn
        variant="tonal"
        color="secondary"
        @click="showPreview = true"
        prepend-icon="mdi-eye-outline"
        class="mr-2"
        >Vista Previa Flujo</v-btn
      >

      <v-btn
        variant="tonal"
        color="info"
        @click="showLaneManager = true"
        prepend-icon="mdi-account-multiple-plus"
        class="mr-2"
        >Gestionar Unidades</v-btn
      >

      <v-btn
        variant="flat"
        color="success"
        @click="emit('finalize')"
        prepend-icon="mdi-check-decagram"
        class="mr-2 rounded-lg font-weight-bold"
        >Finalizar Flujo</v-btn
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
                class="cell-textarea font-weight-medium"
                placeholder="Descripción de la tarea..."
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
                v-if="row.responsableCargoId == cargo.id_cargo"
                class="cell-flow-node"
                :class="getActionVisuals(row.accionId).codigoFigura"
                :style="{ backgroundColor: getActionVisuals(row.accionId).colorHex }"
                @click.stop
              >
                <div class="cell-flow-text-wrapper">
                  <textarea
                    v-model="row.texto_figura"
                    class="cell-flow-textarea"
                    placeholder="Escribir..."
                    rows="2"
                    @click.stop
                  ></textarea>
                </div>
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
              >
                <template v-slot:item="{ props, item }">
                  <v-list-item v-bind="props">
                    <template v-slot:prepend>
                      <v-icon :color="getActionVisuals(item.raw.id_accion).color" size="18" class="mr-2">
                        {{ getActionVisuals(item.raw.id_accion).icon }}
                      </v-icon>
                    </template>
                  </v-list-item>
                </template>
                <template v-slot:selection="{ item }">
                  <div class="d-flex align-center">
                    <v-icon :color="getActionVisuals(item.raw.id_accion).color" size="14" class="mr-1">
                      {{ getActionVisuals(item.raw.id_accion).icon }}
                    </v-icon>
                    <span class="text-caption font-weight-bold">{{ item.raw.nombre_accion }}</span>
                  </div>
                </template>
              </v-select>
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
                        selectedCargoIds.some((id) => Number(id) === Number(c.id_cargo)),
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
                      :model-value="selectedCargoIds.some((id) => Number(id) === Number(c.id_cargo))"
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

    <!-- MODAL REGISTRO RÁPIDO DE ACCIÓN -->
    <v-dialog v-model="showCreateAction" max-width="450">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="indigo" dark density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold"
            >REGISTRO RÁPIDO DE VERBO/ACCIÓN</v-toolbar-title
          >
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="showCreateAction = false"></v-btn>
        </v-toolbar>
        <v-card-text class="pa-4">
          <v-text-field
            v-model="newActionName"
            label="Nombre de la Acción (Ej: Autorizar)"
            variant="outlined"
            density="compact"
            class="mb-3"
            hide-details
          ></v-text-field>
          <v-select
            v-model="newActionFiguraId"
            :items="mppStore.figuras"
            item-title="nombre"
            item-value="id_figura"
            label="Figura Geométrica en Diagrama"
            variant="outlined"
            density="compact"
            hide-details
          ></v-select>
        </v-card-text>
        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-1" variant="text" @click="showCreateAction = false">Cancelar</v-btn>
          <v-btn color="indigo" variant="elevated" @click="createQuickAction" :loading="isSavingAction">Guardar Acción</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO DE PREVISUALIZACIÓN -->
    <v-dialog v-model="showPreview" max-width="950">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="indigo" dark density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold"
            >VISTA PREVIA DEL DIAGRAMA DE FLUJO (SWIMLANES)</v-toolbar-title
          >
          <v-spacer></v-spacer>
          
          <v-btn
            variant="flat"
            color="white"
            size="small"
            class="mr-2 text-indigo font-weight-bold"
            prepend-icon="mdi-image-outline"
            @click="exportDiagramPng"
            :disabled="allDisplayCargos.length === 0"
          >
            PNG
          </v-btn>
          
          <v-btn
            variant="flat"
            color="white"
            size="small"
            class="mr-2 text-indigo font-weight-bold"
            prepend-icon="mdi-file-pdf-box"
            @click="exportDiagramPdf"
            :disabled="allDisplayCargos.length === 0"
          >
            PDF
          </v-btn>

          <v-btn icon="mdi-close" @click="showPreview = false"></v-btn>
        </v-toolbar>

        <div class="pa-8 bg-grey-lighten-4 overflow-y-auto" style="max-height: 75vh">
          <div 
            ref="diagramContainer"
            class="pa-8 bg-white rounded-lg border overflow-x-auto"
            style="min-height: 400px; min-width: 100%; position: relative;"
          >
            <!-- TÍTULO DEL DIAGRAMA -->
            <div class="text-center mb-6">
              <h2 class="text-h6 font-weight-black uppercase text-indigo-darken-3 mb-1">{{ procedimientoNombre }}</h2>
              <div class="d-flex justify-center align-center">
                <v-chip size="x-small" color="indigo" variant="tonal" class="font-weight-bold uppercase">{{ procesoNombre }}</v-chip>
              </div>
            </div>

            <!-- ADVERTENCIA DE CARRIL VACÍO -->
            <div v-if="allDisplayCargos.length === 0" class="text-center pa-10 text-grey-darken-1">
              <v-icon size="48" color="warning" class="mb-2">mdi-alert-circle-outline</v-icon>
              <p class="font-weight-bold">No has asignado ningún carril (Cargo) en la matriz todavía.</p>
              <p class="text-caption">Cierra esta ventana, gestiona las unidades y selecciona cargos para poder generar el diagrama.</p>
            </div>

            <!-- TABLA DE SWIMLANES -->
            <table v-else class="preview-swimlane-table" style="position: relative; z-index: 2;">
              <thead>
                <!-- Fila de Unidades -->
                <tr>
                  <th class="preview-step-header text-center">Paso</th>
                  <th
                    v-for="group in swimlaneGroups"
                    :key="group.id"
                    :colspan="group.cargos.length"
                    class="preview-unit-header text-center"
                  >
                    {{ group.name }}
                  </th>
                </tr>
                <!-- Fila de Cargos -->
                <tr>
                  <th class="preview-step-subheader"></th>
                  <th
                    v-for="cargo in allDisplayCargos"
                    :key="cargo.id_cargo"
                    class="preview-cargo-header text-center"
                  >
                    {{ cargo.nombre }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in rows" :key="row.id">
                  <!-- Número de Paso -->
                  <td class="text-center font-weight-bold preview-step-cell">
                    <span class="step-badge">{{ row.nro }}</span>
                  </td>
                  
                  <!-- Celdas de los carriles -->
                  <td
                    v-for="cargo in allDisplayCargos"
                    :key="cargo.id_cargo"
                    class="preview-lane-cell text-center"
                  >
                    <!-- Si este cargo es responsable, renderizar la figura -->
                    <div 
                      v-if="row.responsableCargoId == cargo.id_cargo"
                      class="preview-node d-flex align-center justify-center text-center pa-4 mx-auto"
                      :data-row-nro="row.nro"
                      :class="getActionVisuals(row.accionId).codigoFigura"
                      :style="{ backgroundColor: getActionVisuals(row.accionId).colorHex }"
                    >
                      <span class="preview-text font-weight-bold">
                        {{ row.texto_figura || row.tarea || 'Sin texto' }}
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- SVG para dibujar las líneas de conexión -->
            <svg 
              v-if="allDisplayCargos.length > 0"
              style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 1;"
            >
              <defs>
                <marker 
                  id="arrow" 
                  viewBox="0 0 10 10" 
                  refX="6" 
                  refY="5" 
                  markerWidth="6" 
                  markerHeight="6" 
                  orient="auto-start-reverse"
                >
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1"/>
                </marker>
              </defs>
              <path 
                v-for="(path, i) in connectionPaths" 
                :key="i"
                :d="path"
                stroke="#6366f1"
                stroke-width="2"
                fill="none"
                marker-end="url(#arrow)"
                stroke-dasharray="2,2"
              />
            </svg>
          </div>
        </div>
        
        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn color="grey-darken-2" variant="tonal" @click="showPreview = false">Cerrar</v-btn>
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

.texto-figura-input :deep(.v-field__input) {
  font-size: 0.55rem !important;
  min-height: 20px !important;
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  color: #64748b !important;
}
.texto-figura-input :deep(.v-label) {
  font-size: 0.5rem !important;
}

.texto-figura-input-native {
  width: 100%;
  border: none;
  outline: none;
  font-size: 0.58rem;
  color: #4f46e5;
  background: transparent;
  font-family: inherit;
  padding: 1px 0;
  font-weight: bold;
}
.texto-figura-input-native::placeholder {
  color: #94a3b8;
  font-weight: normal;
}
.texto-figura-input-native:focus {
  color: #4f46e5;
  background: #f8fafc;
}

/* ESTILOS DE PREVISUALIZACIÓN */
.preview-node {
  min-width: 140px;
  min-height: 50px;
  color: white;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  border-radius: 6px;
}

.preview-text {
  font-size: 0.65rem;
  line-height: 1.1;
  max-width: 80%;
  word-break: break-word;
  color: white;
}

/* Formas Geométricas */
.rectangulo {
  border-radius: 6px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.circulo {
  border-radius: 50% !important;
  width: 80px !important;
  height: 80px !important;
  min-width: 80px !important;
  min-height: 80px !important;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.rombo {
  transform: rotate(45deg);
  width: 80px !important;
  height: 80px !important;
  min-width: 80px !important;
  min-height: 80px !important;
  border-radius: 0 !important;
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.rombo .preview-text {
  transform: rotate(-45deg);
}

.elipse {
  border-radius: 9999px !important;
  min-width: 140px;
  min-height: 50px;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.paralelogramo {
  transform: skewX(-20deg);
  border-radius: 0 !important;
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.paralelogramo .preview-text {
  transform: skewX(20deg);
}

.triangulo {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  width: 90px !important;
  height: 80px !important;
  min-width: 90px !important;
  min-height: 80px !important;
  border-radius: 0 !important;
  padding-top: 25px !important; /* Ajustar texto abajo */
}

.hexagono {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  width: 110px !important;
  height: 70px !important;
  min-width: 110px !important;
  min-height: 70px !important;
  border-radius: 0 !important;
}

/* Conectores de flujo */
.flow-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 25px;
  position: relative;
  justify-content: center;
  width: 100%;
}
.flow-connector .line {
  width: 2px;
  height: 100%;
  background: #cbd5e1;
}
.flow-connector .arrow {
  position: absolute;
  bottom: -4px;
  background: white;
  border-radius: 50%;
}

/* Estilos de figuras en la celda de la matriz */
.cell-flow-node {
  margin: 6px auto;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(0,0,0,0.15);
  box-sizing: border-box;
}

.cell-flow-node.rectangulo {
  border-radius: 4px !important;
  width: 85px !important;
  height: 48px !important;
  min-width: 85px !important;
  min-height: 48px !important;
}

.cell-flow-node.rectangulo .cell-flow-text-wrapper {
  width: 75px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-flow-node.circulo {
  border-radius: 50% !important;
  width: 65px !important;
  height: 65px !important;
  min-width: 65px !important;
  min-height: 65px !important;
}

.cell-flow-node.circulo .cell-flow-text-wrapper {
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-flow-node.rombo {
  transform: rotate(45deg);
  width: 65px !important;
  height: 65px !important;
  min-width: 65px !important;
  min-height: 65px !important;
  border-radius: 0 !important;
}

.cell-flow-node.rombo .cell-flow-text-wrapper {
  transform: rotate(-45deg);
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-flow-node.elipse {
  border-radius: 9999px !important;
  width: 85px !important;
  height: 48px !important;
  min-width: 85px !important;
  min-height: 48px !important;
}
.cell-flow-node.elipse .cell-flow-text-wrapper {
  width: 75px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-flow-node.paralelogramo {
  transform: skewX(-20deg);
  width: 85px !important;
  height: 48px !important;
  min-width: 85px !important;
  min-height: 48px !important;
  border-radius: 0 !important;
}
.cell-flow-node.paralelogramo .cell-flow-text-wrapper {
  transform: skewX(20deg);
  width: 75px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-flow-node.triangulo {
  clip-path: polygon(50% 0%, 0% 100%, 100% 100%);
  width: 75px !important;
  height: 65px !important;
  min-width: 75px !important;
  min-height: 65px !important;
  border-radius: 0 !important;
}
.cell-flow-node.triangulo .cell-flow-text-wrapper {
  padding-top: 15px;
  width: 60px;
  height: 40px;
}

.cell-flow-node.hexagono {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  width: 85px !important;
  height: 52px !important;
  min-width: 85px !important;
  min-height: 52px !important;
  border-radius: 0 !important;
}
.cell-flow-node.hexagono .cell-flow-text-wrapper {
  width: 65px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cell-flow-textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  font-size: 0.52rem;
  color: white;
  text-align: center;
  background: transparent;
  font-weight: bold;
  resize: none;
  overflow: hidden;
  line-height: 1.1;
  padding: 4px 2px;
  box-sizing: border-box;
  font-family: inherit;
}

.cell-flow-textarea::placeholder {
  color: rgba(255, 255, 255, 0.7);
  font-weight: normal;
}

/* Estilos para el diagrama de swimlanes de vista previa */
.preview-swimlane-table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  margin-top: 10px;
}

.preview-swimlane-table th,
.preview-swimlane-table td {
  border: 1px solid #e2e8f0;
  padding: 12px 6px;
  position: relative;
}

.preview-step-header {
  width: 65px;
  background: #1e293b !important;
  color: white !important;
  font-size: 0.65rem !important;
  font-weight: 800;
  text-transform: uppercase;
}

.preview-step-subheader {
  background: #1e293b !important;
  border-bottom: 1px solid #475569 !important;
  width: 65px;
}

.preview-unit-header {
  background: #0f172a !important;
  color: #38bdf8 !important;
  font-size: 0.7rem !important;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #38bdf8 !important;
}

.preview-cargo-header {
  background: #1e293b !important;
  color: #e2e8f0 !important;
  font-size: 0.6rem !important;
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid #475569 !important;
}

.preview-step-cell {
  background: #f8fafc;
  vertical-align: middle;
}

.step-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #6366f1;
  color: white;
  font-size: 0.7rem;
  font-weight: 900;
  box-shadow: 0 2px 4px rgba(99, 102, 241, 0.3);
}

.preview-lane-cell {
  background: #ffffff;
  vertical-align: middle;
  min-width: 110px;
  height: 85px;
}

.preview-lane-cell:empty {
  background-image: radial-gradient(#cbd5e1 1px, transparent 1px);
  background-size: 10px 10px;
}
</style>

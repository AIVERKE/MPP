<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import { useDisplay } from "vuetify";
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
const { xs, smAndDown } = useDisplay();

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

// Panel IF/ELSE para tareas con figura Rombo
const showCondicionPanel = ref(false);
const condicionRow = ref(null);
const isSavingCondicion = ref(false);
const isLoadingCondicion = ref(false);
const condicionForm = ref({
  id_condicion: null,
  tipo_condicion: "if",
  expresion_condicion: "",
  id_tarea_siguiente_if: null,
  id_tarea_siguiente_else: null,
  orden: 1,
});
const rutaActiva = ref("if"); // 'if' | 'else' — próximo clic en el mini diagrama
const condicionesPorTarea = ref({}); // { [id_tarea]: condicion }
const condicionDiagramRef = ref(null);
const condicionConnectionPaths = ref([]);

const tipoCondicionOptions = [
  { title: "IF", value: "if" },
  { title: "ELSE", value: "else" },
  { title: "FIN SI", value: "fin_si" },
];

// Ref para exportar diagrama
const diagramContainer = ref(null);
const scrollWrapper = ref(null);

// Obtener nombres dinámicos
const procedimientoNombre = computed(() => {
  const proc = mppStore.procedimientos.find(
    (p) => p.id_procedimiento === props.procedimientoId,
  );
  return proc
    ? proc.nombre || proc.nombre_procedimiento
    : `Procedimiento #${props.procedimientoId}`;
});

const procedimientoVersion = computed(() => {
  const proc = mppStore.procedimientos.find(
    (p) => Number(p.id_procedimiento) === Number(props.procedimientoId),
  );
  return proc?.version || "1.0";
});

const procedimientoEstadoVersion = computed(() => {
  const proc = mppStore.procedimientos.find(
    (p) => Number(p.id_procedimiento) === Number(props.procedimientoId),
  );
  return proc?.estado_version || proc?.estado || "Borrador";
});

const estadoVersionColor = computed(() => {
  const st = procedimientoEstadoVersion.value;
  if (st === "Aprobado" || st === "Activo") return "success";
  if (st === "En Revisión") return "info";
  if (st === "Borrador") return "warning";
  return "grey";
});

const changeEstadoVersion = async (nuevoEstado) => {
  if (!props.procedimientoId) return;
  try {
    snackbar.value = { show: true, text: `Actualizando estado a '${nuevoEstado}'...`, color: "info" };
    await mppStore.updateProcedimiento(props.procedimientoId, { estado_version: nuevoEstado });
    await mppStore.fetchProcedimientos(props.procesoId);
    snackbar.value = { show: true, text: `Estado de versión actualizado a '${nuevoEstado}'`, color: "success" };
  } catch (err) {
    console.error("Error al cambiar estado de versión:", err);
    snackbar.value = { show: true, text: "Error al actualizar el estado de versión", color: "error" };
  }
};

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

/** Índice de la primera columna que muestra un cargo (evita duplicar figura si el mismo id_cargo está en varias unidades). */
const primaryCargoColumnIndex = (cargoId) => {
  const id = Number(cargoId);
  return allDisplayCargos.value.findIndex((c) => Number(c.id_cargo) === id);
};

const shouldShowFlowNode = (row, cargo, cargoIndex) => {
  if (Number(row.responsableCargoId) !== Number(cargo.id_cargo)) return false;
  return primaryCargoColumnIndex(cargo.id_cargo) === cargoIndex;
};

const cargoColumnKey = (cargo, index) =>
  `${cargo.unitId ?? "u"}-${cargo.id_cargo}-${index}`;

const buildOrthogonalPath = (start, end, side = "center") => {
  const x1 = start.cx;
  const y1 = start.cy + start.h / 2;
  const x2 = end.cx;
  const y2 = end.cy - end.h / 2;

  if (Math.abs(x1 - x2) < 8) {
    return `M ${x1} ${y1} L ${x2} ${y2}`;
  }

  if (side === "left") {
    const xLeft = Math.min(start.cx - start.w / 2, end.cx - end.w / 2) - 36;
    return `M ${start.cx - start.w / 2} ${start.cy} L ${xLeft} ${start.cy} L ${xLeft} ${end.cy} L ${end.cx - end.w / 2} ${end.cy}`;
  }
  if (side === "right") {
    const xRight = Math.max(start.cx + start.w / 2, end.cx + end.w / 2) + 36;
    return `M ${start.cx + start.w / 2} ${start.cy} L ${xRight} ${start.cy} L ${xRight} ${end.cy} L ${end.cx + end.w / 2} ${end.cy}`;
  }

  const yMid = y1 + (y2 - y1) / 2;
  return `M ${x1} ${y1} L ${x1} ${yMid} L ${x2} ${yMid} L ${x2} ${y2}`;
};

const getRowCondicion = (row) => {
  const tareaId = row?.savedIds?.tarea ? Number(row.savedIds.tarea) : null;
  if (!tareaId) return null;
  return condicionesPorTarea.value[tareaId] || null;
};

const rowSkipsSequentialOut = (row) => {
  if (!row) return false;
  const visuals = getActionVisuals(row.accionId);
  if (visuals.codigoFigura !== "rombo") return false;
  const cond = getRowCondicion(row);
  if (!cond) return false;
  return !!(cond.id_tarea_siguiente_if || cond.id_tarea_siguiente_else);
};

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

const tareaOptionsForCondicion = computed(() => {
  return rows.value
    .filter((r) => r.savedIds?.tarea)
    .map((r) => ({
      title: `${r.nro}. ${r.texto_figura || r.tarea || `Tarea #${r.savedIds.tarea}`}`,
      value: Number(r.savedIds.tarea),
      nro: Number(r.nro),
    }));
});

/** Destinos posibles: cualquier figura guardada excepto el rombo origen (anteriores y posteriores). */
const condicionDestinoOptions = computed(() => {
  const originTareaId = condicionRow.value?.savedIds?.tarea
    ? Number(condicionRow.value.savedIds.tarea)
    : null;
  const originNro = Number(condicionRow.value?.nro) || 0;
  return tareaOptionsForCondicion.value
    .filter((o) => Number(o.value) !== originTareaId)
    .map((o) => {
      const delta = Number(o.nro) - originNro;
      const rel =
        delta === 0
          ? ""
          : delta > 0
            ? ` (↓ +${delta})`
            : ` (↑ ${delta})`;
      return {
        ...o,
        title: `${o.title}${rel}`,
      };
    });
});

const condicionDiagramNodes = computed(() => {
  const originTareaId = condicionRow.value?.savedIds?.tarea
    ? Number(condicionRow.value.savedIds.tarea)
    : null;
  const originNro = Number(condicionRow.value?.nro) || 0;

  return rows.value.map((r) => {
    const tareaId = r.savedIds?.tarea ? Number(r.savedIds.tarea) : null;
    const visuals = getActionVisuals(r.accionId);
    const delta = Number(r.nro) - originNro;
    const isOrigin = originTareaId != null && tareaId === originTareaId;
    return {
      nro: r.nro,
      tareaId,
      label: r.texto_figura || r.tarea || (tareaId ? `Tarea #${tareaId}` : "Sin guardar"),
      isOrigin,
      isSelectable: !!tareaId && !isOrigin,
      isUnsaved: !tareaId,
      isIfTarget: tareaId != null && Number(condicionForm.value.id_tarea_siguiente_if) === tareaId,
      isElseTarget: tareaId != null && Number(condicionForm.value.id_tarea_siguiente_else) === tareaId,
      colorHex: visuals.colorHex,
      codigoFigura: visuals.codigoFigura,
      relativeHint:
        delta === 0 ? "Origen" : delta > 0 ? `+${delta}` : `${delta}`,
    };
  });
});

const getTareaLabelById = (tareaId) => {
  if (!tareaId) return null;
  const opt = tareaOptionsForCondicion.value.find(
    (o) => Number(o.value) === Number(tareaId),
  );
  return opt?.title || `Tarea #${tareaId}`;
};

const hasCondicionConfigured = (row) => {
  const tareaId = row?.savedIds?.tarea ? Number(row.savedIds.tarea) : null;
  if (!tareaId) return false;
  return !!condicionesPorTarea.value[tareaId];
};

const recalculateCondicionConnections = () => {
  nextTick(() => {
    setTimeout(() => {
      const container = condicionDiagramRef.value;
      if (!container) {
        condicionConnectionPaths.value = [];
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const originEl = container.querySelector(".condicion-node.is-origin");
      if (!originEl) {
        condicionConnectionPaths.value = [];
        return;
      }

      const svg = container.querySelector(".condicion-diagram-svg");
      if (svg) {
        svg.setAttribute("width", String(container.scrollWidth));
        svg.setAttribute("height", String(container.scrollHeight));
        svg.style.width = `${container.scrollWidth}px`;
        svg.style.height = `${container.scrollHeight}px`;
      }

      const toLocal = (rect) => ({
        x: rect.left - containerRect.left + container.scrollLeft + rect.width / 2,
        y: rect.top - containerRect.top + container.scrollTop + rect.height / 2,
        top: rect.top - containerRect.top + container.scrollTop,
        bottom: rect.bottom - containerRect.top + container.scrollTop,
        left: rect.left - containerRect.left + container.scrollLeft,
        right: rect.right - containerRect.left + container.scrollLeft,
        w: rect.width,
        h: rect.height,
      });

      const origin = toLocal(originEl.getBoundingClientRect());

      const buildPath = (targetSelector, color, label, side) => {
        const targetEl = container.querySelector(targetSelector);
        if (!targetEl) return null;
        const target = toLocal(targetEl.getBoundingClientRect());
        const goingUp = target.y < origin.y - 8;
        const offsetX = side === "left" ? -52 : 52;
        const midX = (side === "left" ? Math.min(origin.x, target.x) : Math.max(origin.x, target.x)) + offsetX;

        let path;
        if (goingUp) {
          // Destino anterior (hacia arriba): sale por el costado y entra por abajo del destino
          const yStart = origin.y;
          const yEnd = target.bottom;
          path = `M ${origin.x} ${yStart} L ${midX} ${yStart} L ${midX} ${yEnd} L ${target.x} ${yEnd}`;
        } else {
          // Destino posterior (hacia abajo) o misma altura
          const yStart = origin.y;
          const yEnd = target.top;
          path = `M ${origin.x} ${yStart} L ${midX} ${yStart} L ${midX} ${yEnd} L ${target.x} ${yEnd}`;
        }

        return {
          path,
          color,
          label,
          labelX: midX,
          labelY: (origin.y + target.y) / 2,
        };
      };

      const paths = [];
      const ifPath = buildPath(
        ".condicion-node.is-if-target",
        "#2e7d32",
        "SÍ",
        "right",
      );
      const elsePath = buildPath(
        ".condicion-node.is-else-target",
        "#c62828",
        "NO",
        "left",
      );
      if (ifPath) paths.push(ifPath);
      if (elsePath) paths.push(elsePath);
      condicionConnectionPaths.value = paths;
    }, 80);
  });
};

const assignCondicionNode = (tareaId) => {
  const originId = condicionRow.value?.savedIds?.tarea
    ? Number(condicionRow.value.savedIds.tarea)
    : null;
  const id = Number(tareaId);
  if (!id || id === originId) return;

  if (rutaActiva.value === "if") {
    if (Number(condicionForm.value.id_tarea_siguiente_if) === id) {
      condicionForm.value.id_tarea_siguiente_if = null;
    } else {
      condicionForm.value.id_tarea_siguiente_if = id;
      if (Number(condicionForm.value.id_tarea_siguiente_else) === id) {
        condicionForm.value.id_tarea_siguiente_else = null;
      }
    }
  } else {
    if (Number(condicionForm.value.id_tarea_siguiente_else) === id) {
      condicionForm.value.id_tarea_siguiente_else = null;
    } else {
      condicionForm.value.id_tarea_siguiente_else = id;
      if (Number(condicionForm.value.id_tarea_siguiente_if) === id) {
        condicionForm.value.id_tarea_siguiente_if = null;
      }
    }
  }
  recalculateCondicionConnections();
};

const onSelectCondicionDestino = (route, tareaId) => {
  rutaActiva.value = route;
  const id = tareaId ? Number(tareaId) : null;
  if (!id) {
    clearCondicionRoute(route);
    return;
  }
  // Reutilizar la misma lógica de asignación (toggle no aplica desde select)
  if (route === "if") {
    condicionForm.value.id_tarea_siguiente_if = id;
    if (Number(condicionForm.value.id_tarea_siguiente_else) === id) {
      condicionForm.value.id_tarea_siguiente_else = null;
    }
  } else {
    condicionForm.value.id_tarea_siguiente_else = id;
    if (Number(condicionForm.value.id_tarea_siguiente_if) === id) {
      condicionForm.value.id_tarea_siguiente_if = null;
    }
  }
  recalculateCondicionConnections();
};

const clearCondicionRoute = (route) => {
  if (route === "if") condicionForm.value.id_tarea_siguiente_if = null;
  if (route === "else") condicionForm.value.id_tarea_siguiente_else = null;
  recalculateCondicionConnections();
};

const refreshCondicionesBadges = async () => {
  const romboRows = rows.value.filter((r) => {
    if (!r.savedIds?.tarea) return false;
    return getActionVisuals(r.accionId).codigoFigura === "rombo";
  });

  if (!romboRows.length) {
    condicionesPorTarea.value = {};
    return;
  }

  const results = await Promise.all(
    romboRows.map(async (r) => {
      const tareaId = Number(r.savedIds.tarea);
      try {
        const condiciones = await mppStore.fetchCondicionesByTarea(tareaId);
        const list = Array.isArray(condiciones) ? condiciones : [];
        if (!list.length) return [tareaId, null];
        const sorted = [...list].sort(
          (a, b) =>
            (a.orden ?? 0) - (b.orden ?? 0) || a.id_condicion - b.id_condicion,
        );
        return [tareaId, sorted[0]];
      } catch {
        return [tareaId, null];
      }
    }),
  );

  const map = {};
  results.forEach(([tareaId, cond]) => {
    if (cond) map[tareaId] = cond;
  });
  condicionesPorTarea.value = map;
};

const openCondicionPanel = async (row) => {
  const visuals = getActionVisuals(row.accionId);
  if (visuals.codigoFigura !== "rombo") return;

  const tareaId = row.savedIds?.tarea ? Number(row.savedIds.tarea) : null;
  if (!tareaId) {
    snackbar.value = {
      show: true,
      text: "Guarda la fila primero para configurar la condición IF/ELSE",
      color: "warning",
    };
    return;
  }

  condicionRow.value = row;
  rutaActiva.value = "if";
  condicionForm.value = {
    id_condicion: null,
    tipo_condicion: "if",
    expresion_condicion: "",
    id_tarea_siguiente_if: null,
    id_tarea_siguiente_else: null,
    orden: 1,
  };
  condicionConnectionPaths.value = [];
  showCondicionPanel.value = true;
  isLoadingCondicion.value = true;

  try {
    const condiciones = await mppStore.fetchCondicionesByTarea(tareaId);
    const list = Array.isArray(condiciones) ? condiciones : [];
    if (list.length > 0) {
      const sorted = [...list].sort(
        (a, b) => (a.orden ?? 0) - (b.orden ?? 0) || a.id_condicion - b.id_condicion,
      );
      const first = sorted[0];
      condicionForm.value = {
        id_condicion: first.id_condicion,
        tipo_condicion: first.tipo_condicion || "if",
        expresion_condicion: first.expresion_condicion || "",
        id_tarea_siguiente_if: first.id_tarea_siguiente_if ?? null,
        id_tarea_siguiente_else: first.id_tarea_siguiente_else ?? null,
        orden: first.orden ?? 1,
      };
      condicionesPorTarea.value = {
        ...condicionesPorTarea.value,
        [tareaId]: first,
      };
    }
  } catch (e) {
    console.error("Error al cargar condiciones:", e);
    snackbar.value = {
      show: true,
      text: "Error al cargar las condiciones de la tarea",
      color: "error",
    };
  } finally {
    isLoadingCondicion.value = false;
    recalculateCondicionConnections();
  }
};

const saveCondicionPanel = async () => {
  const row = condicionRow.value;
  const tareaId = row?.savedIds?.tarea ? Number(row.savedIds.tarea) : null;
  if (!tareaId) {
    snackbar.value = {
      show: true,
      text: "Guarda la fila primero para configurar la condición IF/ELSE",
      color: "warning",
    };
    return;
  }

  if (!condicionForm.value.expresion_condicion?.trim()) {
    snackbar.value = {
      show: true,
      text: "Ingresa la expresión de la condición",
      color: "warning",
    };
    return;
  }

  isSavingCondicion.value = true;
  try {
    const payload = {
      id_tarea: tareaId,
      tipo_condicion: condicionForm.value.tipo_condicion,
      expresion_condicion: condicionForm.value.expresion_condicion.trim(),
      id_tarea_siguiente_if: condicionForm.value.id_tarea_siguiente_if || null,
      id_tarea_siguiente_else: condicionForm.value.id_tarea_siguiente_else || null,
      orden: Number(condicionForm.value.orden) || 1,
    };

    let savedCond = { ...payload, id_condicion: condicionForm.value.id_condicion };
    if (condicionForm.value.id_condicion) {
      await mppStore.updateCondicion(condicionForm.value.id_condicion, payload);
    } else {
      const res = await mppStore.saveCondicion(payload);
      const saved = res.data?.data || res.data;
      condicionForm.value.id_condicion = saved?.id_condicion ?? null;
      savedCond = { ...savedCond, ...saved, id_condicion: condicionForm.value.id_condicion };
    }

    condicionesPorTarea.value = {
      ...condicionesPorTarea.value,
      [tareaId]: savedCond,
    };

    snackbar.value = {
      show: true,
      text: "Condición IF/ELSE guardada",
      color: "success",
    };
    showCondicionPanel.value = false;
  } catch (e) {
    console.error("Error al guardar condición:", e);
    snackbar.value = {
      show: true,
      text: "Error al guardar la condición",
      color: "error",
    };
  } finally {
    isSavingCondicion.value = false;
  }
};

const deleteCondicionPanel = async () => {
  const tareaId = condicionRow.value?.savedIds?.tarea
    ? Number(condicionRow.value.savedIds.tarea)
    : null;

  if (!condicionForm.value.id_condicion) {
    showCondicionPanel.value = false;
    return;
  }

  isSavingCondicion.value = true;
  try {
    await mppStore.deleteCondicion(condicionForm.value.id_condicion);
    if (tareaId) {
      const next = { ...condicionesPorTarea.value };
      delete next[tareaId];
      condicionesPorTarea.value = next;
    }
    snackbar.value = {
      show: true,
      text: "Condición eliminada",
      color: "success",
    };
    showCondicionPanel.value = false;
  } catch (e) {
    console.error("Error al eliminar condición:", e);
    snackbar.value = {
      show: true,
      text: "Error al eliminar la condición",
      color: "error",
    };
  } finally {
    isSavingCondicion.value = false;
  }
};

watch(
  () => [
    condicionForm.value.id_tarea_siguiente_if,
    condicionForm.value.id_tarea_siguiente_else,
    showCondicionPanel.value,
  ],
  () => {
    if (showCondicionPanel.value) recalculateCondicionConnections();
  },
);

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
    if (props.procesoId) {
      await mppStore.fetchProcedimientos(props.procesoId);
    } else if (!mppStore.procedimientos.length) {
      await mppStore.fetchProcedimientos();
    }
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

        await refreshCondicionesBadges();
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
      calculateEditorConnections();
    });
  }
});

// Listener de Resize y ResizeObserver para recálculo dinámico en zoom/redimensionamiento
let editorResizeObserver = null;
let previewResizeObserver = null;

const handleResize = () => {
  calculateEditorConnections();
  if (showPreview.value) {
    calculateConnections();
  }
};

onMounted(() => {
  window.addEventListener("resize", handleResize);

  nextTick(() => {
    if (typeof ResizeObserver !== "undefined") {
      editorResizeObserver = new ResizeObserver(() => {
        calculateEditorConnections();
      });
      if (matrixEditorContainer.value) {
        editorResizeObserver.observe(matrixEditorContainer.value);
      }

      previewResizeObserver = new ResizeObserver(() => {
        if (showPreview.value) {
          calculateConnections();
        }
      });
      if (diagramContainer.value) {
        previewResizeObserver.observe(diagramContainer.value);
      }
    }
  });
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
  if (editorResizeObserver) editorResizeObserver.disconnect();
  if (previewResizeObserver) previewResizeObserver.disconnect();
});

// Calcular las conexiones visuales (flechas) del diagrama en la cuadrícula de vista previa
const connectionPaths = ref([]);

const calculateConnections = () => {
  if (!diagramContainer.value) return;
  nextTick(() => {
    requestAnimationFrame(() => {
      const container = diagramContainer.value;
      if (!container) return;
      const wrapper = container.querySelector(".diagram-scroll-wrapper");
      if (!wrapper) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const nodes = container.querySelectorAll(".preview-node");

      const pts = [];
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const cx = rect.left - wrapperRect.left + rect.width / 2;
        const cy = rect.top - wrapperRect.top + rect.height / 2;

        const rowNro = Number(node.getAttribute("data-row-nro"));
        const row = rows.value.find((r) => Number(r.nro) === rowNro) || rows.value[index];
        const tareaId = row?.savedIds?.tarea ? Number(row.savedIds.tarea) : null;
        pts.push({
          cx,
          cy,
          w: rect.width,
          h: rect.height,
          nro: row ? Number(row.nro) : rowNro || index + 1,
          tareaId,
          row,
          rowText: row ? row.texto_figura || row.tarea || "" : "",
          skipsSequential: rowSkipsSequentialOut(row),
        });
      });

      // Ordenar secuencialmente por nro de fila ascendente
      pts.sort((a, b) => a.nro - b.nro);

      const byTareaId = new Map(
        pts.filter((p) => p.tareaId).map((p) => [p.tareaId, p]),
      );
      const newPaths = [];

      for (let i = 0; i < pts.length - 1; i++) {
        const start = pts[i];
        if (start.skipsSequential) continue;
        const end = pts[i + 1];
        newPaths.push({
          path: buildOrthogonalPath(start, end),
          color: "#4f46e5",
          isReturn: false,
        });
      }

      pts.forEach((start) => {
        const cond = getRowCondicion(start.row);
        if (!cond) return;

        const ifDest = cond.id_tarea_siguiente_if
          ? byTareaId.get(Number(cond.id_tarea_siguiente_if))
          : null;
        const elseDest = cond.id_tarea_siguiente_else
          ? byTareaId.get(Number(cond.id_tarea_siguiente_else))
          : null;

        if (ifDest) {
          newPaths.push({
            path: buildOrthogonalPath(start, ifDest, "right"),
            color: "#2e7d32",
            isReturn: false,
            isIf: true,
          });
        }
        if (elseDest) {
          newPaths.push({
            path: buildOrthogonalPath(start, elseDest, "left"),
            color: "#c62828",
            isReturn: true,
            isElse: true,
          });
        }
      });

      const getReturnTarget = (text) => {
        if (!text) return null;
        const match = text.match(
          /(?:vuelve\s+a|vuelve\s+al|retorna\s+a|retorna\s+al|regresa\s+a|regresa\s+al|no\s*->|->|ir\s+a|paso)\s*(?:paso\s+)?(\d+)/i,
        );
        return match ? parseInt(match[1], 10) : null;
      };

      pts.forEach((start) => {
        if (rowSkipsSequentialOut(start.row)) return;
        const targetNro = getReturnTarget(start.rowText);
        if (targetNro && targetNro !== start.nro) {
          const dest = pts.find((p) => p.nro === targetNro);
          if (dest) {
            newPaths.push({
              path: buildOrthogonalPath(start, dest, "right"),
              color: "#ef4444",
              isReturn: true,
            });
          }
        }
      });

      connectionPaths.value = newPaths;
    });
  });
};

watch([showPreview, scrollWrapper, () => condicionesPorTarea.value], () => {
  if (showPreview.value && scrollWrapper.value) {
    calculateConnections();
  }
}, { immediate: true, deep: true });

const editorConnectionPaths = ref([]);
const matrixEditorContainer = ref(null);

const calculateEditorConnections = () => {
  if (!matrixEditorContainer.value) return;
  nextTick(() => {
    requestAnimationFrame(() => {
      const container = matrixEditorContainer.value;
      if (!container) return;
      const wrapper = container.querySelector(".editor-scroll-wrapper");
      if (!wrapper) return;
      const wrapperRect = wrapper.getBoundingClientRect();
      const nodes = container.querySelectorAll(".cell-flow-node");

      const pts = [];
      nodes.forEach((node, index) => {
        const rect = node.getBoundingClientRect();
        const cx = rect.left - wrapperRect.left + rect.width / 2;
        const cy = rect.top - wrapperRect.top + rect.height / 2;
        let rowNro = Number(node.getAttribute("data-row-nro"));
        if (!rowNro) {
          const parentTr = node.closest("tr");
          if (parentTr && parentTr.parentNode) {
            const cells = Array.from(parentTr.parentNode.children);
            const trIndex = cells.indexOf(parentTr);
            if (trIndex !== -1 && rows.value[trIndex]) {
              rowNro = rows.value[trIndex].nro;
            }
          }
        }
        if (!rowNro) rowNro = index + 1;

        const row =
          rows.value.find((r) => Number(r.nro) === Number(rowNro)) ||
          rows.value[index];
        const tareaId = row?.savedIds?.tarea ? Number(row.savedIds.tarea) : null;
        pts.push({
          cx,
          cy,
          w: rect.width,
          h: rect.height,
          nro: Number(rowNro),
          tareaId,
          row,
          rowText: row ? row.texto_figura || row.tarea || "" : "",
          skipsSequential: rowSkipsSequentialOut(row),
        });
      });

      // Ordenar secuencialmente por nro de fila ascendente
      pts.sort((a, b) => a.nro - b.nro);

      const byTareaId = new Map(
        pts.filter((p) => p.tareaId).map((p) => [p.tareaId, p]),
      );
      const newPaths = [];

      // Secuenciales solo si el origen NO es un rombo con IF/ELSE configurado
      for (let i = 0; i < pts.length - 1; i++) {
        const start = pts[i];
        if (start.skipsSequential) continue;
        const end = pts[i + 1];
        newPaths.push({
          path: buildOrthogonalPath(start, end),
          color: "#4f46e5",
          isReturn: false,
        });
      }

      // Rutas IF (verde) / ELSE (rojo) desde condiciones guardadas
      pts.forEach((start) => {
        const cond = getRowCondicion(start.row);
        if (!cond) return;

        const ifDest = cond.id_tarea_siguiente_if
          ? byTareaId.get(Number(cond.id_tarea_siguiente_if))
          : null;
        const elseDest = cond.id_tarea_siguiente_else
          ? byTareaId.get(Number(cond.id_tarea_siguiente_else))
          : null;

        if (ifDest) {
          newPaths.push({
            path: buildOrthogonalPath(start, ifDest, "right"),
            color: "#2e7d32",
            isReturn: false,
            isIf: true,
          });
        }
        if (elseDest) {
          newPaths.push({
            path: buildOrthogonalPath(start, elseDest, "left"),
            color: "#c62828",
            isReturn: true,
            isElse: true,
          });
        }
      });

      const getReturnTarget = (text) => {
        if (!text) return null;
        const match = text.match(
          /(?:vuelve\s+a|vuelve\s+al|retorna\s+a|retorna\s+al|regresa\s+a|regresa\s+al|no\s*->|->|ir\s+a|paso)\s*(?:paso\s+)?(\d+)/i,
        );
        return match ? parseInt(match[1], 10) : null;
      };

      pts.forEach((start) => {
        if (start.skipsSequential) return;
        const targetNro = getReturnTarget(start.rowText);
        if (targetNro && targetNro !== start.nro) {
          const dest = pts.find((p) => p.nro === targetNro);
          if (dest) {
            newPaths.push({
              path: buildOrthogonalPath(start, dest, "right"),
              color: "#ef4444",
              isReturn: true,
            });
          }
        }
      });

      editorConnectionPaths.value = newPaths;
    });
  });
};

watch(
  [matrixEditorContainer, selectedCargoIds, () => rows.value, () => condicionesPorTarea.value],
  () => {
    if (matrixEditorContainer.value && rows.value.length > 0) {
      calculateEditorConnections();
    }
  },
  { deep: true, immediate: true },
);
</script>

<template>
  <!-- VISTA DE BLOQUEO EN DISPOSITIVOS MÓVILES PEQUEÑOS (<600px) -->
  <div v-if="xs" class="fill-height d-flex align-center justify-center pa-4 bg-slate-50">
    <v-card class="rounded-xl pa-6 text-center border-0 shadow-lg" elevation="4" max-width="420">
      <v-avatar color="warning" variant="tonal" size="80" class="mb-4">
        <v-icon color="warning" size="48">mdi-cellphone-remove</v-icon>
      </v-avatar>
      <h2 class="text-h5 font-weight-black mb-2 text-slate-800">Vista no disponible</h2>
      <p class="text-body-2 text-slate-600 mb-6" style="line-height: 1.5;">
        La matriz de gestión MPP no está disponible en dispositivos móviles pequeños.
        Utiliza una tablet o computadora para editar el diagrama de flujo.
      </p>
      <v-btn
        color="primary"
        variant="tonal"
        block
        class="rounded-lg font-weight-bold"
        prepend-icon="mdi-arrow-left"
        @click="emit('back')"
      >
        Volver
      </v-btn>
    </v-card>
  </div>

  <div v-else class="matrix-designer fill-height d-flex flex-column bg-surface" style="width: 100%; max-width: 100%; overflow: hidden;">
    <!-- ÁREA DE LA MATRIZ Y TOOLBAR EN UN SOLO CONTENEDOR CON SCROLL UNIFICADO -->
    <div class="flex-grow-1 pa-2 bg-slate-50 overflow-x-auto" ref="matrixEditorContainer" style="width: 100%; max-width: 100%; overflow-x: auto; overflow-y: auto; box-sizing: border-box; -webkit-overflow-scrolling: touch;">
      <div class="editor-scroll-wrapper" style="position: relative; display: inline-block; min-width: 1200px; width: max-content;">
        
        <!-- TOOLBAR SUPERIOR (DENTRO DEL SCROLL WRAPPER, PEGAJOSO EN SCROLL VERTICAL) -->
        <v-toolbar
          density="compact"
          color="surface"
          border
          class="px-4 mb-2 rounded-lg flex-shrink-0"
          style="position: sticky; top: 0; z-index: 10; min-width: 100%;"
        >
          <v-btn icon="mdi-arrow-left" variant="text" @click="emit('back')"></v-btn>
          <v-divider vertical class="mx-2"></v-divider>
          <div class="d-flex flex-column">
            <span class="text-subtitle-2 font-weight-bold uppercase">{{
              procesoNombre
            }}</span>
            <div class="d-flex align-center ga-1 mt-n1">
              <span class="text-caption text-grey-darken-1">{{
                procedimientoNombre
              }}</span>
              <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold ml-1">
                v{{ procedimientoVersion }}
              </v-chip>
              <v-chip size="x-small" :color="estadoVersionColor" variant="tonal" class="font-weight-bold uppercase">
                {{ procedimientoEstadoVersion }}
              </v-chip>
            </div>
          </div>
          <v-spacer></v-spacer>

          <v-select
            :model-value="procedimientoEstadoVersion"
            :items="['Borrador', 'En Revisión', 'Aprobado', 'Obsoleto']"
            label="Estado de Versión"
            density="compact"
            variant="solo-filled"
            hide-details
            style="max-width: 170px;"
            class="mr-2 rounded-lg"
            @update:model-value="changeEstadoVersion"
          ></v-select>

          <v-btn
            variant="tonal"
            color="primary"
            @click="showCreateAction = true"
            prepend-icon="mdi-plus-box-multiple"
            class="mr-2 rounded-lg font-weight-bold text-uppercase text-caption"
          >
            Crear Verbo/Acción
          </v-btn>

          <v-btn
            variant="tonal"
            color="secondary"
            @click="showPreview = true"
            prepend-icon="mdi-eye-outline"
            class="mr-2 rounded-lg font-weight-bold text-uppercase text-caption"
          >
            Vista Previa Flujo
          </v-btn>

          <v-btn
            variant="tonal"
            color="info"
            @click="showLaneManager = true"
            prepend-icon="mdi-account-multiple-plus"
            class="mr-2 rounded-lg font-weight-bold text-uppercase text-caption"
          >
            Gestionar Unidades
          </v-btn>

          <v-btn
            variant="flat"
            color="success"
            @click="emit('finalize')"
            prepend-icon="mdi-check-decagram"
            class="mr-2 rounded-lg font-weight-bold text-uppercase text-caption"
          >
            Finalizar Flujo
          </v-btn>

          <v-chip
            v-if="lastSaved"
            size="small"
            color="success"
            variant="tonal"
            class="mr-4 uppercase"
          >
            Ult. Sincro: {{ lastSaved }}
          </v-chip>
          <v-chip
            size="small"
            color="primary"
            variant="flat"
            class="uppercase px-4 font-weight-black"
          >
            Persistencia: Auto-Fila
          </v-chip>
        </v-toolbar>

        <table class="mpp-matrix-table" style="position: relative; z-index: 2; width: 100%; min-width: 1200px;">
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
              v-for="(cargo, cargoIdx) in allDisplayCargos"
              :key="cargoColumnKey(cargo, cargoIdx)"
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
              v-for="(cargo, cargoIdx) in allDisplayCargos"
              :key="cargoColumnKey(cargo, cargoIdx)"
              class="text-center diagram-cell"
              @click="handleCellClick(row, cargo.id_cargo)"
            >
              <div
                v-if="shouldShowFlowNode(row, cargo, cargoIdx)"
                class="cell-flow-node-wrap"
              >
                <div
                  class="cell-flow-node"
                  :data-row-nro="row.nro"
                  :class="getActionVisuals(row.accionId).codigoFigura"
                  :style="{ backgroundColor: getActionVisuals(row.accionId).colorHex }"
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

                <!-- Botón visible solo en rombos: abre el popup de rutas IF/ELSE -->
                <v-tooltip
                  v-if="getActionVisuals(row.accionId).codigoFigura === 'rombo'"
                  text="Configurar rutas IF / ELSE"
                  location="top"
                >
                  <template #activator="{ props: tipProps }">
                    <v-btn
                      v-bind="tipProps"
                      class="condicion-open-btn"
                      size="x-small"
                      :color="hasCondicionConfigured(row) ? 'success' : 'orange-darken-2'"
                      variant="flat"
                      icon="mdi-source-branch"
                      @click.stop="openCondicionPanel(row)"
                    ></v-btn>
                  </template>
                </v-tooltip>

                <v-chip
                  v-if="hasCondicionConfigured(row)"
                  class="condicion-cell-badge"
                  size="x-small"
                  color="success"
                  variant="flat"
                >
                  IF
                </v-chip>
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
        <tfoot>
          <tr>
            <td :colspan="12 + allDisplayCargos.length" class="pa-3 bg-slate-50 border-0">
              <v-btn
                color="secondary"
                block
                variant="tonal"
                @click="addRow"
                prepend-icon="mdi-plus"
                height="44"
                class="border-dashed font-weight-bold rounded-lg"
              >
                Añadir Nueva Fila de Operación
              </v-btn>
            </td>
          </tr>
        </tfoot>
      </table>

      <!-- SVG para conectar nodos en el editor directo (Sólido y Elegante) -->
      <svg 
        v-if="allDisplayCargos.length > 0"
        style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3;"
      >
        <defs>
          <marker 
            id="editor-arrow" 
            viewBox="0 0 10 10" 
            refX="7" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#4f46e5"/>
          </marker>
          <marker 
            id="editor-arrow-return" 
            viewBox="0 0 10 10" 
            refX="7" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#ef4444"/>
          </marker>
          <marker 
            id="editor-arrow-if" 
            viewBox="0 0 10 10" 
            refX="7" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#2e7d32"/>
          </marker>
          <marker 
            id="editor-arrow-else" 
            viewBox="0 0 10 10" 
            refX="7" 
            refY="5" 
            markerWidth="6" 
            markerHeight="6" 
            orient="auto-start-reverse"
          >
            <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#c62828"/>
          </marker>
        </defs>
        <path 
          v-for="(path, i) in editorConnectionPaths" 
          :key="i"
          :d="path.path"
          :stroke="path.color"
          stroke-width="2"
          fill="none"
          :marker-end="
            path.isIf
              ? 'url(#editor-arrow-if)'
              : path.isElse || path.isReturn
                ? path.isElse
                  ? 'url(#editor-arrow-else)'
                  : 'url(#editor-arrow-return)'
                : 'url(#editor-arrow)'
          "
        />
      </svg>
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
            <div class="pa-4 bg-slate-50">
              <v-text-field
                v-model="unitSearch"
                placeholder="Buscar unidad..."
                density="compact"
                variant="outlined"
                hide-details
                prepend-inner-icon="mdi-magnify"
                bg-color="surface"
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
            class="bg-slate-50"
          >
            <div v-if="selectedUnitId" class="pa-4">
              <div class="text-overline font-weight-black mb-2 text-primary">
                Seleccionar Cargos
              </div>
              <v-list density="compact" class="rounded-lg border bg-surface">
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
            class="bg-surface"
          >
            <div
              class="pa-4 text-overline font-weight-black border-bottom bg-slate-50"
            >
              Columnas Activas
            </div>
            <v-list density="compact" class="flex-grow-1 overflow-y-auto">
              <v-list-item
                v-for="(cargo, cargoIdx) in allDisplayCargos"
                :key="cargoColumnKey(cargo, cargoIdx)"
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
            variant="flat"
            class="rounded-lg font-weight-bold text-uppercase text-caption px-6"
            @click="showLaneManager = false"
            >Cerrar y Actualizar Matriz</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL REGISTRO RÁPIDO DE ACCIÓN -->
    <v-dialog v-model="showCreateAction" max-width="450">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" dark density="compact">
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
          <v-btn color="primary" variant="outlined" class="rounded-lg font-weight-bold text-uppercase text-caption mr-2" @click="showCreateAction = false">Cancelar</v-btn>
          <v-btn color="primary" variant="flat" class="rounded-lg font-weight-bold text-uppercase text-caption px-4" @click="createQuickAction" :loading="isSavingAction">Guardar Acción</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- MODAL CONDICIÓN IF/ELSE (Rombo) — popup visual -->
    <v-dialog v-model="showCondicionPanel" max-width="960" scrollable>
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="orange-darken-2" dark density="compact">
          <v-toolbar-title class="text-subtitle-1 font-weight-bold">
            CONDICIÓN IF/ELSE
            <span v-if="condicionRow" class="text-caption font-weight-regular ml-2">
              — Paso {{ condicionRow.nro }}
            </span>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon="mdi-close" @click="showCondicionPanel = false"></v-btn>
        </v-toolbar>

        <v-card-text class="pa-0" :class="{ 'opacity-50': isLoadingCondicion }">
          <div class="condicion-dialog-grid">
            <!-- Panel izquierdo: expresión / tipo -->
            <div class="condicion-panel-left pa-4">
              <v-select
                v-model="condicionForm.tipo_condicion"
                :items="tipoCondicionOptions"
                item-title="title"
                item-value="value"
                label="Tipo de condición"
                variant="outlined"
                density="compact"
                class="mb-3"
                hide-details
              ></v-select>
              <v-textarea
                v-model="condicionForm.expresion_condicion"
                label="Expresión de la condición"
                placeholder="Ej: ¿Documento aprobado?"
                variant="outlined"
                density="compact"
                rows="3"
                class="mb-3"
                hide-details
              ></v-textarea>
              <v-text-field
                v-model.number="condicionForm.orden"
                label="Orden"
                type="number"
                variant="outlined"
                density="compact"
                class="mb-4"
                hide-details
              ></v-text-field>

              <div class="text-caption font-weight-bold text-medium-emphasis mb-2">
                Destinos (cualquier paso)
              </div>
              <v-select
                :model-value="condicionForm.id_tarea_siguiente_if"
                :items="condicionDestinoOptions"
                item-title="title"
                item-value="value"
                label="IF (SÍ) → figura destino"
                variant="outlined"
                density="compact"
                class="mb-2"
                clearable
                hide-details
                prepend-inner-icon="mdi-check-circle"
                @update:model-value="(v) => onSelectCondicionDestino('if', v)"
              ></v-select>
              <v-select
                :model-value="condicionForm.id_tarea_siguiente_else"
                :items="condicionDestinoOptions"
                item-title="title"
                item-value="value"
                label="ELSE (NO) → figura destino"
                variant="outlined"
                density="compact"
                class="mb-3"
                clearable
                hide-details
                prepend-inner-icon="mdi-close-circle"
                @update:model-value="(v) => onSelectCondicionDestino('else', v)"
              ></v-select>

              <div class="d-flex flex-column ga-2 mb-2">
                <v-chip
                  v-if="condicionForm.id_tarea_siguiente_if"
                  color="success"
                  variant="tonal"
                  closable
                  class="align-self-start"
                  @click:close="clearCondicionRoute('if')"
                >
                  <v-icon start size="16">mdi-check-circle</v-icon>
                  IF: {{ getTareaLabelById(condicionForm.id_tarea_siguiente_if) }}
                </v-chip>
                <v-chip
                  v-if="condicionForm.id_tarea_siguiente_else"
                  color="error"
                  variant="tonal"
                  closable
                  class="align-self-start"
                  @click:close="clearCondicionRoute('else')"
                >
                  <v-icon start size="16">mdi-close-circle</v-icon>
                  ELSE: {{ getTareaLabelById(condicionForm.id_tarea_siguiente_else) }}
                </v-chip>
              </div>

              <v-alert
                type="info"
                variant="tonal"
                density="compact"
                class="mt-2 text-caption"
              >
                Puedes apuntar IF/ELSE a <strong>cualquier</strong> figura del flujo:
                anteriores (↑ −1, −2…), siguientes (+1, +2…) o saltos. Usa el select
                o haz clic en el nodo del diagrama.
              </v-alert>
            </div>

            <!-- Panel derecho: mini diagrama -->
            <div class="condicion-panel-right pa-4">
              <div class="d-flex align-center flex-wrap ga-2 mb-3">
                <span class="text-caption font-weight-bold text-medium-emphasis mr-1">
                  Ruta activa:
                </span>
                <v-btn-toggle
                  v-model="rutaActiva"
                  mandatory
                  density="compact"
                  color="primary"
                  divided
                  class="condicion-ruta-toggle"
                >
                  <v-btn value="if" color="success" variant="flat" size="small">
                    <v-icon start size="16">mdi-arrow-right-bold</v-icon>
                    IF (verde)
                  </v-btn>
                  <v-btn value="else" color="error" variant="flat" size="small">
                    <v-icon start size="16">mdi-arrow-right-bold</v-icon>
                    ELSE (rojo)
                  </v-btn>
                </v-btn-toggle>
              </div>

              <div
                ref="condicionDiagramRef"
                class="condicion-diagram"
                @scroll="recalculateCondicionConnections"
              >
                <svg class="condicion-diagram-svg" aria-hidden="true">
                  <defs>
                    <marker
                      id="arrow-if"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L6,3 L0,6 Z" fill="#2e7d32" />
                    </marker>
                    <marker
                      id="arrow-else"
                      markerWidth="8"
                      markerHeight="8"
                      refX="6"
                      refY="3"
                      orient="auto"
                    >
                      <path d="M0,0 L6,3 L0,6 Z" fill="#c62828" />
                    </marker>
                  </defs>
                  <path
                    v-for="(p, i) in condicionConnectionPaths"
                    :key="'cpath-' + i"
                    :d="p.path"
                    fill="none"
                    :stroke="p.color"
                    stroke-width="2.5"
                    :marker-end="p.color === '#2e7d32' ? 'url(#arrow-if)' : 'url(#arrow-else)'"
                  />
                  <text
                    v-for="(p, i) in condicionConnectionPaths"
                    :key="'clabel-' + i"
                    :x="p.labelX"
                    :y="p.labelY"
                    :fill="p.color"
                    font-size="11"
                    font-weight="700"
                    text-anchor="middle"
                    dy="-4"
                  >
                    {{ p.label }}
                  </text>
                </svg>

                <div
                  v-for="node in condicionDiagramNodes"
                  :key="node.tareaId || `row-${node.nro}`"
                  class="condicion-node-row"
                >
                  <div class="condicion-node-nro text-caption font-weight-bold">
                    {{ node.nro }}
                  </div>

                  <div
                    class="cell-flow-node-wrap condicion-node"
                    :class="{
                      'is-origin': node.isOrigin,
                      'is-if-target': node.isIfTarget,
                      'is-else-target': node.isElseTarget,
                      'is-selectable': node.isSelectable,
                      'is-unsaved': node.isUnsaved,
                    }"
                    :data-tarea-id="node.tareaId"
                    @click="node.isSelectable && assignCondicionNode(node.tareaId)"
                  >
                    <div
                      class="cell-flow-node"
                      :class="node.codigoFigura"
                      :style="{
                        backgroundColor: node.isUnsaved ? '#94a3b8' : node.colorHex,
                      }"
                    >
                      <div class="cell-flow-text-wrapper">
                        <span class="condicion-node-label font-weight-bold">
                          {{ node.label }}
                        </span>
                      </div>
                    </div>

                    <v-chip
                      v-if="node.isOrigin"
                      class="condicion-node-badge"
                      size="x-small"
                      color="orange-darken-2"
                      variant="flat"
                    >
                      Origen
                    </v-chip>
                    <v-chip
                      v-else-if="node.isIfTarget"
                      class="condicion-node-badge"
                      size="x-small"
                      color="success"
                      variant="flat"
                    >
                      IF
                    </v-chip>
                    <v-chip
                      v-else-if="node.isElseTarget"
                      class="condicion-node-badge"
                      size="x-small"
                      color="error"
                      variant="flat"
                    >
                      ELSE
                    </v-chip>
                    <v-chip
                      v-else-if="node.isUnsaved"
                      class="condicion-node-badge"
                      size="x-small"
                      color="grey"
                      variant="flat"
                    >
                      Sin guardar
                    </v-chip>
                    <v-chip
                      v-else
                      class="condicion-node-rel"
                      size="x-small"
                      variant="tonal"
                      color="primary"
                    >
                      {{ node.relativeHint }}
                    </v-chip>
                  </div>
                </div>

                <div
                  v-if="!condicionDiagramNodes.length"
                  class="text-center text-grey pa-8 text-caption"
                >
                  No hay figuras en la matriz para conectar.
                </div>
              </div>
            </div>
          </div>
        </v-card-text>

        <v-divider></v-divider>
        <v-card-actions class="pa-3">
          <v-btn
            v-if="condicionForm.id_condicion"
            color="error"
            variant="text"
            class="rounded-lg font-weight-bold text-uppercase text-caption"
            @click="deleteCondicionPanel"
            :loading="isSavingCondicion"
          >
            Eliminar
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            variant="outlined"
            class="rounded-lg font-weight-bold text-uppercase text-caption mr-2"
            @click="showCondicionPanel = false"
          >
            Cerrar
          </v-btn>
          <v-btn
            color="orange-darken-2"
            variant="flat"
            class="rounded-lg font-weight-bold text-uppercase text-caption px-4"
            @click="saveCondicionPanel"
            :loading="isSavingCondicion || isLoadingCondicion"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- DIÁLOGO DE PREVISUALIZACIÓN -->
    <v-dialog v-model="showPreview" max-width="950">
      <v-card class="rounded-xl overflow-hidden">
        <v-toolbar color="primary" dark density="compact">
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

        <div class="pa-8 bg-slate-50 overflow-y-auto" style="max-height: 75vh">
          <div 
            ref="diagramContainer"
            class="pa-8 bg-surface rounded-lg border overflow-x-auto"
            style="min-height: 400px; min-width: 100%;"
          >
            <!-- TÍTULO DEL DIAGRAMA -->
            <div class="text-center mb-6">
              <h2 class="text-h6 font-weight-black uppercase text-primary-darken-3 mb-1">{{ procedimientoNombre }}</h2>
              <div class="d-flex justify-center align-center">
                <v-chip size="x-small" color="primary" variant="tonal" class="font-weight-bold uppercase">{{ procesoNombre }}</v-chip>
              </div>
            </div>

            <!-- ADVERTENCIA DE CARRIL VACÍO -->
            <div v-if="allDisplayCargos.length === 0" class="text-center pa-10 text-grey-darken-1">
              <v-icon size="48" color="warning" class="mb-2">mdi-alert-circle-outline</v-icon>
              <p class="font-weight-bold">No has asignado ningún carril (Cargo) en la matriz todavía.</p>
              <p class="text-caption">Cierra esta ventana, gestiona las unidades y selecciona cargos para poder generar el diagrama.</p>
            </div>

            <!-- Contenedor alineable para SVG y Tabla -->
            <div v-else ref="scrollWrapper" class="diagram-scroll-wrapper" style="position: relative; display: inline-block; min-width: 100%;">
              <!-- TABLA DE SWIMLANES -->
              <table class="preview-swimlane-table" style="position: relative; z-index: 2;">
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
                      v-for="(cargo, cargoIdx) in allDisplayCargos"
                      :key="cargoColumnKey(cargo, cargoIdx)"
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
                      v-for="(cargo, cargoIdx) in allDisplayCargos"
                      :key="cargoColumnKey(cargo, cargoIdx)"
                      class="preview-lane-cell text-center"
                    >
                      <!-- Si este cargo es responsable, renderizar la figura (solo 1ª columna si el cargo se repite) -->
                      <div 
                        v-if="shouldShowFlowNode(row, cargo, cargoIdx)"
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

              <!-- SVG para conectar nodos (Sólido y Elegante) -->
              <svg 
                style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 3;"
              >
                <defs>
                  <marker 
                    id="arrow" 
                    viewBox="0 0 10 10" 
                    refX="7" 
                    refY="5" 
                    markerWidth="6" 
                    markerHeight="6" 
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#4f46e5"/>
                  </marker>
                  <marker 
                    id="arrow-return" 
                    viewBox="0 0 10 10" 
                    refX="7" 
                    refY="5" 
                    markerWidth="6" 
                    markerHeight="6" 
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#ef4444"/>
                  </marker>
                  <marker 
                    id="arrow-if" 
                    viewBox="0 0 10 10" 
                    refX="7" 
                    refY="5" 
                    markerWidth="6" 
                    markerHeight="6" 
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#2e7d32"/>
                  </marker>
                  <marker 
                    id="arrow-else" 
                    viewBox="0 0 10 10" 
                    refX="7" 
                    refY="5" 
                    markerWidth="6" 
                    markerHeight="6" 
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#c62828"/>
                  </marker>
                </defs>
                <path 
                  v-for="(path, i) in connectionPaths" 
                  :key="i"
                  :d="path.path"
                  :stroke="path.color"
                  stroke-width="2"
                  fill="none"
                  :marker-end="
                    path.isIf
                      ? 'url(#arrow-if)'
                      : path.isElse
                        ? 'url(#arrow-else)'
                        : path.isReturn
                          ? 'url(#arrow-return)'
                          : 'url(#arrow)'
                  "
                />
              </svg>
            </div>
          </div>
        </div>
        
        <v-divider></v-divider>
        <v-card-actions class="pa-4 bg-grey-lighten-4">
          <v-spacer></v-spacer>
          <v-btn color="primary" variant="outlined" class="rounded-lg font-weight-bold text-uppercase text-caption px-6" @click="showPreview = false">Cerrar</v-btn>
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
  background: #ffffff;
  margin-top: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
}

.preview-swimlane-table th,
.preview-swimlane-table td {
  border: 1px solid #e2e8f0;
  padding: 16px 8px;
  position: relative;
}

.preview-step-header {
  width: 65px;
  background: #f1f5f9 !important;
  color: #334155 !important;
  font-size: 0.7rem !important;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #cbd5e1 !important;
}

.preview-step-subheader {
  background: #f8fafc !important;
  border-bottom: 1px solid #e2e8f0 !important;
  width: 65px;
}

.preview-unit-header {
  background: #f1f5f9 !important;
  color: #1e293b !important;
  font-size: 0.75rem !important;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  border-bottom: 2px solid #94a3b8 !important;
}

.preview-cargo-header {
  background: #f8fafc !important;
  color: #475569 !important;
  font-size: 0.7rem !important;
  font-weight: 700;
  text-transform: uppercase;
  border-bottom: 1px solid #e2e8f0 !important;
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
  background: #64748b;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
}

.preview-lane-cell {
  background: #ffffff;
  vertical-align: middle;
  min-width: 125px;
  height: 90px;
}

.preview-lane-cell:empty {
  background: #fafafa;
}

.border-dashed {
  border: 2px dashed #94a3b8 !important;
}

/* --- Popup visual condición IF/ELSE --- */
.condicion-dialog-grid {
  display: grid;
  grid-template-columns: minmax(260px, 38%) 1fr;
  min-height: 420px;
  max-height: 70vh;
}

.condicion-panel-left {
  border-right: 1px solid #e2e8f0;
  overflow-y: auto;
}

.condicion-panel-right {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: #f8fafc;
}

.condicion-diagram {
  position: relative;
  flex: 1;
  overflow: auto;
  min-height: 320px;
  padding: 16px 56px 24px;
  background: #fff;
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
}

.condicion-diagram-svg {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 1;
  overflow: visible;
}

.condicion-node-row {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 16px;
  min-height: 96px;
  padding: 12px 0;
  margin-bottom: 8px;
}

.condicion-node-nro {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #64748b;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* Wrap axis-aligned (misma base que la matriz); estados van aquí, no en el rombo rotado */
.condicion-node.cell-flow-node-wrap {
  cursor: default;
  min-width: 96px;
  min-height: 96px;
  padding: 8px;
  margin: 0;
  border-radius: 10px;
  box-sizing: border-box;
}

.condicion-node .cell-flow-node {
  margin: 0;
}

.condicion-node-label {
  font-size: 0.55rem;
  line-height: 1.1;
  color: #fff;
  text-align: center;
  word-break: break-word;
  max-width: 100%;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.condicion-node.is-selectable {
  cursor: pointer;
}

.condicion-node.is-selectable:hover {
  background: rgba(99, 102, 241, 0.08);
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.35);
}

.condicion-node.is-unsaved {
  cursor: not-allowed;
  opacity: 0.55;
}

.condicion-node.is-origin {
  box-shadow: 0 0 0 3px #ea580c, 0 4px 12px rgba(234, 88, 12, 0.28);
  background: rgba(234, 88, 12, 0.06);
}

.condicion-node.is-if-target {
  box-shadow: 0 0 0 3px #2e7d32, 0 4px 12px rgba(46, 125, 50, 0.28);
  background: rgba(46, 125, 50, 0.06);
}

.condicion-node.is-else-target {
  box-shadow: 0 0 0 3px #c62828, 0 4px 12px rgba(198, 40, 40, 0.28);
  background: rgba(198, 40, 40, 0.06);
}

.condicion-node-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  z-index: 3;
}

.condicion-node-rel {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 3;
  font-weight: 800 !important;
}

.cell-flow-node-wrap {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 70px;
  min-width: 70px;
}

.condicion-open-btn {
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 6;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25) !important;
}

.condicion-cell-badge {
  position: absolute;
  top: -6px;
  right: -10px;
  z-index: 5;
  font-weight: 800 !important;
  pointer-events: none;
}

@media (max-width: 800px) {
  .condicion-dialog-grid {
    grid-template-columns: 1fr;
    max-height: none;
  }
  .condicion-panel-left {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }
}
</style>

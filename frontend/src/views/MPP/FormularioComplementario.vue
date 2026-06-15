<template>
  <v-card class="mx-auto my-6 rounded-xl overflow-hidden elevation-8 border border-grey-lighten-4" max-width="1200">
    <!-- Encabezado con degradado moderno y estética premium -->
    <v-sheet
      class="pa-6 text-white d-flex align-center justify-between"
      style="background: linear-gradient(135deg, #3f51b5, #1a237e); border-bottom: 2px solid rgba(255,255,255,0.1);"
    >
      <div>
        <div class="d-flex align-center">
          <v-icon size="36" class="mr-3 text-amber-accent-2">mdi-check-decagram-outline</v-icon>
          <h1 class="text-h4 font-weight-black tracking-wide">Flujo Finalizado</h1>
        </div>
        <p class="text-subtitle-1 text-blue-lighten-4 mt-2">
          Completa la información complementaria para el procedimiento: 
          <strong class="text-white">{{ procedimientoNombre }}</strong>
        </p>
      </div>
      <v-spacer></v-spacer>
      <div>
        <v-btn
          color="white"
          variant="outlined"
          prepend-icon="mdi-arrow-left"
          class="mr-3 rounded-lg font-weight-bold text-uppercase"
          @click="$emit('back')"
        >
          Volver al Diagrama
        </v-btn>
        <v-btn
          color="success"
          variant="flat"
          prepend-icon="mdi-content-save-all"
          class="rounded-lg font-weight-bold text-uppercase px-6"
          @click="$emit('exit')"
        >
          Guardar y Salir
        </v-btn>
      </div>
    </v-sheet>

    <!-- Pestañas de Vuetify con iconos y colores estilizados -->
    <v-tabs
      v-model="activeTab"
      bg-color="grey-lighten-4"
      color="primary"
      grow
      align-tabs="center"
      height="60"
      class="border-bottom"
    >
      <v-tab value="instalaciones" class="font-weight-bold">
        <v-icon start>mdi-office-building-cog</v-icon>
        🏢 Instalaciones
      </v-tab>
      <v-tab value="indicadores" class="font-weight-bold">
        <v-icon start>mdi-chart-line</v-icon>
        📊 KPIs (Indicadores)
      </v-tab>
      <v-tab value="normativas" class="font-weight-bold">
        <v-icon start>mdi-gavel</v-icon>
        📜 Marco Normativo
      </v-tab>
      <v-tab value="sistemas" class="font-weight-bold">
        <v-icon start>mdi-laptop-account</v-icon>
        💻 Sistemas
      </v-tab>
      <v-tab value="equipos" class="font-weight-bold">
        <v-icon start>mdi-toolbox-outline</v-icon>
        🛠️ Equipos
      </v-tab>
    </v-tabs>

    <!-- Contenido de las pestañas -->
    <v-card-text class="pa-6 bg-grey-lighten-5">
      <v-window v-model="activeTab">
        
        <!-- PESTAÑA: INSTALACIONES -->
        <v-window-item value="instalaciones">
          <div class="mb-4">
            <h3 class="text-h6 font-weight-bold text-grey-darken-3">🏢 Unidades / Instalaciones Participantes</h3>
            <p class="text-caption text-grey-darken-1">Selecciona las dependencias físicas u oficinas donde se realiza o supervisa este procedimiento. Los cambios se guardan automáticamente.</p>
          </div>
          
          <v-row>
            <v-col 
              v-for="u in mppStore.unidades" 
              :key="u.id_unidad" 
              cols="12" 
              sm="6" 
              md="4"
            >
              <v-card
                variant="flat"
                class="pa-3 rounded-xl border d-flex align-center cursor-pointer transition-all hover-elevation"
                :class="isUnitSelected(u.id_unidad) ? 'bg-indigo-lighten-5 border-indigo-lighten-3' : 'bg-white border-grey-lighten-3'"
                @click="toggleUnitInstallation(u.id_unidad)"
              >
                <v-checkbox-btn
                  :model-value="isUnitSelected(u.id_unidad)"
                  color="indigo"
                  class="mr-2"
                  @click.stop="toggleUnitInstallation(u.id_unidad)"
                ></v-checkbox-btn>
                <div>
                  <div class="text-body-2 font-weight-bold text-indigo-darken-3">{{ u.nombre || u.nombre_unidad }}</div>
                  <div class="text-caption text-grey">{{ u.sigla || 'Sin sigla' }} • {{ u.tipo_unidad || 'Unidad' }}</div>
                </div>
              </v-card>
            </v-col>
          </v-row>
        </v-window-item>

        <!-- PESTAÑA: KPIs (INDICADORES) -->
        <v-window-item value="indicadores">
          <div class="d-flex align-center justify-between mb-4">
            <div>
              <h3 class="text-h6 font-weight-bold text-grey-darken-3">📊 Indicadores de Rendimiento (KPIs)</h3>
              <p class="text-caption text-grey-darken-1">Métricas y fórmulas para medir la eficiencia y calidad del trámite.</p>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="rounded-lg font-weight-bold"
              @click="openModal('indicador')"
            >
              Nuevo Indicador
            </v-btn>
          </div>

          <v-table class="rounded-xl border bg-white overflow-hidden">
            <thead class="bg-grey-lighten-4">
              <tr>
                <th class="font-weight-bold text-left">Denominación</th>
                <th class="font-weight-bold text-left">Fórmula</th>
                <th class="font-weight-bold text-center">Meta</th>
                <th class="font-weight-bold text-center">Frecuencia</th>
                <th class="font-weight-bold text-center" width="120">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="indicadoresFiltrados.length === 0">
                <td colspan="5" class="text-center py-8 text-grey">
                  No hay indicadores registrados para este procedimiento. ¡Agrega uno!
                </td>
              </tr>
              <tr v-for="item in indicadoresFiltrados" :key="item.id_indicador">
                <td class="text-body-2 font-weight-bold text-grey-darken-3">{{ item.denominacion }}</td>
                <td class="text-caption font-mono text-grey-darken-1">{{ item.formula || 'No definida' }}</td>
                <td class="text-body-2 text-center font-weight-bold text-green-darken-2">{{ item.meta || '-' }}</td>
                <td class="text-caption text-center">{{ item.frecuencia || 'Mensual' }}</td>
                <td class="text-center">
                  <v-btn icon size="small" variant="text" color="indigo" @click="openModal('indicador', item)"><v-icon>mdi-pencil</v-icon></v-btn>
                  <v-btn icon size="small" variant="text" color="red" @click="deleteResource('indicador', item.id_indicador)"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

        <!-- PESTAÑA: MARCO NORMATIVO -->
        <v-window-item value="normativas">
          <div class="d-flex align-center justify-between mb-4">
            <div>
              <h3 class="text-h6 font-weight-bold text-grey-darken-3">📜 Marco Legal y Directivas</h3>
              <p class="text-caption text-grey-darken-1">Leyes, reglamentos y normativas de calidad que amparan el procedimiento.</p>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="rounded-lg font-weight-bold"
              @click="openModal('normativa')"
            >
              Nueva Norma
            </v-btn>
          </div>

          <v-table class="rounded-xl border bg-white overflow-hidden">
            <thead class="bg-grey-lighten-4">
              <tr>
                <th class="font-weight-bold text-left">Código / Referencia</th>
                <th class="font-weight-bold text-left">Nombre de la Norma</th>
                <th class="font-weight-bold text-left">URL / Documento</th>
                <th class="font-weight-bold text-center" width="120">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="normativasFiltradas.length === 0">
                <td colspan="4" class="text-center py-8 text-grey">
                  No hay normativas registradas para este procedimiento. ¡Agrega una!
                </td>
              </tr>
              <tr v-for="item in normativasFiltradas" :key="item.id_normativa">
                <td class="text-body-2 font-weight-bold text-grey-darken-3">{{ item.codigo || 'S/C' }}</td>
                <td class="text-body-2 text-grey-darken-2">{{ item.nombre }}</td>
                <td class="text-caption text-left">
                  <a v-if="item.url" :href="item.url" target="_blank" class="text-indigo text-decoration-none font-weight-bold">
                    <v-icon size="16">mdi-open-in-new</v-icon> Ver Documento
                  </a>
                  <span v-else class="text-grey">Sin enlace</span>
                </td>
                <td class="text-center">
                  <v-btn icon size="small" variant="text" color="indigo" @click="openModal('normativa', item)"><v-icon>mdi-pencil</v-icon></v-btn>
                  <v-btn icon size="small" variant="text" color="red" @click="deleteResource('normativa', item.id_normativa)"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

        <!-- PESTAÑA: SISTEMAS DE INFORMACIÓN -->
        <v-window-item value="sistemas">
          <div class="d-flex align-center justify-between mb-4">
            <div>
              <h3 class="text-h6 font-weight-bold text-grey-darken-3">💻 Sistemas de Información / Software</h3>
              <p class="text-caption text-grey-darken-1">Herramientas digitales e informáticas requeridas en los pasos del flujo.</p>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="rounded-lg font-weight-bold"
              @click="openModal('sistema')"
            >
              Nuevo Sistema
            </v-btn>
          </div>

          <v-table class="rounded-xl border bg-white overflow-hidden">
            <thead class="bg-grey-lighten-4">
              <tr>
                <th class="font-weight-bold text-left">Nombre del Sistema</th>
                <th class="font-weight-bold text-left">Versión</th>
                <th class="font-weight-bold text-center" width="120">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="sistemasFiltrados.length === 0">
                <td colspan="3" class="text-center py-8 text-grey">
                  No hay sistemas registrados para este procedimiento. ¡Agrega uno!
                </td>
              </tr>
              <tr v-for="item in sistemasFiltrados" :key="item.id_sistema_informacion">
                <td class="text-body-2 font-weight-bold text-grey-darken-3">{{ item.nombre }}</td>
                <td class="text-caption text-grey-darken-1">{{ item.version || '1.0' }}</td>
                <td class="text-center">
                  <v-btn icon size="small" variant="text" color="indigo" @click="openModal('sistema', item)"><v-icon>mdi-pencil</v-icon></v-btn>
                  <v-btn icon size="small" variant="text" color="red" @click="deleteResource('sistema', item.id_sistema_informacion)"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

        <!-- PESTAÑA: EQUIPOS -->
        <v-window-item value="equipos">
          <div class="d-flex align-center justify-between mb-4">
            <div>
              <h3 class="text-h6 font-weight-bold text-grey-darken-3">🛠️ Equipos, Hardware y Herramientas</h3>
              <p class="text-caption text-grey-darken-1">Maquinaria, hardware u otros recursos materiales asignados.</p>
            </div>
            <v-btn
              color="primary"
              prepend-icon="mdi-plus"
              class="rounded-lg font-weight-bold"
              @click="openModal('equipo')"
            >
              Nuevo Equipo
            </v-btn>
          </div>

          <v-table class="rounded-xl border bg-white overflow-hidden">
            <thead class="bg-grey-lighten-4">
              <tr>
                <th class="font-weight-bold text-left">Nombre del Recurso</th>
                <th class="font-weight-bold text-left">Descripción / Especificaciones</th>
                <th class="font-weight-bold text-center" width="120">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="equiposFiltrados.length === 0">
                <td colspan="3" class="text-center py-8 text-grey">
                  No hay equipos registrados para este procedimiento. ¡Agrega uno!
                </td>
              </tr>
              <tr v-for="item in equiposFiltrados" :key="item.id_equipos">
                <td class="text-body-2 font-weight-bold text-grey-darken-3">{{ item.nombre }}</td>
                <td class="text-caption text-grey-darken-1">{{ item.descripcion || 'Sin descripción' }}</td>
                <td class="text-center">
                  <v-btn icon size="small" variant="text" color="indigo" @click="openModal('equipo', item)"><v-icon>mdi-pencil</v-icon></v-btn>
                  <v-btn icon size="small" variant="text" color="red" @click="deleteResource('equipo', item.id_equipos)"><v-icon>mdi-trash-can-outline</v-icon></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-window-item>

      </v-window>
    </v-card-text>

    <!-- DIALOGO COMPARTIDO DE EDICIÓN/CREACIÓN -->
    <v-dialog v-model="showModal" max-width="600px" persistent>
      <v-card class="rounded-xl pa-4">
        <v-card-title class="text-h5 font-weight-bold d-flex align-center">
          <v-icon color="primary" class="mr-2">{{ modalIcon }}</v-icon>
          {{ mode === 'create' ? 'Agregar' : 'Editar' }} {{ modalTitle }}
        </v-card-title>
        
        <v-card-text>
          <v-form ref="formRef" class="mt-2">
            <!-- Campos para INDICADOR -->
            <v-row dense v-if="modalType === 'indicador'">
              <v-col cols="12">
                <v-text-field v-model="formData.denominacion" label="Denominación del Indicador" variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="formData.descripcion" label="Descripción Detallada" variant="outlined" density="compact" rows="2"></v-textarea>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="formData.formula" label="Fórmula (ej: (A/B)*100)" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="formData.unidad_medida" label="Unidad de Medida (ej: %)" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="formData.meta" label="Valor Meta (ej: >= 90%)" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="formData.frecuencia" label="Frecuencia (ej: Mensual)" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="formData.fuente_datos" label="Fuente de Datos" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="formData.metodo_verificacion" label="Método de Verificación" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>

            <!-- Campos para NORMATIVA -->
            <v-row dense v-if="modalType === 'normativa'">
              <v-col cols="12">
                <v-text-field v-model="formData.nombre" label="Nombre de la Norma" variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="formData.codigo" label="Código / Referencia" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12" md="6">
                <v-text-field v-model="formData.fecha_emision" label="Fecha de Emisión" type="date" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="formData.url" label="URL / Enlace del Documento" variant="outlined" density="compact"></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="formData.descripcion" label="Resumen / Detalle" variant="outlined" density="compact" rows="2"></v-textarea>
              </v-col>
            </v-row>

            <!-- Campos para SISTEMA -->
            <v-row dense v-if="modalType === 'sistema'">
              <v-col cols="12">
                <v-text-field v-model="formData.nombre" label="Nombre del Sistema" variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-text-field v-model="formData.version" label="Versión" variant="outlined" density="compact"></v-text-field>
              </v-col>
            </v-row>

            <!-- Campos para EQUIPO -->
            <v-row dense v-if="modalType === 'equipo'">
              <v-col cols="12">
                <v-text-field v-model="formData.nombre" label="Nombre del Equipo / Recurso" variant="outlined" density="compact" required></v-text-field>
              </v-col>
              <v-col cols="12">
                <v-textarea v-model="formData.descripcion" label="Descripción / Especificaciones" variant="outlined" density="compact" rows="2"></v-textarea>
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>

        <v-card-actions class="px-6 pb-4">
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showModal = false" class="rounded-lg text-uppercase">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" :loading="isSaving" @click="saveModal" class="rounded-lg px-6 text-uppercase">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Snackbar de notificaciones rápidas -->
    <v-snackbar v-model="sb.show" :color="sb.color" timeout="3000">
      {{ sb.text }}
      <template v-slot:actions>
        <v-btn icon="mdi-close" variant="text" @click="sb.show = false"></v-btn>
      </template>
    </v-snackbar>
  </v-card>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useMppCoreStore } from '@/stores/mpp_core';

const props = defineProps({
  procedimientoId: {
    type: [Number, String],
    required: true
  },
  procesoId: {
    type: [Number, String],
    required: true
  }
});

const emit = defineEmits(['back', 'exit']);

const mppStore = useMppCoreStore();

// UI States
const activeTab = ref('instalaciones');
const showModal = ref(false);
const isSaving = ref(false);
const sb = ref({ show: false, text: '', color: 'success' });

// Modal Configuration States
const mode = ref('create'); // 'create' | 'edit'
const modalType = ref(''); // 'indicador' | 'normativa' | 'sistema' | 'equipo'
const editingId = ref(null);
const formData = ref({});

// Procedimiento local state for instalaciones
const currentProcedimiento = ref(null);

onMounted(async () => {
  try {
    // Cargar dependencias de la tienda si no están en memoria
    if (!mppStore.unidades.length) await mppStore.fetchUnidades();
    if (!mppStore.indicadores.length) await mppStore.fetchIndicadores();
    if (!mppStore.normativas.length) await mppStore.fetchNormativas();
    if (!mppStore.sistemasInformacion.length) await mppStore.fetchSistemasInformacion();
    if (!mppStore.equipos.length) await mppStore.fetchEquipos();

    // Recuperar datos específicos del procedimiento
    await loadProcedimientoDetails();
  } catch (err) {
    console.error('Error cargando dependencias en formulario complementario:', err);
    showNotification('Error al cargar datos previos del formulario', 'error');
  }
});

const procedimientoNombre = computed(() => {
  return currentProcedimiento.value?.nombre || 'Procedimiento';
});

const loadProcedimientoDetails = async () => {
  const pId = Number(props.procedimientoId);
  // Intentar cargar de la store
  const found = mppStore.procedimientos.find(p => Number(p.id_procedimiento) === pId);
  if (found) {
    currentProcedimiento.value = found;
  } else {
    // Si no está cargado, recargar procedimientos del proceso
    await mppStore.fetchProcedimientos(props.procesoId);
    currentProcedimiento.value = mppStore.procedimientos.find(p => Number(p.id_procedimiento) === pId);
  }
};

// --- LOGICA DE INSTALACIONES (UNIDADES) ---
const isUnitSelected = (unitId) => {
  if (!currentProcedimiento.value || !currentProcedimiento.value.instalaciones) return false;
  return currentProcedimiento.value.instalaciones.some(u => Number(u.id_unidad || u.id) === Number(unitId));
};

const toggleUnitInstallation = async (unitId) => {
  const numUnitId = Number(unitId);
  const pId = Number(props.procedimientoId);
  if (!currentProcedimiento.value) return;

  const currentInst = currentProcedimiento.value.instalaciones || [];
  let nextIds = [];

  const exists = currentInst.some(u => Number(u.id_unidad || u.id) === numUnitId);
  if (exists) {
    nextIds = currentInst
      .filter(u => Number(u.id_unidad || u.id) !== numUnitId)
      .map(u => Number(u.id_unidad || u.id));
  } else {
    nextIds = [...currentInst.map(u => Number(u.id_unidad || u.id)), numUnitId];
  }

  try {
    console.log(`📡 [Form-Comp] Actualizando instalaciones para procedimiento ${pId}. Nuevos IDs:`, nextIds);
    await mppStore.updateProcedimiento(pId, { id_instalaciones: nextIds });
    await loadProcedimientoDetails(); // Recargar de la DB para actualizar visualmente
    showNotification('Instalaciones sincronizadas con éxito', 'success');
  } catch (err) {
    console.error('Error actualizando instalaciones:', err);
    showNotification('Error al asociar la instalación con el procedimiento', 'error');
  }
};

// --- FILTROS PARA LAS TABLAS DE RECURSOS ---
const indicadoresFiltrados = computed(() => {
  const pId = Number(props.procedimientoId);
  return mppStore.indicadores.filter(item => 
    Array.isArray(item.procedimientos) && 
    item.procedimientos.some(p => Number(p.id_procedimiento) === pId)
  );
});

const normativasFiltradas = computed(() => {
  const pId = Number(props.procedimientoId);
  return mppStore.normativas.filter(item => 
    Array.isArray(item.procedimientos) && 
    item.procedimientos.some(p => Number(p.id_procedimiento) === pId)
  );
});

const sistemasFiltrados = computed(() => {
  const pId = Number(props.procedimientoId);
  return mppStore.sistemasInformacion.filter(item => 
    Array.isArray(item.procedimientos) && 
    item.procedimientos.some(p => Number(p.id_procedimiento) === pId)
  );
});

const equiposFiltrados = computed(() => {
  const pId = Number(props.procedimientoId);
  return mppStore.equipos.filter(item => 
    Array.isArray(item.procedimientos) && 
    item.procedimientos.some(p => Number(p.id_procedimiento) === pId)
  );
});

// --- DIALOG CONFIGURATIONS ---
const modalTitle = computed(() => {
  switch (modalType.value) {
    case 'indicador': return 'Indicador (KPI)';
    case 'normativa': return 'Marco Normativo';
    case 'sistema': return 'Sistema de Información';
    case 'equipo': return 'Equipo';
    default: return 'Recurso';
  }
});

const modalIcon = computed(() => {
  switch (modalType.value) {
    case 'indicador': return 'mdi-chart-line';
    case 'normativa': return 'mdi-gavel';
    case 'sistema': return 'mdi-laptop-account';
    case 'equipo': return 'mdi-toolbox-outline';
    default: return 'mdi-plus-box';
  }
});

const openModal = (type, item = null) => {
  modalType.value = type;
  if (item) {
    mode.value = 'edit';
    editingId.value = item.id_indicador || item.id_normativa || item.id_sistema_informacion || item.id_equipos;
    formData.value = { ...item };
    if (type === 'normativa' && item.fecha_emision) {
      // Formatear fecha a YYYY-MM-DD para el input nativo
      formData.value.fecha_emision = new Date(item.fecha_emision).toISOString().substring(0, 10);
    }
  } else {
    mode.value = 'create';
    editingId.value = null;
    formData.value = {};
  }
  showModal.value = true;
};

// --- GUARDAR MODALES ---
const saveModal = async () => {
  isSaving.value = true;
  const pId = Number(props.procedimientoId);
  try {
    const payload = { 
      ...formData.value,
      id_procedimientos: [pId] // Asociar al procedimiento actual
    };

    if (mode.value === 'create') {
      if (modalType.value === 'indicador') {
        await mppStore.saveIndicador(payload);
        await mppStore.fetchIndicadores();
      } else if (modalType.value === 'normativa') {
        await mppStore.saveNormativa(payload);
        await mppStore.fetchNormativas();
      } else if (modalType.value === 'sistema') {
        await mppStore.saveSistemaInformacion(payload);
        await mppStore.fetchSistemasInformacion();
      } else if (modalType.value === 'equipo') {
        await mppStore.saveEquipo(payload);
        await mppStore.fetchEquipos();
      }
      showNotification(`${modalTitle.value} agregado exitosamente`, 'success');
    } else {
      const id = editingId.value;
      if (modalType.value === 'indicador') {
        await mppStore.updateIndicador(id, payload);
        await mppStore.fetchIndicadores();
      } else if (modalType.value === 'normativa') {
        await mppStore.updateNormativa(id, payload);
        await mppStore.fetchNormativas();
      } else if (modalType.value === 'sistema') {
        await mppStore.updateSistemaInformacion(id, payload);
        await mppStore.fetchSistemasInformacion();
      } else if (modalType.value === 'equipo') {
        await mppStore.updateEquipo(id, payload);
        await mppStore.fetchEquipos();
      }
      showNotification(`${modalTitle.value} actualizado exitosamente`, 'success');
    }
    showModal.value = false;
  } catch (err) {
    console.error('Error al guardar recurso:', err);
    showNotification('Error al intentar guardar el recurso', 'error');
  } finally {
    isSaving.value = false;
  }
};

// --- ELIMINAR RECURSOS ---
const deleteResource = async (type, id) => {
  if (!confirm('¿Estás seguro de que deseas eliminar este recurso?')) return;
  try {
    if (type === 'indicador') {
      await mppStore.deleteIndicador(id);
      await mppStore.fetchIndicadores();
    } else if (type === 'normativa') {
      await mppStore.deleteNormativa(id);
      await mppStore.fetchNormativas();
    } else if (type === 'sistema') {
      await mppStore.deleteSistemaInformacion(id);
      await mppStore.fetchSistemasInformacion();
    } else if (type === 'equipo') {
      await mppStore.deleteEquipo(id);
      await mppStore.fetchEquipos();
    }
    showNotification('Recurso eliminado con éxito', 'success');
  } catch (err) {
    console.error('Error al eliminar recurso:', err);
    showNotification('Error al intentar eliminar el recurso', 'error');
  }
};

const showNotification = (text, color = 'success') => {
  sb.value = { show: true, text, color };
};
</script>

<style scoped>
.transition-all {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
.hover-elevation:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0,0,0,0.06) !important;
}
.font-mono {
  font-family: monospace;
}
.border-bottom {
  border-bottom: 1px solid #e0e0e0;
}
.cursor-pointer {
  cursor: pointer;
}
</style>

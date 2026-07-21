<template>
  <v-container
    fluid
    class="pa-6 fill-height bg-slate-50 overflow-y-auto align-start"
  >
    <v-row justify="center" class="w-100 ma-0">
      <v-col cols="12" xl="11">
        <!-- HEADER BANNER -->
        <v-card
          elevation="12"
          class="rounded-xl border-top-primary overflow-hidden mb-6"
        >
          <div
            class="px-6 py-5 border-bottom d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-4 bg-surface"
          >
            <div>
              <div class="d-flex align-center">
                <v-icon color="primary" class="mr-2" size="28"
                  >mdi-history</v-icon
                >
                <h1 class="text-h5 font-weight-bold text-slate-800">
                  HISTORIAL Y RELACIONES DEL MPP
                </h1>
              </div>
              <div class="text-caption text-slate-500 mt-1">
                Explore y compare las versiones de procedimientos, sus marcos
                legales, indicadores y flujos operacionales mapeados en el
                sistema.
              </div>
            </div>
            <div
              class="d-flex align-center flex-wrap ga-3 w-100 w-md-auto justify-start justify-md-end"
            >
              <!-- Filtro de estado -->
              <v-select
                v-model="statusFilter"
                :items="['Todos', 'Borrador', 'En Revisión', 'Aprobado', 'Obsoleto', 'Activo', 'Inactivo']"
                label="Estado"
                variant="solo-filled"
                density="compact"
                hide-details
                style="max-width: 170px; min-width: 140px"
                class="rounded-lg flex-grow-1 flex-md-grow-0"
              ></v-select>

              <!-- Buscador integrado -->
              <v-text-field
                v-model="searchQuery"
                label="Buscar proceso, procedimiento o código..."
                prepend-inner-icon="mdi-magnify"
                variant="solo-filled"
                density="compact"
                hide-details
                clearable
                style="max-width: 350px; min-width: 250px; width: 100%"
                class="rounded-lg flex-grow-1 flex-md-grow-0"
              ></v-text-field>
            </div>
          </div>
        </v-card>

        <!-- CARGANDO / LOADING -->
        <v-card
          v-if="loadingGlobal"
          class="rounded-xl pa-8 text-center"
          elevation="4"
        >
          <v-progress-circular
            indeterminate
            color="primary"
            size="64"
            class="mb-4"
          ></v-progress-circular>
          <div class="text-subtitle-1 text-grey-darken-1">
            Cargando base de conocimiento e historial de versiones...
          </div>
        </v-card>

        <!-- SIN DATOS / NO DATA -->
        <v-card
          v-else-if="filteredProcesos.length === 0"
          class="rounded-xl pa-8 text-center"
          elevation="4"
        >
          <v-icon size="64" color="grey" class="mb-4">mdi-database-off</v-icon>
          <div class="text-subtitle-1 text-grey-darken-1 font-weight-bold">
            No se encontraron procesos ni procedimientos relacionados
          </div>
          <div class="text-caption text-grey">
            Pruebe ajustando los filtros de búsqueda o de estado.
          </div>
        </v-card>

        <!-- LISTA DE PROCESOS (EXPANSION PANELS) -->
        <v-expansion-panels v-else v-model="expandedProcessPanel" multiple>
          <v-expansion-panel
            v-for="proceso in filteredProcesos"
            :key="proceso.id_proceso"
            class="rounded-xl mb-4 overflow-hidden border elevation-3"
          >
            <!-- Cabecera del Proceso -->
            <v-expansion-panel-title class="py-4">
              <v-row align="center" no-gutters>
                <v-col
                  cols="12"
                  md="8"
                  class="d-flex align-center flex-wrap ga-2"
                >
                  <v-chip
                    size="small"
                    color="primary"
                    variant="flat"
                    class="font-weight-black uppercase px-3"
                  >
                    Proceso: {{ proceso.codigo || `#${proceso.id_proceso}` }}
                  </v-chip>
                  <span class="text-h6 font-weight-bold text-slate-800">{{
                    proceso.nombre
                  }}</span>
                </v-col>
                <v-col
                  cols="12"
                  md="4"
                  class="text-md-right mt-2 mt-md-0 d-flex justify-md-end flex-wrap ga-2"
                >
                  <v-chip
                    size="x-small"
                    color="info"
                    variant="tonal"
                    class="font-weight-bold uppercase"
                    prepend-icon="mdi-account-tie"
                  >
                    Resp: {{ getProcessResponsible(proceso.id_proceso) }}
                  </v-chip>
                  <v-chip
                    size="x-small"
                    color="secondary"
                    variant="tonal"
                    class="font-weight-bold"
                    prepend-icon="mdi-file-tree"
                  >
                    {{ getProcedimientosCount(proceso.id_proceso) }}
                    Procedimientos
                  </v-chip>
                </v-col>
              </v-row>
            </v-expansion-panel-title>

            <v-expansion-panel-text class="bg-slate-50 border-top pa-2">
              <!-- Información de soporte del proceso -->
              <div class="mb-4 pa-4 bg-surface rounded-lg border">
                <div
                  class="text-subtitle-2 font-weight-black text-primary mb-1"
                >
                  Descripción del Proceso:
                </div>
                <p class="text-body-2 text-slate-700 mb-3">
                  {{ proceso.descripcion || "Sin descripción detallada." }}
                </p>

                <div
                  class="text-subtitle-2 font-weight-black text-primary mb-1"
                >
                  Unidades Participantes del Proceso:
                </div>
                <div class="d-flex flex-wrap ga-2">
                  <v-chip
                    v-for="unidad in proceso.unidades || []"
                    :key="unidad.id_unidad"
                    size="x-small"
                    color="grey-darken-1"
                    variant="tonal"
                    prepend-icon="mdi-domain"
                  >
                    {{ unidad.nombre || unidad.nombre_unidad }}
                  </v-chip>
                  <span
                    v-if="!proceso.unidades || proceso.unidades.length === 0"
                    class="text-caption text-grey italic"
                    >No hay unidades específicas vinculadas.</span
                  >
                </div>
              </div>

              <!-- TABLA DE PROCEDIMIENTOS AGRUPADOS POR NOMBRE/CÓDIGO BASE (VERSIONADO) -->
              <div
                class="text-subtitle-1 font-weight-black text-slate-700 px-2 mb-3"
              >
                Historial de Procedimientos:
              </div>

              <div class="overflow-x-auto w-100 rounded-lg border mb-3">
                <v-table class="bg-surface" style="min-width: 800px">
                  <thead class="bg-indigo-lighten-5">
                    <tr class="text-uppercase text-caption font-weight-bold">
                      <th class="font-weight-bold text-left" width="140">
                        Código
                      </th>
                      <th class="font-weight-bold text-left">
                        Nombre del Procedimiento
                      </th>
                      <th class="font-weight-bold text-center" width="180">
                        Versiones Disponibles
                      </th>
                      <th class="font-weight-bold text-center" width="140">
                        Última Versión
                      </th>
                      <th class="font-weight-bold text-center" width="130">
                        Estado Actual
                      </th>
                      <th class="font-weight-bold text-center" width="140">
                        Detalles
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr
                      v-if="
                        getProcedimientosGrouped(proceso.id_proceso).length ===
                        0
                      "
                    >
                      <td
                        colspan="6"
                        class="text-center py-6 text-grey text-caption"
                      >
                        No se encontraron procedimientos en este proceso con los
                        filtros aplicados.
                      </td>
                    </tr>
                    <tr
                      v-for="grupo in getProcedimientosGrouped(
                        proceso.id_proceso,
                      )"
                      :key="grupo.nombreBase"
                      class="hover-row"
                    >
                      <td class="text-caption font-weight-black text-primary">
                        {{ grupo.codigoBase || "S/C" }}
                      </td>
                      <td class="text-body-2 font-weight-medium text-slate-800">
                        {{ grupo.nombreBase }}
                      </td>
                      <td class="text-center">
                        <!-- Dropdown rápido para elegir y comparar versiones en el drawer -->
                        <v-select
                          v-model="grupo.selectedVersionId"
                          :items="grupo.versiones"
                          item-title="versionLabel"
                          item-value="id_procedimiento"
                          variant="outlined"
                          density="compact"
                          hide-details
                          class="version-select rounded-lg"
                        ></v-select>
                      </td>
                      <td class="text-center">
                        <v-chip
                          size="x-small"
                          color="primary"
                          variant="flat"
                          class="font-weight-bold"
                        >
                          v{{
                            getProcedureVersionString(
                              grupo.selectedVersionId,
                              grupo.versiones,
                            )
                          }}
                        </v-chip>
                      </td>
                      <td class="text-center">
                        <v-chip
                          size="x-small"
                          :color="
                            getProcedureStatusColor(
                              grupo.selectedVersionId,
                              grupo.versiones,
                            )
                          "
                          variant="tonal"
                          class="font-weight-bold text-uppercase"
                        >
                          {{
                            getProcedureStatus(
                              grupo.selectedVersionId,
                              grupo.versiones,
                            )
                          }}
                        </v-chip>
                      </td>
                      <td class="text-center">
                        <div class="d-flex align-center justify-center ga-2">
                          <v-btn
                            size="small"
                            color="primary"
                            variant="flat"
                            prepend-icon="mdi-eye"
                            class="rounded-lg text-caption font-weight-bold"
                            @click="openDetailsDrawer(grupo.selectedVersionId)"
                          >
                            Explorar
                          </v-btn>

                          <v-btn
                            size="small"
                            :color="getProcedureStatus(grupo.selectedVersionId, grupo.versiones) === 'Aprobado' || getProcedureStatus(grupo.selectedVersionId, grupo.versiones) === 'Activo' ? 'success' : 'warning'"
                            variant="tonal"
                            :prepend-icon="getProcedureStatus(grupo.selectedVersionId, grupo.versiones) === 'Aprobado' || getProcedureStatus(grupo.selectedVersionId, grupo.versiones) === 'Activo' ? 'mdi-file-plus-outline' : 'mdi-pencil'"
                            class="rounded-lg text-caption font-weight-bold"
                            @click="handleProcedureEditOrCreateNewVersion(grupo.selectedVersionId, proceso.id_proceso)"
                          >
                            {{ (getProcedureStatus(grupo.selectedVersionId, grupo.versiones) === 'Aprobado' || getProcedureStatus(grupo.selectedVersionId, grupo.versiones) === 'Activo') ? 'Nueva Versión' : 'Editar' }}
                          </v-btn>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </v-table>
              </div>
            </v-expansion-panel-text>
          </v-expansion-panel>
        </v-expansion-panels>
      </v-col>
    </v-row>

    <!-- DRAWER DE DETALLES Y RELACIONES DEL PROCEDIMIENTO SELECCIONADO -->
    <v-navigation-drawer
      v-model="drawerOpen"
      location="right"
      temporary
      :width="smAndDown ? '100%' : '820'"
      class="elevation-16 rounded-l-xl overflow-hidden border-left-primary"
    >
      <div v-if="selectedProcedure" class="bg-surface">
        <!-- CABECERA DEL DRAWER -->
        <div
          class="px-6 py-4 border-bottom flex-shrink-0 bg-surface d-flex align-center justify-space-between ga-2"
        >
          <div class="flex-grow-1 min-width-0">
            <div class="d-flex align-center flex-wrap ga-2">
              <v-chip
                size="x-small"
                color="secondary"
                variant="flat"
                class="font-weight-black uppercase"
              >
                {{
                  selectedProcedure.codigo ||
                  `PROC-${selectedProcedure.id_procedimiento}`
                }}
              </v-chip>
              <v-chip
                size="x-small"
                color="primary"
                variant="tonal"
                class="font-weight-black"
              >
                Versión {{ selectedProcedure.version || "1.0" }}
              </v-chip>
              <v-chip
                size="x-small"
                :color="
                  selectedProcedure.estado === 'Activo' ? 'success' : 'grey'
                "
                variant="tonal"
                class="font-weight-black uppercase"
              >
                {{ selectedProcedure.estado || "Activo" }}
              </v-chip>
            </div>
            <h2
              class="text-h6 font-weight-bold text-slate-800 mt-2 line-clamp-2 pr-4"
            >
              {{ selectedProcedure.nombre }}
            </h2>
          </div>
          <v-btn
            icon="mdi-close"
            variant="tonal"
            size="small"
            class="flex-shrink-0"
            @click="drawerOpen = false"
          ></v-btn>
        </div>

        <!-- PESTAÑAS DENTRO DEL DRAWER -->
        <v-tabs
          v-model="drawerTab"
          bg-color="surface"
          color="primary"
          grow
          height="50"
          class="border-bottom flex-shrink-0"
          show-arrows
        >
          <v-tab value="general" class="font-weight-bold text-caption">
            <v-icon start size="18">mdi-file-document-outline</v-icon>
            Estructura y Recursos
          </v-tab>
          <v-tab value="calidad" class="font-weight-bold text-caption">
            <v-icon start size="18">mdi-check-decagram-outline</v-icon>
            Calidad (Leyes/KPIs)
          </v-tab>
          <v-tab value="flujo" class="font-weight-bold text-caption">
            <v-icon start size="18">mdi-chart-gantt</v-icon>
            Matriz de Flujo
          </v-tab>
        </v-tabs>

        <!-- CONTENIDO DE LAS PESTAÑAS (SCROLLABLE) -->
        <div class="pt-2 px-6 pb-6 bg-slate-50">
          <!-- PESTAÑA 1: ESTRUCTURA Y RECURSOS -->
          <div v-show="drawerTab === 'general'" class="px-1 pb-1 pt-0">
            <!-- Información Técnica -->
            <v-card class="rounded-xl border pa-4 mb-4" elevation="2">
              <h3
                class="text-subtitle-2 font-weight-black text-primary mb-3 uppercase"
              >
                Detalles Técnicos
              </h3>
              <v-row dense>
                <v-col cols="12" md="6" class="mb-2">
                  <span
                    class="text-caption font-weight-bold text-slate-400 d-block"
                    >PERIODICIDAD:</span
                  >
                  <span class="text-body-2 font-weight-medium text-slate-800">{{
                    selectedProcedure.periodicidad || "No definida"
                  }}</span>
                </v-col>
                <v-col cols="12" md="6" class="mb-2">
                  <span
                    class="text-caption font-weight-bold text-slate-400 d-block"
                    >PROCESO PADRE:</span
                  >
                  <span class="text-body-2 font-weight-medium text-slate-800">{{
                    selectedProcedure.proceso?.nombre || "Proceso relacionado"
                  }}</span>
                </v-col>
                <v-col cols="12" class="mb-3">
                  <span
                    class="text-caption font-weight-bold text-slate-400 d-block"
                    >OBJETIVOS:</span
                  >
                  <span
                    class="text-body-2 text-slate-700 bg-slate-50 pa-2 rounded d-block border border-dashed"
                    >{{ selectedProcedure.objetivos || "No definido" }}</span
                  >
                </v-col>
                <v-col cols="12" class="mb-2">
                  <span
                    class="text-caption font-weight-bold text-slate-400 d-block"
                    >ALCANCE:</span
                  >
                  <span
                    class="text-body-2 text-slate-700 bg-slate-50 pa-2 rounded d-block border border-dashed"
                    >{{ selectedProcedure.alcance || "No definido" }}</span
                  >
                </v-col>
              </v-row>
            </v-card>

            <!-- Dependencias Asignadas -->
            <v-card class="rounded-xl border pa-4 mb-4" elevation="2">
              <h3
                class="text-subtitle-2 font-weight-black text-primary mb-2 uppercase"
              >
                Instalaciones y Dependencias físicas
              </h3>
              <p class="text-caption text-grey-darken-1 mb-3">
                Oficinas y dependencias donde se ejecuta o supervisa el
                procedimiento.
              </p>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="inst in selectedProcedure.instalaciones || []"
                  :key="inst.id_unidad || inst.id"
                  size="small"
                  color="teal-darken-2"
                  variant="tonal"
                  prepend-icon="mdi-office-building"
                  class="font-weight-medium"
                >
                  {{ inst.nombre }}
                </v-chip>
                <span
                  v-if="
                    !selectedProcedure.instalaciones ||
                    selectedProcedure.instalaciones.length === 0
                  "
                  class="text-caption text-grey italic"
                  >No hay dependencias físicas asociadas a este
                  procedimiento.</span
                >
              </div>
            </v-card>

            <!-- Herramientas Digitales y Materiales -->
            <v-card class="rounded-xl border pa-4" elevation="2">
              <h3
                class="text-subtitle-2 font-weight-black text-primary mb-2 uppercase"
              >
                Sistemas y Equipamiento
              </h3>
              <p class="text-caption text-grey-darken-1 mb-3">
                Recursos tecnológicos y materiales obligatorios para realizar
                las tareas.
              </p>

              <div class="text-caption font-weight-bold text-slate-500 mb-2">
                SOFTWARE / SISTEMAS:
              </div>
              <div class="d-flex flex-wrap ga-2 mb-4">
                <v-chip
                  v-for="sis in activeSistemas"
                  :key="sis.id_sistema_informacion"
                  size="small"
                  color="orange-darken-4"
                  variant="tonal"
                  prepend-icon="mdi-console"
                  class="font-weight-medium"
                >
                  {{ sis.nombre }} (v{{ sis.version || "1.0" }})
                </v-chip>
                <span
                  v-if="activeSistemas.length === 0"
                  class="text-caption text-grey italic"
                  >Ningún sistema de información asociado.</span
                >
              </div>

              <div class="text-caption font-weight-bold text-slate-500 mb-2">
                EQUIPAMIENTO / MATERIALES:
              </div>
              <div class="d-flex flex-wrap ga-2">
                <v-chip
                  v-for="eq in activeEquipos"
                  :key="eq.id_equipo"
                  size="small"
                  color="blue-darken-3"
                  variant="tonal"
                  prepend-icon="mdi-tools"
                  class="font-weight-medium"
                >
                  {{ eq.nombre }}
                </v-chip>
                <span
                  v-if="activeEquipos.length === 0"
                  class="text-caption text-grey italic"
                  >Ningún equipamiento o material físico asociado.</span
                >
              </div>
            </v-card>
          </div>

          <!-- PESTAÑA 2: CALIDAD Y NORMATIVA -->
          <div v-show="drawerTab === 'calidad'" class="px-1 pb-1 pt-0">
            <!-- Leyes y Normas -->
            <v-card class="rounded-xl border pa-4 mb-4" elevation="2">
              <h3
                class="text-subtitle-2 font-weight-black text-indigo-darken-4 mb-2 uppercase"
              >
                Leyes, Reglamentos y Normas
              </h3>
              <p class="text-caption text-grey-darken-1 mb-3">
                Marco legal e institucional que ampara y regula la ejecución del
                trámite.
              </p>

              <v-list density="compact" class="bg-transparent pa-0">
                <v-list-item
                  v-for="norma in activeNormativas"
                  :key="norma.id_normativa"
                  class="border rounded-lg bg-slate-50 pa-3 mb-2"
                >
                  <template v-slot:title>
                    <span
                      class="text-subtitle-2 font-weight-bold text-slate-800"
                      >{{ norma.nombre }}</span
                    >
                  </template>
                  <template v-slot:subtitle>
                    <div class="text-caption text-slate-500 mt-1">
                      Código:
                      <span class="font-weight-bold">{{
                        norma.codigo || "S/C"
                      }}</span>
                    </div>
                    <div
                      v-if="norma.descripcion"
                      class="text-caption text-slate-600 mt-1 italic"
                    >
                      {{ norma.descripcion }}
                    </div>
                  </template>
                  <template v-slot:append>
                    <v-btn
                      v-if="norma.url"
                      :href="norma.url"
                      target="_blank"
                      icon="mdi-open-in-new"
                      variant="tonal"
                      size="small"
                      color="primary"
                    ></v-btn>
                  </template>
                </v-list-item>
              </v-list>
              <div
                v-if="activeNormativas.length === 0"
                class="text-caption text-grey italic py-4 text-center"
              >
                No hay normas legales vinculadas a este procedimiento.
              </div>
            </v-card>

            <!-- Indicadores de Calidad -->
            <v-card class="rounded-xl border pa-4" elevation="2">
              <h3
                class="text-subtitle-2 font-weight-black text-green-darken-4 mb-2 uppercase"
              >
                Indicadores de Rendimiento (KPIs)
              </h3>
              <p class="text-caption text-grey-darken-1 mb-3">
                Métricas diseñadas para evaluar la eficiencia, tiempos de
                atención y calidad.
              </p>

              <v-row dense>
                <v-col
                  cols="12"
                  v-for="ind in activeIndicadores"
                  :key="ind.id_indicador"
                  class="mb-3"
                >
                  <v-card flat class="border rounded-lg pa-3 bg-slate-50">
                    <div class="d-flex justify-space-between align-center mb-1">
                      <span
                        class="text-subtitle-2 font-weight-black text-slate-800"
                        >{{ ind.denominacion }}</span
                      >
                      <v-chip
                        size="x-small"
                        color="green-darken-2"
                        variant="flat"
                        class="font-weight-bold"
                      >
                        Meta: {{ ind.meta || "S/M" }}
                      </v-chip>
                    </div>
                    <div class="text-caption text-slate-600 mb-2">
                      {{ ind.descripcion || "Sin descripción" }}
                    </div>
                    <v-row
                      no-gutters
                    class="text-caption bg-surface border pa-2 rounded"
                    >
                      <v-col cols="6" class="border-right">
                        <span
                          class="font-weight-bold text-slate-400 uppercase d-block text-xxs"
                          >Fórmula:</span
                        >
                        <span class="font-mono text-grey-darken-3">{{
                          ind.formula || "No definida"
                        }}</span>
                      </v-col>
                      <v-col cols="3" class="border-right pl-2">
                        <span
                          class="font-weight-bold text-slate-400 uppercase d-block text-xxs"
                          >Frecuencia:</span
                        >
                        <span>{{ ind.frecuencia || "Mensual" }}</span>
                      </v-col>
                      <v-col cols="3" class="pl-2">
                        <span
                          class="font-weight-bold text-slate-400 uppercase d-block text-xxs"
                          >Unidad:</span
                        >
                        <span>{{ ind.unidad_medida || "Trámite" }}</span>
                      </v-col>
                    </v-row>
                  </v-card>
                </v-col>
              </v-row>
              <div
                v-if="activeIndicadores.length === 0"
                class="text-caption text-grey italic py-4 text-center"
              >
                No hay indicadores de rendimiento asociados.
              </div>
            </v-card>
          </div>

          <!-- PESTAÑA 3: MATRIZ DE FLUJO -->
          <div v-show="drawerTab === 'flujo'" class="px-1 pb-1 pt-0">
            <v-card
              class="rounded-xl border overflow-hidden mb-4"
              elevation="2"
            >
              <div
                class="pa-4 border-bottom d-flex align-center justify-space-between flex-wrap ga-2"
              >
                <div>
                  <h3
                    class="text-subtitle-2 font-weight-black text-slate-800 uppercase mb-1"
                  >
                    Pasos y Diagrama de Flujo
                  </h3>
                  <p class="text-caption text-grey-darken-1">
                    Revise la secuencia de operaciones en formato tabla o
                    diagrama de carriles (swimlanes).
                  </p>
                </div>
                <!-- Conmutador de vista -->
                <v-btn-toggle
                  v-model="flowViewMode"
                  mandatory
                  color="primary"
                  density="compact"
                  class="rounded-lg"
                >
                  <v-btn
                    value="table"
                    prepend-icon="mdi-table-large"
                    class="text-caption font-weight-bold"
                    >Tabla</v-btn
                  >
                  <v-btn
                    value="diagram"
                    prepend-icon="mdi-sitemap"
                    class="text-caption font-weight-bold"
                    >Diagrama</v-btn
                  >
                </v-btn-toggle>
              </div>

              <div class="overflow-x-auto bg-slate-50 position-relative w-100">
                <v-progress-linear
                  v-if="drawerFlowLoading"
                  indeterminate
                  color="primary"
                ></v-progress-linear>

                <div
                  v-else-if="activeFlow.length === 0"
                  class="pa-8 text-center text-caption text-grey"
                >
                  No se encontraron operaciones registradas para este flujo en
                  el backend.
                </div>

                <!-- MODO TABLA -->
                <v-table
                  v-else-if="flowViewMode === 'table'"
                  class="flow-matrix-table drawer-table"
                >
                  <thead>
                    <tr
                      class="bg-surface border-bottom text-uppercase text-caption font-weight-bold"
                    >
                      <th width="50" class="text-center font-weight-bold">
                        Paso
                      </th>
                      <th width="150" class="font-weight-bold">
                        Entradas / Requisitos
                      </th>
                      <th width="170" class="font-weight-bold">
                        Actividad (Verbo)
                      </th>
                      <th width="200" class="font-weight-bold">
                        Tarea / Descripción
                      </th>
                      <th width="140" class="font-weight-bold">Responsable</th>
                      <th width="140" class="font-weight-bold">Riesgo</th>
                      <th width="140" class="font-weight-bold">Control</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="row in activeFlow" :key="row.nro">
                      <td
                        class="text-center text-caption font-weight-black text-primary"
                      >
                        {{ row.nro }}
                      </td>
                      <td class="text-caption text-slate-600">
                        {{ row.requisitos }}
                      </td>
                      <td class="text-caption font-weight-bold text-slate-800">
                        {{ row.actividad }}
                      </td>
                      <td class="text-caption text-slate-700">
                        {{ row.tarea }}
                      </td>
                      <td class="text-caption text-slate-700">
                        <v-chip
                          size="x-small"
                          color="primary"
                          variant="tonal"
                          class="font-weight-bold"
                        >
                          {{ row.responsableCargo }}
                        </v-chip>
                      </td>
                      <td class="text-caption text-red-darken-3">
                        {{ row.riesgo }}
                      </td>
                      <td class="text-caption text-green-darken-3">
                        {{ row.control }}
                      </td>
                    </tr>
                  </tbody>
                </v-table>

                <!-- MODO DIAGRAMA (SWIMLANES) -->
                <div
                  v-else-if="flowViewMode === 'diagram'"
                  ref="diagramContainer"
                  class="pa-6 bg-surface rounded-lg overflow-x-auto w-100"
                  style="min-height: 400px"
                >
                  <!-- ADVERTENCIA DE CARRIL VACÍO -->
                  <div
                    v-if="allDisplayCargos.length === 0"
                    class="text-center pa-10 text-grey-darken-1"
                  >
                    <v-icon size="48" color="warning" class="mb-2"
                      >mdi-alert-circle-outline</v-icon
                    >
                    <p class="font-weight-bold">
                      No hay cargos de responsabilidad asignados en este
                      procedimiento.
                    </p>
                    <p class="text-caption">
                      El diagrama requiere al menos una operación con un
                      responsable para poder estructurar los carriles.
                    </p>
                  </div>

                  <!-- Contenedor alineable para SVG y Tabla -->
                  <div
                    v-else
                    ref="scrollWrapper"
                    class="diagram-scroll-wrapper"
                    style="
                      position: relative;
                      display: inline-block;
                      min-width: 100%;
                    "
                  >
                    <!-- TABLA DE SWIMLANES -->
                    <table
                      class="preview-swimlane-table"
                      style="position: relative; z-index: 2"
                    >
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
                        <tr v-for="row in activeFlow" :key="row.nro">
                          <!-- Número de Paso -->
                          <td
                            class="text-center font-weight-bold preview-step-cell"
                          >
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
                              v-if="
                                Number(row.responsableCargoId) ===
                                Number(cargo.id_cargo)
                              "
                              class="preview-node d-flex align-center justify-center text-center pa-3 mx-auto"
                              :data-row-nro="row.nro"
                              :class="
                                getActionVisuals(row.accionId).codigoFigura
                              "
                              :style="{
                                backgroundColor: getActionVisuals(row.accionId)
                                  .colorHex,
                              }"
                            >
                              <span class="preview-text font-weight-bold">
                                {{
                                  row.texto_figura || row.tarea || "Sin texto"
                                }}
                              </span>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- SVG para conectar nodos (Sólido y Elegante) -->
                    <svg
                      style="
                        position: absolute;
                        top: 0;
                        left: 0;
                        width: 100%;
                        height: 100%;
                        pointer-events: none;
                        z-index: 3;
                      "
                    >
                      <defs>
                        <marker
                          id="arrow-hist"
                          viewBox="0 0 10 10"
                          refX="7"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#4f46e5" />
                        </marker>
                        <marker
                          id="arrow-hist-return"
                          viewBox="0 0 10 10"
                          refX="7"
                          refY="5"
                          markerWidth="6"
                          markerHeight="6"
                          orient="auto-start-reverse"
                        >
                          <path d="M 0 2 L 8 5 L 0 8 L 2 5 z" fill="#ef4444" />
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
                          path.isReturn
                            ? 'url(#arrow-hist-return)'
                            : 'url(#arrow-hist)'
                        "
                      />
                    </svg>
                  </div>
                </div>
              </div>
            </v-card>
          </div>
        </div>
      </div>
    </v-navigation-drawer>
  </v-container>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { useDisplay } from "vuetify";
import { useRouter } from "vue-router";
import { useMppCoreStore } from "@/stores/mpp_core";
import axios from "axios";

const router = useRouter();
const mppStore = useMppCoreStore();
const { smAndDown } = useDisplay();

// --- ESTADOS DE UI ---
const searchQuery = ref("");
const statusFilter = ref("Todos");
const expandedProcessPanel = ref([]);
const loadingGlobal = ref(true);
const selectedVersionsMap = ref({});

// --- DATOS GLOBALES ---
const allProcedimientos = ref([]);
const allCargoProcesos = ref([]);

// --- ESTADOS DEL DRAWER ---
const drawerOpen = ref(false);
const drawerTab = ref("general");
const flowViewMode = ref("table");
const selectedProcedureId = ref(null);
const drawerFlowLoading = ref(false);

const procedureFlows = ref({});
const connectionPaths = ref([]);
const diagramContainer = ref(null);
const scrollWrapper = ref(null);

// --- CARGA DE DATOS ---
const fetchAllProcedimientos = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/procesos/procedimientos",
    );
    allProcedimientos.value = response.data.data || response.data || [];
  } catch (err) {
    console.error("Error al cargar todos los procedimientos:", err);
  }
};

const fetchAllCargoProcesos = async () => {
  try {
    const response = await axios.get(
      "http://localhost:3000/procesos/cargo-procesos",
    );
    allCargoProcesos.value = response.data.data || response.data || [];
  } catch (err) {
    console.error("Error al cargar cargo-procesos:", err);
  }
};

const loadProcedureFlow = async (procId) => {
  if (procedureFlows.value[procId]) return;
  drawerFlowLoading.value = true;
  try {
    const [opRes, actRes, tarRes, cargoRes, riesgosRes, controlesRes, reqRes] =
      await Promise.all([
        axios
          .get("http://localhost:3000/flujo/operaciones")
          .catch(() => ({ data: [] })),
        axios
          .get("http://localhost:3000/flujo/actividades")
          .catch(() => ({ data: [] })),
        axios
          .get("http://localhost:3000/flujo/tareas")
          .catch(() => ({ data: [] })),
        axios
          .get("http://localhost:3000/flujo/operacion-cargos")
          .catch(() => ({ data: [] })),
        axios
          .get("http://localhost:3000/recursos/riesgos")
          .catch(() => ({ data: [] })),
        axios
          .get("http://localhost:3000/recursos/controles")
          .catch(() => ({ data: [] })),
        axios
          .get("http://localhost:3000/recursos/requisitos")
          .catch(() => ({ data: [] })),
      ]);

    const getData = (res) => {
      const raw = res.data?.data || res.data || [];
      return Array.isArray(raw) ? raw : [];
    };

    const allActs = getData(actRes);
    const allTasks = getData(tarRes);
    const allOpCargos = getData(cargoRes);
    const allRiesgos = getData(riesgosRes);
    const allControles = getData(controlesRes);
    const allReqs = getData(reqRes);

    const matrixOps = getData(opRes).filter((op) => {
      const opProcId =
        op.id_procedimiento ||
        (op.procedimiento &&
          (op.procedimiento.id_procedimiento || op.procedimiento.id));
      return Number(opProcId) === Number(procId);
    });

    const mappedRows = matrixOps.map((op) => {
      const idOp = Number(op.id_operaciones || op.id);
      const getOpId = (item) =>
        Number(
          item?.id_operacion ||
            item?.operacion?.id_operaciones ||
            item?.operacion?.id,
        );
      const getActId = (item) =>
        Number(
          item?.id_actividad ||
            item?.actividad?.id_actividad ||
            item?.actividad?.id,
        );

      const actividad =
        allActs.find(
          (a) =>
            Number(a.id_operaciones || a.operacion?.id_operaciones) === idOp,
        ) || {};
      const idAct = Number(actividad.id_actividad || actividad.id);

      const tarea = idAct
        ? allTasks.find((t) => getActId(t) === idAct) || {}
        : {};
      const responsable =
        allOpCargos.find(
          (oc) =>
            getOpId(oc) === idOp && oc.tipo_participacion === "Responsable",
        ) || {};
      const riesgo = allRiesgos.find((r) => getOpId(r) === idOp) || {};
      const control = allControles.find((c) => getOpId(c) === idOp) || {};
      const todosReqs = allReqs.filter((req) => getOpId(req) === idOp);
      const reqEntrada =
        todosReqs.find(
          (req) => !req.tipo_entrada || req.tipo_entrada === "entrada",
        ) || {};

      let respCargoName = "-";
      let respCargoId = null;
      if (responsable.cargo) {
        respCargoName =
          responsable.cargo.denominacion || responsable.cargo.nombre;
        respCargoId = responsable.cargo.id_cargo;
      } else if (responsable.id_cargo) {
        respCargoId = responsable.id_cargo;
        const matchingCargo = mppStore.cargos.find(
          (c) => Number(c.id_cargo) === Number(responsable.id_cargo),
        );
        respCargoName = matchingCargo
          ? matchingCargo.denominacion || matchingCargo.nombre
          : `Cargo #${responsable.id_cargo}`;
      }

      return {
        nro: op.orden || 1,
        requisitos: reqEntrada.descripcion || "-",
        actividad: actividad.descripcion || "-",
        tarea: tarea.descripcion || "-",
        responsableCargo: respCargoName,
        responsableCargoId: respCargoId,
        accionId:
          actividad.id_accion || actividad.accion?.id_accion || op.id_accion,
        texto_figura: tarea.texto_figura || tarea.descripcion || "",
        riesgo: riesgo.descripcion || "-",
        control: control.descripcion || "-",
      };
    });

    mappedRows.sort((a, b) => a.nro - b.nro);
    procedureFlows.value[procId] = mappedRows;
  } catch (err) {
    console.error("Error al cargar operaciones del flujo:", procId, err);
  } finally {
    drawerFlowLoading.value = false;
  }
};

// --- CÁLCULO DE CONEXIONES EN DIAGRAMA ---
const calculateConnections = () => {
  if (!diagramContainer.value) return;
  nextTick(() => {
    setTimeout(() => {
      const container = diagramContainer.value;
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
        const row =
          activeFlow.value.find((r) => Number(r.nro) === rowNro) ||
          activeFlow.value[index];
        pts.push({
          cx,
          cy,
          w: rect.width,
          h: rect.height,
          nro: row ? row.nro : rowNro || index + 1,
          rowText: row ? row.texto_figura || row.tarea || "" : "",
        });
      });

      const newPaths = [];

      // Conexiones lineales ortogonales (Paso a Paso con ángulos rectos)
      for (let i = 0; i < pts.length - 1; i++) {
        const start = pts[i];
        const end = pts[i + 1];

        const x1 = start.cx;
        const y1 = start.cy + start.h / 2;

        const x2 = end.cx;
        const y2 = end.cy - end.h / 2;

        let path = "";
        if (Math.abs(x1 - x2) < 8) {
          // Si están en la misma columna, ir recto hacia abajo
          path = `M ${x1} ${y1} L ${x2} ${y2}`;
        } else {
          // Si cambian de columna, bajar a la mitad, cruzar en horizontal, y bajar hasta el destino
          const yMid = y1 + (y2 - y1) / 2;
          path = `M ${x1} ${y1} L ${x1} ${yMid} L ${x2} ${yMid} L ${x2} ${y2}`;
        }
        newPaths.push({ path, color: "#4f46e5", isReturn: false });
      }

      // Conexiones de retorno / bucle ortogonales (Por el lateral derecho)
      const getReturnTarget = (text) => {
        if (!text) return null;
        const match = text.match(
          /(?:vuelve\s+a|vuelve\s+al|retorna\s+a|retorna\s+al|regresa\s+a|regresa\s+al|no\s*->|->|ir\s+a|paso)\s*(?:paso\s+)?(\d+)/i,
        );
        return match ? parseInt(match[1], 10) : null;
      };

      pts.forEach((start) => {
        const targetNro = getReturnTarget(start.rowText);
        if (targetNro && targetNro !== start.nro) {
          const dest = pts.find((p) => p.nro === targetNro);
          if (dest) {
            const xStart = start.cx + start.w / 2;
            const yStart = start.cy;
            const xEnd = dest.cx + dest.w / 2;
            const yEnd = dest.cy;

            // Margen compartido a la derecha para subir
            const xRight = Math.max(xStart, xEnd) + 40;
            const path = `M ${xStart} ${yStart} L ${xRight} ${yStart} L ${xRight} ${yEnd} L ${xEnd} ${yEnd}`;
            newPaths.push({ path, color: "#ef4444", isReturn: true });
          }
        }
      });

      connectionPaths.value = newPaths;
    }, 350);
  });
};

const getActionVisuals = (accionId) => {
  const id = Number(accionId);
  const accion = mppStore.acciones.find((a) => Number(a.id_accion) === id);
  if (!accion || !accion.figura)
    return {
      icon: "mdi-circle",
      color: "primary",
      colorHex: "#6366f1",
      codigoFigura: "rectangulo",
    };

  const codigoFigura = accion.figura.codigo;
  const nombreAccion = (accion.nombre_accion || "").toLowerCase();

  let color = "primary";
  let colorHex = "#6366f1";
  if (
    nombreAccion.includes("inicio") ||
    nombreAccion.includes("empezar") ||
    nombreAccion.includes("comenzar") ||
    nombreAccion.includes("start")
  ) {
    color = "success";
    colorHex = "#10b981";
  } else if (
    nombreAccion.includes("fin") ||
    textMatchAny(nombreAccion, ["terminar", "concluir", "archivar", "end"])
  ) {
    color = "error";
    colorHex = "#ef4444";
  } else if (
    textMatchAny(nombreAccion, [
      "decisión",
      "validar",
      "aprob",
      "revisar",
      "control",
      "analiz",
      "decid",
    ])
  ) {
    color = "orange-darken-2";
    colorHex = "#f59e0b";
  }

  return { icon: "mdi-circle", color, colorHex, codigoFigura };
};

const textMatchAny = (text, list) => {
  return list.some((item) => text.includes(item));
};

// --- GESTIÓN DE ABRIR Y SELECCIÓN EN EL DRAWER ---
const openDetailsDrawer = (procId) => {
  selectedProcedureId.value = procId;
  drawerTab.value = "general";
  flowViewMode.value = "table";
  drawerOpen.value = true;
};

// --- PROPIEDADES COMPUTADAS DERECHAS A DETALLE SELECCIONADO ---
const selectedProcedure = computed(() => {
  if (!selectedProcedureId.value) return null;
  return allProcedimientos.value.find(
    (p) => p.id_procedimiento === selectedProcedureId.value,
  );
});

const activeNormativas = computed(() => {
  if (!selectedProcedureId.value) return [];
  const id = Number(selectedProcedureId.value);
  return (mppStore.normativas || []).filter((n) => {
    if (!n) return false;
    const hasInArray =
      Array.isArray(n.id_procedimientos) && n.id_procedimientos.includes(id);
    const hasInRelations =
      Array.isArray(n.procedimientos) &&
      n.procedimientos.some((p) => p && Number(p.id_procedimiento) === id);
    return hasInArray || hasInRelations;
  });
});

const activeIndicadores = computed(() => {
  if (!selectedProcedureId.value) return [];
  const id = Number(selectedProcedureId.value);
  const list = mppStore.indicadores || [];
  return list.filter((k) => {
    if (!k) return false;
    const hasInArray =
      Array.isArray(k.id_procedimientos) && k.id_procedimientos.includes(id);
    const hasInRelations =
      Array.isArray(k.procedimientos) &&
      k.procedimientos.some((p) => p && Number(p.id_procedimiento) === id);
    return hasInArray || hasInRelations;
  });
});

const activeSistemas = computed(() => {
  if (!selectedProcedureId.value) return [];
  const id = Number(selectedProcedureId.value);
  return (mppStore.sistemasInformacion || []).filter((s) => {
    if (!s) return false;
    const hasInArray =
      Array.isArray(s.id_procedimientos) && s.id_procedimientos.includes(id);
    const hasInRelations =
      Array.isArray(s.procedimientos) &&
      s.procedimientos.some((p) => p && Number(p.id_procedimiento) === id);
    return hasInArray || hasInRelations;
  });
});

const activeEquipos = computed(() => {
  if (!selectedProcedureId.value) return [];
  const id = Number(selectedProcedureId.value);
  return (mppStore.equipos || []).filter((e) => {
    if (!e) return false;
    const hasInArray =
      Array.isArray(e.id_procedimientos) && e.id_procedimientos.includes(id);
    const hasInRelations =
      Array.isArray(e.procedimientos) &&
      e.procedimientos.some((p) => p && Number(p.id_procedimiento) === id);
    return hasInArray || hasInRelations;
  });
});

const activeFlow = computed(() => {
  if (!selectedProcedureId.value) return [];
  return procedureFlows.value[selectedProcedureId.value] || [];
});

// Swimlanes computados dinámicamente para la vista diagrama
const allDisplayCargos = computed(() => {
  const rows = activeFlow.value || [];
  const cargoIds = Array.from(
    new Set(
      rows
        .map((r) => Number(r.responsableCargoId))
        .filter((id) => !isNaN(id) && id > 0),
    ),
  );

  const list = [];
  cargoIds.forEach((id) => {
    const cargo = (mppStore.cargos || []).find(
      (c) => Number(c.id_cargo) === id,
    );
    if (cargo) {
      let unitId = null;
      let unitName = "Unidad Externa";

      const parentUnit = (mppStore.unidades || []).find((u) =>
        (u.cargos || []).some((c) => Number(c.id_cargo) === id),
      );
      if (parentUnit) {
        unitId = parentUnit.id_unidad || parentUnit.id;
        unitName = parentUnit.nombre || parentUnit.nombre_unidad;
      }

      list.push({
        id_cargo: id,
        nombre: cargo.denominacion || cargo.nombre,
        unitId,
        unitName,
      });
    }
  });
  return list;
});

const swimlaneGroups = computed(() => {
  const list = allDisplayCargos.value || [];
  const map = new Map();
  list.forEach((c) => {
    const key = c.unitId || 0;
    if (!map.has(key)) {
      map.set(key, {
        id: key,
        name: c.unitName || "Unidad Externa",
        cargos: [],
      });
    }
    map.get(key).cargos.push(c);
  });
  return Array.from(map.values());
});

// --- LÓGICA DE AGRUPACIÓN POR PROCEDIMIENTO Y COMPOSICIÓN DE VERSIONES ---
const getProcedimientosGrouped = (procesoId) => {
  const pId = Number(procesoId);

  let filtered = allProcedimientos.value.filter((p) => {
    const parentId = p.proceso?.id_proceso || p.id_proceso || p.proceso;
    return Number(parentId) === pId;
  });

  if (statusFilter.value !== "Todos") {
    filtered = filtered.filter(
      (p) => (p.estado_version || p.estado || "Borrador") === statusFilter.value,
    );
  }

  const query = searchQuery.value?.toLowerCase() || "";
  if (query) {
    filtered = filtered.filter(
      (p) =>
        p.nombre?.toLowerCase().includes(query) ||
        p.codigo?.toLowerCase().includes(query),
    );
  }

  const groupsMap = {};

  filtered.forEach((p) => {
    let nombreBase = (p.nombre || "").trim();
    nombreBase = nombreBase
      .replace(/[\s\-_(]*v(er)?(sión)?\.?\s*\d+(\.\d+)*\)?$/gi, "")
      .trim();

    let codigoBase = (p.codigo || "").trim();
    codigoBase = codigoBase.replace(/[\s\-_]*v\d+(\.\d+)*$/gi, "").trim();

    if (!groupsMap[nombreBase]) {
      groupsMap[nombreBase] = {
        nombreBase,
        codigoBase: codigoBase || p.codigo,
        selectedVersionId: null,
        versiones: [],
      };
    }

    const st = p.estado_version || p.estado || "Borrador";

    groupsMap[nombreBase].versiones.push({
      id_procedimiento: p.id_procedimiento,
      version: p.version || "1.0",
      estado: st,
      estado_version: st,
      versionLabel: `v${p.version || "1.0"} (${st})`,
    });
  });

  const result = Object.values(groupsMap).map((grupo) => {
    grupo.versiones.sort((a, b) => {
      return String(b.version).localeCompare(String(a.version), undefined, {
        numeric: true,
        sensitivity: "base",
      });
    });

    const key = `${procesoId}_${grupo.nombreBase}`;
    if (!selectedVersionsMap.value[key] || !grupo.versiones.some((v) => v.id_procedimiento === selectedVersionsMap.value[key])) {
      selectedVersionsMap.value[key] = grupo.versiones[0]?.id_procedimiento || null;
    }

    Object.defineProperty(grupo, "selectedVersionId", {
      get: () => selectedVersionsMap.value[key] || grupo.versiones[0]?.id_procedimiento || null,
      set: (val) => {
        selectedVersionsMap.value[key] = val;
      },
      configurable: true,
      enumerable: true
    });

    return grupo;
  });

  return result;
};

const getProcedimientosCount = (procesoId) => {
  const pId = Number(procesoId);
  return allProcedimientos.value.filter((p) => {
    const parentId = p.proceso?.id_proceso || p.id_proceso || p.proceso;
    return Number(parentId) === pId;
  }).length;
};

const getProcedureVersionString = (selectedId, versiones) => {
  const vObj = versiones.find((v) => v.id_procedimiento === selectedId);
  return vObj ? vObj.version : "1.0";
};

const getProcedureStatus = (selectedId, versiones) => {
  const vObj = versiones.find((v) => v.id_procedimiento === selectedId);
  return vObj ? (vObj.estado_version || vObj.estado || "Borrador") : "Borrador";
};

const getProcedureStatusColor = (selectedId, versiones) => {
  const status = getProcedureStatus(selectedId, versiones);
  if (status === "Aprobado" || status === "Activo") return "success";
  if (status === "En Revisión") return "info";
  if (status === "Borrador") return "warning";
  return "grey";
};

const handleProcedureEditOrCreateNewVersion = async (selectedId, procesoId) => {
  const proc = allProcedimientos.value.find((p) => p.id_procedimiento === selectedId);
  if (!proc) return;

  const currentStatus = proc.estado_version || proc.estado || "Borrador";
  let targetId = selectedId;

  if (currentStatus === "Aprobado" || currentStatus === "Activo") {
    const currentVer = proc.version || "1.0";
    const parts = currentVer.split(".");
    const nextVer = `${(parseInt(parts[0], 10) || 1) + 1}.0`;

    const confirmNewVersion = confirm(
      `El procedimiento '${proc.nombre}' (v${currentVer}) está APROBADO.\n\n¿Desea crear la versión v${nextVer} (en estado Borrador) como un nuevo registro para aplicar cambios?`
    );
    if (!confirmNewVersion) return;

    try {
      const pProcId = proc.proceso?.id_proceso || proc.id_proceso || procesoId;
      const baseCode = (proc.codigo || "PROC").replace(/[\s\-_]*v\d+(\.\d+)*$/gi, "").trim();
      const newProcData = {
        codigo: `${baseCode}-v${nextVer}`,
        nombre: proc.nombre,
        objetivos: proc.objetivos || "",
        alcance: proc.alcance || "",
        periodicidad: proc.periodicidad || "",
        version: nextVer,
        estado: "Borrador",
        estado_version: "Borrador",
        id_proceso: Number(pProcId)
      };

      const created = await mppStore.saveProcedimiento(newProcData);
      const newId = created?.id_procedimiento || created?.id;
      if (newId) {
        targetId = newId;
      }
      await fetchAllProcedimientos();
    } catch (e) {
      console.error("Error creando nueva versión de procedimiento:", e);
    }
  }

  router.push({
    name: "cabecera_mpp",
    query: { procesoId, procedimientoId: targetId },
  });
};

const getProcessResponsible = (procesoId) => {
  const relations = allCargoProcesos.value.filter((cp) => {
    const pId = cp.proceso?.id_proceso || cp.id_proceso || cp.proceso;
    return Number(pId) === Number(procesoId);
  });
  const responsible = relations.find((r) => r.es_responsable_principal);
  if (!responsible) return "No asignado";

  if (responsible.cargo)
    return responsible.cargo.denominacion || responsible.cargo.nombre;
  const cargoObj = (mppStore.cargos || []).find(
    (c) => Number(c.id_cargo) === Number(responsible.id_cargo),
  );
  return cargoObj
    ? cargoObj.denominacion || cargoObj.nombre
    : `Cargo #${responsible.id_cargo}`;
};

// --- FILTRADO DE PROCESOS POR CONSULTA ---
const filteredProcesos = computed(() => {
  const query = searchQuery.value?.toLowerCase() || "";
  const filter = statusFilter.value;

  return mppStore.procesos.filter((proceso) => {
    const matchProcessName = proceso.nombre?.toLowerCase().includes(query);
    const matchProcessCode = proceso.codigo?.toLowerCase().includes(query);

    let procs = allProcedimientos.value.filter((p) => {
      const parentId = p.proceso?.id_proceso || p.id_proceso || p.proceso;
      return Number(parentId) === proceso.id_proceso;
    });

    if (filter !== "Todos") {
      procs = procs.filter((p) => (p.estado || "Activo") === filter);
    }

    if (query) {
      procs = procs.filter(
        (p) =>
          p.nombre?.toLowerCase().includes(query) ||
          p.codigo?.toLowerCase().includes(query),
      );
    }

    const hasValidProcs = procs.length > 0;

    if (!query && filter === "Todos") return true;

    return matchProcessName || matchProcessCode || hasValidProcs;
  });
});

// Cargar flujo si se entra a la pestaña de flujo en el drawer (independiente del modo de vista)
watch([drawerOpen, drawerTab, selectedProcedureId], () => {
  if (
    drawerOpen.value &&
    drawerTab.value === "flujo" &&
    selectedProcedureId.value
  ) {
    loadProcedureFlow(selectedProcedureId.value);
  }
});

// Calcular conexiones del diagrama cuando cambia al modo diagrama o cuando el flujo se carga
watch(
  [drawerOpen, drawerTab, flowViewMode, () => activeFlow.value, scrollWrapper],
  () => {
    if (
      drawerOpen.value &&
      drawerTab.value === "flujo" &&
      flowViewMode.value === "diagram" &&
      activeFlow.value.length > 0 &&
      scrollWrapper.value
    ) {
      calculateConnections();
    }
  },
  { deep: true, immediate: true },
);

// Recalcular conexiones al cambiar el tamaño de la ventana
const handleResize = () => {
  if (
    drawerOpen.value &&
    drawerTab.value === "flujo" &&
    flowViewMode.value === "diagram"
  ) {
    calculateConnections();
  }
};

// --- INICIALIZACIÓN ---
onMounted(async () => {
  window.addEventListener("resize", handleResize);
  loadingGlobal.value = true;
  try {
    await Promise.all([
      mppStore.fetchProcesos(),
      mppStore.fetchUnidades(),
      mppStore.fetchCargos(),
      mppStore.fetchNormativas(),
      mppStore.fetchIndicadores(),
      mppStore.fetchSistemasInformacion(),
      mppStore.fetchEquipos(),
      fetchAllProcedimientos(),
      fetchAllCargoProcesos(),
    ]);

    if (filteredProcesos.value.length > 0) {
      expandedProcessPanel.value = [0];
    }
  } catch (err) {
    console.error("Error al montar la vista de historial:", err);
  } finally {
    loadingGlobal.value = false;
  }
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
.fill-height {
  min-height: 100vh;
}
.border-top-primary {
  border-top: 8px solid #6366f1 !important;
}
.border-left-primary {
  border-left: 8px solid #6366f1 !important;
}
.border-right {
  border-right: 1px solid #e0e0e0;
}
.pl-2 {
  padding-left: 8px !important;
}
.version-select {
  max-width: 170px;
  margin: 0 auto;
  font-size: 0.8rem;
}
.hover-row:hover {
  background-color: #f8fafc;
}
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.text-xxs {
  font-size: 0.65rem;
}
.flow-matrix-table th {
  background-color: #f8fafc !important;
  color: #475569 !important;
  font-size: 0.75rem !important;
}
.flow-matrix-table td {
  font-size: 0.8rem !important;
  vertical-align: middle !important;
  border-bottom: 1px solid #f1f5f9 !important;
}
.drawer-table th {
  font-size: 0.75rem !important;
  padding: 8px 12px !important;
}
.drawer-table td {
  font-size: 0.75rem !important;
  padding: 8px 12px !important;
}

/* DIAGRAMA SWIMLANES SCOPED CSS */
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

.preview-node {
  min-width: 130px;
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
  max-width: 85%;
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
  width: 75px !important;
  height: 75px !important;
  min-width: 75px !important;
  min-height: 75px !important;
  border-radius: 0 !important;
  border: 2px solid rgba(255, 255, 255, 0.2);
}
.rombo .preview-text {
  transform: rotate(-45deg);
}

.elipse {
  border-radius: 9999px !important;
  min-width: 130px;
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
  padding-top: 25px !important;
}

.hexagono {
  clip-path: polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%);
  width: 110px !important;
  height: 70px !important;
  min-width: 110px !important;
  min-height: 70px !important;
  border-radius: 0 !important;
}
</style>

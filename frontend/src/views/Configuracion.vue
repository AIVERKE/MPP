<script setup>
import { ref, onMounted } from "vue";
import { useMppCoreStore } from "@/stores/mpp_core";
import { FORMAS_SOPORTADAS, getFiguraVisuals } from "@/utils/figuras";
import FiguraSelect from "@/components/mpp/FiguraSelect.vue";

const mppStore = useMppCoreStore();
const activeTab = ref("acciones");

const showDialog = ref(false);
const isSaving = ref(false);
const mode = ref("create");

const formData = ref({
  id: null,
  nombre_accion: "",
  id_figura: null,
});

const showFiguraDialog = ref(false);
const isSavingFigura = ref(false);
const figuraMode = ref("create");
const figuraForm = ref({
  id: null,
  nombre: "",
  codigo: null,
});

const openDialog = (item = null) => {
  if (item) {
    mode.value = "edit";
    formData.value = {
      id: item.id_accion,
      nombre_accion: item.nombre_accion,
      id_figura: item.figura?.id_figura || item.id_figura,
    };
  } else {
    mode.value = "create";
    formData.value = { id: null, nombre_accion: "", id_figura: null };
  }
  showDialog.value = true;
};

const handleSave = async () => {
  try {
    isSaving.value = true;
    if (mode.value === "create") {
      await mppStore.saveAccion(formData.value);
    } else {
      await mppStore.updateAccion(formData.value.id, formData.value);
    }
    await mppStore.fetchAcciones();
    showDialog.value = false;
  } catch (e) {
    console.error(e);
  } finally {
    isSaving.value = false;
  }
};

const deleteAccion = async (id) => {
  if (!confirm("¿Eliminar esta acción?")) return;
  try {
    await mppStore.deleteAccion(id);
    await mppStore.fetchAcciones();
  } catch (e) {
    console.error(e);
  }
};

const openFiguraDialog = (item = null) => {
  if (item) {
    figuraMode.value = "edit";
    figuraForm.value = {
      id: item.id_figura,
      nombre: item.nombre,
      codigo: item.codigo,
    };
  } else {
    figuraMode.value = "create";
    figuraForm.value = { id: null, nombre: "", codigo: null };
  }
  showFiguraDialog.value = true;
};

const handleSaveFigura = async () => {
  try {
    isSavingFigura.value = true;
    const payload = {
      nombre: figuraForm.value.nombre,
      codigo: figuraForm.value.codigo,
    };
    if (figuraMode.value === "create") {
      await mppStore.saveFigura(payload);
    } else {
      await mppStore.updateFigura(figuraForm.value.id, payload);
    }
    await mppStore.fetchFiguras();
    showFiguraDialog.value = false;
  } catch (e) {
    console.error(e);
    alert(e?.response?.data?.message || "No se pudo guardar la figura");
  } finally {
    isSavingFigura.value = false;
  }
};

const deleteFigura = async (figura) => {
  if (figura.es_oficial) {
    alert("Las figuras oficiales del catálogo base no se pueden eliminar");
    return;
  }
  if (!confirm(`¿Eliminar la figura "${figura.nombre}"?`)) return;
  try {
    await mppStore.deleteFigura(figura.id_figura);
    await mppStore.fetchFiguras();
  } catch (e) {
    console.error(e);
    alert(e?.response?.data?.message || "No se pudo eliminar la figura");
  }
};

const iconForCodigo = (codigo) => getFiguraVisuals(codigo).icon;
const formaNombre = (codigo) =>
  FORMAS_SOPORTADAS.find((f) => f.codigo === codigo)?.nombre || codigo;

onMounted(async () => {
  await Promise.all([mppStore.fetchAcciones(), mppStore.fetchFiguras()]);
});
</script>

<template>
  <v-container fluid class="pa-0">
    <div class="mb-6 d-flex align-center justify-space-between">
      <div>
        <h1 class="text-h4 font-weight-black mb-1 text-slate-800">
          Configuración de Flujo
        </h1>
        <div class="text-body-2 d-flex align-center text-slate-500">
          <v-icon size="18" class="mr-2">mdi-cog</v-icon>
          <span>Menú</span>
          <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
          <span class="font-weight-bold text-primary">Configuración</span>
        </div>
      </div>
      <v-spacer></v-spacer>
      <v-btn
        v-if="activeTab === 'acciones'"
        color="primary"
        prepend-icon="mdi-plus"
        class="rounded-lg font-weight-bold"
        @click="openDialog()"
      >
        Nueva Acción
      </v-btn>
      <v-btn
        v-else
        color="primary"
        prepend-icon="mdi-plus"
        class="rounded-lg font-weight-bold"
        @click="openFiguraDialog()"
      >
        Nueva Figura
      </v-btn>
    </div>

    <v-tabs v-model="activeTab" color="primary" class="mb-4">
      <v-tab value="acciones">Acciones</v-tab>
      <v-tab value="figuras">Figuras</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="acciones">
        <v-card class="rounded-xl border">
          <v-card-title class="pa-4 font-weight-bold">
            Catálogo de Acciones (Verbos)
          </v-card-title>
          <v-table>
            <thead>
              <tr>
                <th>Nombre de la Acción</th>
                <th>Figura Asociada</th>
                <th class="text-center">Vista Previa</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="accion in mppStore.acciones" :key="accion.id_accion">
                <td class="font-weight-bold">{{ accion.nombre_accion }}</td>
                <td>{{ accion.figura?.nombre || "Sin figura" }}</td>
                <td class="text-center">
                  <v-icon
                    :color="
                      accion.nombre_accion.toLowerCase().includes('inicio')
                        ? 'success'
                        : 'primary'
                    "
                  >
                    {{ iconForCodigo(accion.figura?.codigo) }}
                  </v-icon>
                </td>
                <td class="text-right">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    color="info"
                    @click="openDialog(accion)"
                  ></v-btn>
                  <v-btn
                    icon="mdi-delete"
                    variant="text"
                    size="small"
                    color="error"
                    @click="deleteAccion(accion.id_accion)"
                  ></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-window-item>

      <v-window-item value="figuras">
        <v-card class="rounded-xl border">
          <v-card-title class="pa-4 font-weight-bold">
            Catálogo de Figuras
          </v-card-title>
          <v-card-subtitle class="px-4 pb-2">
            Las figuras oficiales no se pueden eliminar. Puede agregar figuras
            adicionales eligiendo un tipo de forma ya soportado.
          </v-card-subtitle>
          <v-table>
            <thead>
              <tr>
                <th class="text-center">Vista Previa</th>
                <th>Nombre</th>
                <th>Tipo de forma</th>
                <th>Origen</th>
                <th class="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="figura in mppStore.figuras" :key="figura.id_figura">
                <td class="text-center">
                  <v-icon color="primary">{{ iconForCodigo(figura.codigo) }}</v-icon>
                </td>
                <td class="font-weight-bold">{{ figura.nombre }}</td>
                <td>{{ formaNombre(figura.codigo) }}</td>
                <td>
                  <v-chip
                    size="small"
                    :color="figura.es_oficial ? 'primary' : 'default'"
                    variant="tonal"
                  >
                    {{ figura.es_oficial ? "Oficial" : "Adicional" }}
                  </v-chip>
                </td>
                <td class="text-right">
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    color="info"
                    @click="openFiguraDialog(figura)"
                  ></v-btn>
                  <v-tooltip
                    :text="
                      figura.es_oficial
                        ? 'Las figuras oficiales no se pueden eliminar'
                        : 'Eliminar figura'
                    "
                    location="top"
                  >
                    <template #activator="{ props: tipProps }">
                      <span v-bind="tipProps">
                        <v-btn
                          icon="mdi-delete"
                          variant="text"
                          size="small"
                          color="error"
                          :disabled="!!figura.es_oficial"
                          @click="deleteFigura(figura)"
                        ></v-btn>
                      </span>
                    </template>
                  </v-tooltip>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-window-item>
    </v-window>

    <v-dialog v-model="showDialog" max-width="500">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="text-h5 font-weight-bold">
          {{ mode === "create" ? "Nueva" : "Editar" }} Acción
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="formData.nombre_accion"
            label="Nombre de la Acción (Ej: Revisar, Aprobar)"
            variant="outlined"
            class="mb-3"
          ></v-text-field>
          <FiguraSelect
            v-model="formData.id_figura"
            :items="mppStore.figuras"
            label="Figura que la representará"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="isSaving"
            @click="handleSave"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="showFiguraDialog" max-width="500">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="text-h5 font-weight-bold">
          {{ figuraMode === "create" ? "Nueva" : "Editar" }} Figura
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="figuraForm.nombre"
            label="Nombre de la figura"
            variant="outlined"
            class="mb-3"
          ></v-text-field>
          <v-select
            v-model="figuraForm.codigo"
            :items="FORMAS_SOPORTADAS"
            item-title="nombre"
            item-value="codigo"
            label="Tipo de forma soportado"
            variant="outlined"
            :disabled="
              figuraMode === 'edit' &&
              !!mppStore.figuras.find((f) => f.id_figura === figuraForm.id)
                ?.es_oficial
            "
          >
            <template #item="{ props: itemProps, item }">
              <v-list-item v-bind="itemProps">
                <template #prepend>
                  <v-icon class="mr-2" color="primary" size="20">
                    {{ item.raw.icon }}
                  </v-icon>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <v-icon class="mr-2" color="primary" size="18">
                  {{ item.raw.icon }}
                </v-icon>
                <span>{{ item.title }}</span>
              </div>
            </template>
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showFiguraDialog = false">Cancelar</v-btn>
          <v-btn
            color="primary"
            variant="elevated"
            :loading="isSavingFigura"
            @click="handleSaveFigura"
          >
            Guardar
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

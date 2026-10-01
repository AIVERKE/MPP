<script setup>
import { ref, onMounted } from "vue";
import { useMppCoreStore } from "@/stores/mpp_core";
import { FORMAS_SOPORTADAS, getFiguraVisuals } from "@/utils/figuras";
import { getActionVisualsFromAccion } from "@/utils/actionVisuals";
import FiguraSelect from "@/components/mpp/FiguraSelect.vue";
import FiguraShapePreview from "@/components/mpp/FiguraShapePreview.vue";

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

const visualsForAccion = (accion) => getActionVisualsFromAccion(accion);
const formaNombre = (codigo) => getFiguraVisuals(codigo).nombre;

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
                <td>
                  <div class="d-flex align-center ga-3">
                    <FiguraShapePreview
                      v-if="accion.figura"
                      :codigo="accion.figura.codigo"
                      size="sm"
                    />
                    <span>{{ accion.figura?.nombre || "Sin figura" }}</span>
                  </div>
                </td>
                <td class="text-center py-4">
                  <div class="preview-cell">
                    <FiguraShapePreview
                      :codigo="visualsForAccion(accion).codigoFigura"
                      :color-hex="visualsForAccion(accion).colorHex"
                      size="md"
                    />
                  </div>
                </td>
                <td class="text-right">
                  <div class="action-btns">
                    <v-btn
                      icon="mdi-pencil"
                      variant="tonal"
                      size="large"
                      color="info"
                      @click="openDialog(accion)"
                    ></v-btn>
                    <v-btn
                      icon="mdi-delete"
                      variant="tonal"
                      size="large"
                      color="error"
                      @click="deleteAccion(accion.id_accion)"
                    ></v-btn>
                  </div>
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
                <td class="text-center py-4">
                  <div class="preview-cell">
                    <FiguraShapePreview
                      :codigo="figura.codigo"
                      size="lg"
                    />
                  </div>
                </td>
                <td class="font-weight-bold">{{ figura.nombre }}</td>
                <td>
                  <div class="d-flex align-center ga-2">
                    <FiguraShapePreview
                      :codigo="figura.codigo"
                      size="sm"
                    />
                    <span>{{ formaNombre(figura.codigo) }}</span>
                  </div>
                </td>
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
                  <div class="action-btns">
                    <v-btn
                      icon="mdi-pencil"
                      variant="tonal"
                      size="large"
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
                            variant="tonal"
                            size="large"
                            color="error"
                            :disabled="!!figura.es_oficial"
                            @click="deleteFigura(figura)"
                          ></v-btn>
                        </span>
                      </template>
                    </v-tooltip>
                  </div>
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

    <v-dialog v-model="showFiguraDialog" max-width="520">
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
              <v-list-item v-bind="itemProps" class="forma-option">
                <template #prepend>
                  <div class="preview-slot mr-3">
                    <FiguraShapePreview :codigo="item.raw.codigo" size="sm" />
                  </div>
                </template>
              </v-list-item>
            </template>
            <template #selection="{ item }">
              <div class="d-flex align-center">
                <div class="preview-slot preview-slot--sm mr-2">
                  <FiguraShapePreview :codigo="item.raw.codigo" size="sm" />
                </div>
                <span>{{ item.title }}</span>
              </div>
            </template>
          </v-select>

          <div
            v-if="figuraForm.codigo"
            class="forma-preview mt-5 d-flex align-center justify-center"
          >
            <FiguraShapePreview :codigo="figuraForm.codigo" size="lg" />
            <div class="ml-4">
              <div class="text-caption text-medium-emphasis">Vista previa</div>
              <div class="text-subtitle-1 font-weight-bold">
                {{ formaNombre(figuraForm.codigo) }}
              </div>
            </div>
          </div>
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

<style scoped>
.preview-cell {
  min-height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.action-btns {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  gap: 10px;
  min-height: 72px;
}

.preview-slot {
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-slot--sm {
  width: 40px;
  height: 40px;
}

.forma-option {
  min-height: 60px;
}

.forma-preview {
  padding: 18px 16px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}
</style>

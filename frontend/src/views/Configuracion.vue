<script setup>
import { ref, onMounted } from "vue";
import { useMppCoreStore } from "@/stores/mpp_core";

const mppStore = useMppCoreStore();
const showDialog = ref(false);
const isSaving = ref(false);
const mode = ref("create");

const formData = ref({
  id: null,
  nombre_accion: "",
  id_figura: null
});

const openDialog = (item = null) => {
  if (item) {
    mode.value = "edit";
    formData.value = { 
      id: item.id_accion, 
      nombre_accion: item.nombre_accion, 
      id_figura: item.figura?.id_figura || item.id_figura 
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

onMounted(async () => {
  await Promise.all([mppStore.fetchAcciones(), mppStore.fetchFiguras()]);
});
</script>

<template>
  <v-container fluid class="pa-0">
    <div class="mb-6 d-flex align-center justify-space-between">
      <div>
        <h1 class="text-h4 font-weight-black mb-1 text-slate-800">Configuración de Flujo</h1>
        <div class="text-body-2 d-flex align-center text-slate-500">
          <v-icon size="18" class="mr-2">mdi-cog</v-icon>
          <span>Menú</span>
          <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
          <span class="font-weight-bold text-primary">Configuración</span>
        </div>
      </div>
      <v-spacer></v-spacer>
      <v-btn color="primary" prepend-icon="mdi-plus" class="rounded-lg font-weight-bold" @click="openDialog()">Nueva Acción</v-btn>
    </div>

    <v-row>
      <v-col cols="12">
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
                <td>{{ accion.figura?.nombre || 'Sin figura' }}</td>
                <td class="text-center">
                  <v-icon :color="accion.nombre_accion.toLowerCase().includes('inicio') ? 'success' : 'primary'">
                    {{ 
                      accion.figura?.codigo === 'circulo' ? 'mdi-circle' : 
                      accion.figura?.codigo === 'rombo' ? 'mdi-rhombus' : 'mdi-rectangle' 
                    }}
                  </v-icon>
                </td>
                <td class="text-right">
                  <v-btn icon="mdi-pencil" variant="text" size="small" color="info" @click="openDialog(accion)"></v-btn>
                  <v-btn icon="mdi-delete" variant="text" size="small" color="error" @click="deleteAccion(accion.id_accion)"></v-btn>
                </td>
              </tr>
            </tbody>
          </v-table>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="showDialog" max-width="500">
      <v-card class="rounded-xl pa-4">
        <v-card-title class="text-h5 font-weight-bold">
          {{ mode === 'create' ? 'Nueva' : 'Editar' }} Acción
        </v-card-title>
        <v-card-text>
          <v-text-field
            v-model="formData.nombre_accion"
            label="Nombre de la Acción (Ej: Revisar, Aprobar)"
            variant="outlined"
          ></v-text-field>
          <v-select
            v-model="formData.id_figura"
            :items="mppStore.figuras"
            item-title="nombre"
            item-value="id_figura"
            label="Figura que la representará"
            variant="outlined"
          ></v-select>
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="showDialog = false">Cancelar</v-btn>
          <v-btn color="primary" variant="elevated" @click="handleSave" :loading="isSaving">Guardar</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
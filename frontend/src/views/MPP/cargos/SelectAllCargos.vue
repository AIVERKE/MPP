<script setup>
import { onMounted, computed, ref } from 'vue';
import { useAllCargosMppStore } from '../../../stores/cargos_mpp';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  }
});
const emit = defineEmits(['update:modelValue']);

const cargosStore = useAllCargosMppStore();

// Estados para gestiÃ³n de catÃ¡logo
const dialog = ref(false);
const editingCargo = ref(null);
const cargoName = ref("");
const search = ref("");

/**
 * Normaliza la lista de cargos garantizando que no haya duplicados visuales
 * y que todos los IDs sean Strings para un emparejamiento estricto con v-model.
 */
const uniqueCargos = computed(() => {
  const seen = new Set();
  return cargosStore.cargos
    .filter(c => {
      const isDup = seen.has(c.id);
      seen.add(c.id);
      return !isDup;
    })
    .map(c => ({
      ...c,
      id: String(c.id) 
    }));
});

/**
 * Propiedad computada bidireccional para el v-model.
 */
const value = computed({
  get() {
    const val = Array.isArray(props.modelValue) ? props.modelValue : [];
    return val.map(id => String(id));
  },
  set(val) {
    emit('update:modelValue', val);
  }
});

// Funciones de gestiÃ³n
function openDialog(item = null) {
  if (item) {
    editingCargo.value = item;
    cargoName.value = item.descripcion;
  } else {
    editingCargo.value = null;
    cargoName.value = search.value; // Pre-cargar lo que el usuario escribiÃ³ en la bÃºsqueda
  }
  dialog.value = true;
}

async function saveCargo() {
  if (!cargoName.value.trim()) return;

  let success = false;
  if (editingCargo.value) {
    success = await cargosStore.updateCargo(editingCargo.value.id, cargoName.value.trim());
  } else {
    success = await cargosStore.createCargo(cargoName.value.trim());
  }

  if (success) {
    dialog.value = false;
    cargoName.value = "";
    editingCargo.value = null;
    // Si fue creaciÃ³n, podrÃ­as querer seleccionarlo automÃ¡ticamente, pero en multi-select es complejo
  }
}

onMounted(async () => {
    if (cargosStore.cargos.length === 0) {
        await cargosStore.getFetchCargos();
    }
});
</script>

<template>
    <div class="d-flex align-center">
        <v-autocomplete 
            v-model="value"
            v-model:search="search"
            label="Cargos del Personal" 
            :items="uniqueCargos" 
            item-title="descripcion" 
            item-value="id" 
            variant="underlined"
            multiple
            chips
            closable-chips
            clearable
            :loading="cargosStore.loading"
            class="flex-grow-1"
        >
            <template v-slot:no-data>
              <v-list-item @click="openDialog()">
                <template v-slot:prepend>
                  <v-icon color="primary">mdi-plus</v-icon>
                </template>
                <v-list-item-title>
                  Crear nuevo cargo: "<strong>{{ search }}</strong>"
                </v-list-item-title>
              </v-list-item>
            </template>

            <!-- Slot para cada item en la lista -->
            <template v-slot:item="{ props, item }">
              <v-list-item v-bind="props" :title="item.title">
                <template v-slot:prepend>
                  <v-checkbox-btn :model-value="value.includes(String(item.value))"></v-checkbox-btn>
                </template>
                <template v-slot:append>
                  <v-btn
                    icon="mdi-pencil"
                    variant="text"
                    size="small"
                    color="grey-darken-1"
                    @click.stop="openDialog(item.raw)"
                  ></v-btn>
                </template>
              </v-list-item>
            </template>

            <!-- BotÃ³n extra al final de la lista -->
            <template v-slot:append-item>
                <v-divider />
                <v-list-item @click="openDialog()" color="primary">
                    <template v-slot:prepend>
                        <v-icon color="primary">mdi-plus-circle</v-icon>
                    </template>
                    <v-list-item-title class="text-primary font-weight-bold">
                        AÃ‘ADIR NUEVO CARGO AL CATÃLOGO
                    </v-list-item-title>
                </v-list-item>
            </template>
        </v-autocomplete>

        <!-- DiÃ¡logo para crear/editar -->
        <v-dialog v-model="dialog" max-width="400">
            <v-card>
                <v-card-title class="text-h6">
                    {{ editingCargo ? 'Editar Cargo' : 'Nuevo Cargo' }}
                </v-card-title>
                <v-card-text>
                    <v-text-field
                        v-model="cargoName"
                        label="Nombre del Cargo (CatÃ¡logo)"
                        variant="outlined"
                        autofocus
                        @keyup.enter="saveCargo"
                        hide-details
                    ></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn text @click="dialog = false">Cancelar</v-btn>
                    <v-btn 
                        color="primary" 
                        @click="saveCargo" 
                        :loading="cargosStore.loading"
                        :disabled="!cargoName.trim()"
                    >
                        Guardar
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>

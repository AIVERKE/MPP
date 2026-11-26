<template>
  <v-dialog
    :model-value="modelValue"
    :max-width="dialogMaxWidth"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card v-if="schema" class="rounded-xl overflow-hidden">
      <!-- ENCABEZADO DEL MODAL -->
      <v-card-title class="text-h6 font-weight-bold d-flex align-center">
        <v-icon color="primary" class="mr-2">{{ schema.icon || "mdi-pencil-box-outline" }}</v-icon>
        <span>{{ mode === "create" ? "NUEVO" : "EDITAR" }} {{ (schema.title || "").toUpperCase() }}</span>
      </v-card-title>

      <!-- CUERPO DEL FORMULARIO DINÁMICO -->
      <v-card-text class="px-6 py-4">
        <v-form ref="formRef" v-model="isFormValid" @submit.prevent="handleSave">
          <v-row>
            <v-col
              v-for="field in visibleFields"
              :key="field.key"
              :cols="12"
              :sm="getFieldCols(field)"
              class="py-2"
            >
              <!-- Campo Texto o Fecha -->
              <v-text-field
                v-if="['text', 'date', 'number'].includes(field.type)"
                v-model="formData[field.key]"
                :label="field.label"
                :type="field.type === 'date' ? 'date' : (field.type === 'number' ? 'number' : 'text')"
                :rules="field.required ? [rules.required] : []"
                variant="outlined"
                density="compact"
                hide-details="auto"
              ></v-text-field>

              <!-- Campo Solo Lectura -->
              <v-text-field
                v-else-if="field.type === 'readonly'"
                :model-value="formData[field.key] || '—'"
                :label="field.label"
                variant="outlined"
                density="compact"
                readonly
                hide-details="auto"
              ></v-text-field>

              <!-- Campo Textarea -->
              <v-textarea
                v-else-if="field.type === 'textarea'"
                v-model="formData[field.key]"
                :label="field.label"
                :rules="field.required ? [rules.required] : []"
                variant="outlined"
                density="compact"
                rows="2"
                auto-grow
                hide-details="auto"
              ></v-textarea>

              <!-- Selector Múltiple (Relacional) -->
              <v-select
                v-else-if="field.type === 'select-multiple'"
                v-model="formData[field.key]"
                :items="resolveOptions(field)"
                :item-title="field.itemTitle || 'nombre'"
                :item-value="field.itemValue || 'id'"
                :label="field.label"
                multiple
                chips
                closable-chips
                variant="outlined"
                density="compact"
                hide-details="auto"
              ></v-select>

              <!-- Selector Simple -->
              <v-select
                v-else-if="field.type === 'select'"
                v-model="formData[field.key]"
                :items="resolveOptions(field)"
                :item-title="field.itemTitle || (typeof field.options?.[0] === 'object' ? 'nombre' : undefined)"
                :item-value="field.itemValue || (typeof field.options?.[0] === 'object' ? 'id' : undefined)"
                :label="field.label"
                :rules="field.required ? [rules.required] : []"
                variant="outlined"
                density="compact"
                hide-details="auto"
              ></v-select>
            </v-col>
          </v-row>
        </v-form>
      </v-card-text>

      <!-- BOTONES DE ACCIÓN -->
      <v-card-actions class="px-6 pb-4">
        <v-btn
          v-if="showDelete && mode === 'edit'"
          color="error"
          variant="outlined"
          class="rounded-lg font-weight-bold text-uppercase text-caption"
          :disabled="loading"
          @click="handleDelete"
        >
          Eliminar
        </v-btn>

        <v-spacer></v-spacer>

        <v-btn
          color="primary"
          variant="outlined"
          class="rounded-lg font-weight-bold text-uppercase text-caption mr-2"
          :disabled="loading"
          @click="handleCancel"
        >
          Cancelar
        </v-btn>

        <v-btn
          color="primary"
          variant="flat"
          class="rounded-lg font-weight-bold text-uppercase text-caption px-6"
          :loading="loading"
          @click="handleSave"
        >
          Guardar {{ schema.title }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref, computed, watch } from "vue";
import { rules } from "@/utils/rules";

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  schema: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: "create", // 'create' | 'edit'
  },
  initialData: {
    type: Object,
    default: () => ({}),
  },
  optionsSources: {
    type: Object,
    default: () => ({}),
  },
  loading: {
    type: Boolean,
    default: false,
  },
  showDelete: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue", "save", "delete", "cancel"]);

const formRef = ref(null);
const isFormValid = ref(true);
const formData = ref({});

const visibleFields = computed(() => {
  if (!props.schema || !Array.isArray(props.schema.fields)) return [];
  return props.schema.fields.filter((f) => f.type !== "hidden");
});

const dialogMaxWidth = computed(() => {
  if (props.maxWidth) return props.maxWidth;
  return visibleFields.value.length > 3 ? "760px" : "560px";
});

const getFieldCols = (field) => {
  if (field.cols) return field.cols;
  if (field.fullWidth || field.type === "select-multiple") return 12;
  if (visibleFields.value.length > 3) {
    if (field.type === "textarea" && field.rows && field.rows > 2) return 12;
    return 6;
  }
  return 12;
};

const resolveOptions = (field) => {
  if (field.optionsSource && props.optionsSources) {
    const source = props.optionsSources[field.optionsSource];
    if (Array.isArray(source)) return source;
  }
  return field.options || [];
};

// Sincronizar initialData al abrir el modal o cambiar el schema
watch(
  [() => props.modelValue, () => props.initialData, () => props.schema],
  ([isOpen]) => {
    if (isOpen && props.schema) {
      const data = { ...props.initialData };
      // Asegurar valores por defecto si no existen
      if (Array.isArray(props.schema.fields)) {
        props.schema.fields.forEach((f) => {
          if (data[f.key] === undefined) {
            data[f.key] = f.default !== undefined ? f.default : (f.type.includes("multiple") ? [] : "");
          }
        });
      }
      formData.value = data;
    }
  },
  { immediate: true, deep: true }
);

const handleSave = async () => {
  if (formRef.value) {
    const { valid } = await formRef.value.validate();
    if (!valid) return;
  }
  emit("save", { ...formData.value });
};

const handleDelete = () => {
  emit("delete", { ...formData.value });
};

const handleCancel = () => {
  emit("cancel");
  emit("update:modelValue", false);
};
</script>

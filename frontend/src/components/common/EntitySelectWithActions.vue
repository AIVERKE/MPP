<template>
  <div class="entity-select-with-actions d-flex align-start ga-2">
    <div class="select-field-container flex-grow-1 position-relative">
      <!-- Placeholder interactivo y siempre visible cuando no hay selección -->
      <div
        v-if="!modelValue && placeholder"
        class="custom-select-placeholder d-flex align-center"
        :class="{ 'placeholder-disabled': disabled, 'has-prepend': !!prependInnerIcon }"
      >
        <span>{{ placeholder }}</span>
      </div>

      <v-select
        :model-value="modelValue"
        :items="items"
        :item-title="itemTitle"
        :item-value="itemValue"
        :item-props="itemProps"
        :variant="variant"
        :density="density"
        :disabled="disabled"
        :prepend-inner-icon="prependInnerIcon"
        :rules="rules"
        :hide-details="hideDetails"
        class="w-100"
        @update:model-value="$emit('update:modelValue', $event)"
      >
        <!-- Re-emit dynamic slots if provided by parent -->
        <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
          <slot :name="slotName" v-bind="slotProps || {}" />
        </template>

        <!-- Slot enriquecido para cada opción en la lista desplegable sin duplicidad de título -->
        <template v-if="!$slots.item" #item="{ props: itemPropsData, item }">
          <v-list-item
            v-bind="itemPropsData"
            :title="typeof itemTitle === 'function' ? itemTitle(item.raw) : (item.raw && item.raw[itemTitle]) || item.title"
            class="py-2 px-3"
          >
            <template #prepend>
              <v-icon :icon="prependInnerIcon || 'mdi-circle-medium'" size="20" color="primary" class="mr-2" />
            </template>
            <template v-if="item.raw && (item.raw.codigo || item.raw.descripcion)" #subtitle>
              <span class="text-caption text-grey-darken-1">
                <span v-if="item.raw.codigo" class="font-weight-bold mr-1">{{ item.raw.codigo }}</span>
                <span v-if="item.raw.codigo && item.raw.descripcion">—</span>
                <span v-if="item.raw.descripcion" class="ml-1">{{ item.raw.descripcion }}</span>
              </span>
            </template>
          </v-list-item>
        </template>

        <!-- Slot amigable cuando no hay datos en la lista -->
        <template v-if="!$slots['no-data']" #no-data>
          <div class="pa-4 text-center d-flex flex-column align-center justify-center ga-1 text-slate-600">
            <v-icon size="28" color="primary" class="mb-1">mdi-folder-search-outline</v-icon>
            <span class="text-caption font-weight-bold">{{ noDataText || 'No hay elementos disponibles' }}</span>
            <span v-if="!hideActions && !disabled" class="text-caption text-grey-darken-1">
              Haga clic en el botón <strong class="text-primary font-weight-bold">+</strong> a la derecha para registrar uno nuevo.
            </span>
          </div>
        </template>
      </v-select>
    </div>

    <div v-if="!hideActions" class="field-actions-wrapper">
      <v-btn
        icon
        color="primary"
        variant="tonal"
        class="action-square-btn"
        :disabled="disabled || disableAdd"
        :title="addTitle"
        @click="$emit('add')"
      >
        <v-icon size="18">mdi-plus</v-icon>
      </v-btn>

      <v-btn
        icon
        color="info"
        variant="tonal"
        class="action-square-btn"
        :disabled="disabled || disableEdit || !modelValue"
        :title="editTitle"
        @click="$emit('edit')"
      >
        <v-icon size="18">mdi-pencil</v-icon>
      </v-btn>
    </div>
  </div>
</template>

<script setup>
defineProps({
  modelValue: {
    type: [String, Number, Object],
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  itemTitle: {
    type: [String, Function],
    default: "nombre",
  },
  itemValue: {
    type: [String, Function],
    default: "id",
  },
  itemProps: {
    type: [Function, Object, Boolean],
    default: false,
  },
  label: {
    type: String,
    default: "",
  },
  placeholder: {
    type: String,
    default: "",
  },
  persistentPlaceholder: {
    type: Boolean,
    default: false,
  },
  singleLine: {
    type: Boolean,
    default: undefined,
  },
  noDataText: {
    type: String,
    default: "",
  },
  variant: {
    type: String,
    default: "outlined",
  },
  density: {
    type: String,
    default: "comfortable",
  },
  prependInnerIcon: {
    type: String,
    default: "",
  },
  rules: {
    type: Array,
    default: () => [],
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  disableAdd: {
    type: Boolean,
    default: false,
  },
  disableEdit: {
    type: Boolean,
    default: false,
  },
  hideActions: {
    type: Boolean,
    default: false,
  },
  hideDetails: {
    type: [Boolean, String],
    default: false,
  },
  addTitle: {
    type: String,
    default: "Crear",
  },
  editTitle: {
    type: String,
    default: "Editar",
  },
});

defineEmits(["update:modelValue", "add", "edit"]);
</script>

<style scoped>
.select-field-container {
  position: relative;
  width: 100%;
}

.custom-select-placeholder {
  position: absolute;
  top: 24px;
  left: 16px;
  transform: translateY(-50%);
  color: #64748b; /* slate-500: visible y nítido */
  font-size: 0.875rem;
  font-weight: 400;
  pointer-events: none;
  z-index: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - 50px);
  user-select: none;
}

.custom-select-placeholder.has-prepend {
  left: 44px;
  max-width: calc(100% - 78px);
}

.custom-select-placeholder.placeholder-disabled {
  color: #94a3b8;
  opacity: 0.75;
}

.field-actions-wrapper {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-square-btn {
  width: 48px !important;
  height: 48px !important;
  min-width: 48px !important;
  border-radius: 8px !important;
}
</style>

<style scoped>
.field-actions-wrapper {
  height: 48px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.action-square-btn {
  width: 40px !important;
  height: 40px !important;
  min-width: 40px !important;
  min-height: 40px !important;
  border-radius: 8px !important;
}
</style>

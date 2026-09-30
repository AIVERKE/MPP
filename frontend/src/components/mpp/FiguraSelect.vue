<script setup>
import { computed } from 'vue';
import { getFiguraVisuals } from '@/utils/figuras';
import FiguraShapePreview from '@/components/mpp/FiguraShapePreview.vue';

const props = defineProps({
  modelValue: {
    type: [Number, String, null],
    default: null,
  },
  items: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'Figura',
  },
  density: {
    type: String,
    default: 'default',
  },
  hideDetails: {
    type: [Boolean, String],
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const selected = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const codigoOf = (figura) => getFiguraVisuals(figura?.codigo).codigo;
</script>

<template>
  <v-select
    v-model="selected"
    :items="items"
    item-title="nombre"
    item-value="id_figura"
    :label="label"
    variant="outlined"
    :density="density"
    :hide-details="hideDetails"
  >
    <template #item="{ props: itemProps, item }">
      <v-list-item v-bind="itemProps" class="figura-select-item">
        <template #prepend>
          <div class="preview-slot mr-3">
            <FiguraShapePreview :codigo="codigoOf(item.raw)" size="sm" />
          </div>
        </template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <div class="d-flex align-center">
        <div class="preview-slot preview-slot--sm mr-2">
          <FiguraShapePreview :codigo="codigoOf(item.raw)" size="sm" />
        </div>
        <span>{{ item.title }}</span>
      </div>
    </template>
  </v-select>
</template>

<style scoped>
.preview-slot {
  width: 44px;
  height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.preview-slot--sm {
  width: 36px;
  height: 36px;
}

.figura-select-item {
  min-height: 56px;
}
</style>

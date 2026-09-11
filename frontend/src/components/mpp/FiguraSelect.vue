<script setup>
import { computed } from 'vue';
import { getFiguraVisuals } from '@/utils/figuras';

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

const iconFor = (figura) => getFiguraVisuals(figura?.codigo).icon;
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
      <v-list-item v-bind="itemProps">
        <template #prepend>
          <v-icon class="mr-2" color="primary" size="20">
            {{ iconFor(item.raw) }}
          </v-icon>
        </template>
      </v-list-item>
    </template>
    <template #selection="{ item }">
      <div class="d-flex align-center">
        <v-icon class="mr-2" color="primary" size="18">
          {{ iconFor(item.raw) }}
        </v-icon>
        <span>{{ item.title }}</span>
      </div>
    </template>
  </v-select>
</template>

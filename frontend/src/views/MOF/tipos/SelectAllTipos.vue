<script setup>
import { onMounted, computed } from 'vue';
import { useAllTiposMofStore } from '../../../stores/tipos_mof';

defineProps({
  variant: { type: String, default: 'underlined' },
  label: { type: String, default: 'Tipo de Unidad' },
});

const model = defineModel();
const tiposStore = useAllTiposMofStore();

const visibleItems = computed(() => tiposStore.tipos.filter(t => t.activo));

onMounted(async () => {
    if (tiposStore.tipos.length === 0) {
        await tiposStore.getFetchTipos();
    }
});
</script>

<template>
    <v-autocomplete
        v-bind="$attrs"
        v-model="model"
        :label="label"
        :items="visibleItems"
        item-title="descripcion"
        item-value="id"
        :variant="variant"
        clearable
        :loading="tiposStore.loading"
        class="flex-grow-1"
    />
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useAllNivelesMofStore } from '../../../stores/niveles_mof';

defineProps({
  variant: { type: String, default: 'underlined' },
  label: { type: String, default: 'Nivel Jerárquico' },
});

const model = defineModel();
const nivelesStore = useAllNivelesMofStore();

const visibleItems = computed(() => nivelesStore.niveles.filter(n => n.activo));

onMounted(async () => {
    if (nivelesStore.niveles.length === 0) {
        await nivelesStore.getFetchNiveles();
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
        :loading="nivelesStore.loading"
        class="flex-grow-1"
    />
</template>

<script setup>
import { onMounted, computed } from 'vue';
import { useAllRelacionesMofStore } from '../../../stores/relaciones_mof';

defineProps({
  variant: { type: String, default: 'underlined' },
  label: { type: String, default: 'Relación' },
});

const model = defineModel();
const relacionesStore = useAllRelacionesMofStore();

const visibleItems = computed(() => relacionesStore.relaciones.filter(r => r.activo));

onMounted(async () => {
    if (relacionesStore.relaciones.length === 0) {
        await relacionesStore.getFetchRelaciones();
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
        :loading="relacionesStore.loading"
        class="flex-grow-1"
    />
</template>

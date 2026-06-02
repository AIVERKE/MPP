<script setup>
import { onMounted } from 'vue';
import { useAllRelacionesMppStore } from '../../../stores/relaciones_mpp';

const model = defineModel();
const relacionesStore = useAllRelacionesMppStore();

onMounted(async () => {
    if (relacionesStore.relaciones.length === 0) {
        await relacionesStore.getFetchRelaciones();
    }
});
</script>

<template>
    <v-select 
        v-model="model"
        label="RelaciÃ³n" 
        :items="relacionesStore.relaciones" 
        item-title="description" 
        item-value="value" 
        v-bind="$attrs"
    ></v-select>
</template>

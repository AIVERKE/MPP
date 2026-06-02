<script setup>
import { onMounted } from 'vue';
import { useAllNivelesMppStore } from '../../../stores/niveles_mpp';

const model = defineModel();
const nivelesStore = useAllNivelesMppStore();

onMounted(async () => {
    if (nivelesStore.niveles.length === 0) {
        await nivelesStore.getFetchNiveles();
    }
});
</script>

<template> 
    <v-select 
        v-model="model"
        label="Nivel" 
        :items="nivelesStore.niveles" 
        item-title="description" 
        item-value="value" 
        v-bind="$attrs"
    ></v-select>
</template>


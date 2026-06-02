<script setup>
import { onMounted } from 'vue';
import { useAllClasesMppStore } from '../../../stores/clases_mpp';

const model = defineModel();
const clasesStore = useAllClasesMppStore();

onMounted(async () => {
    if (clasesStore.clases.length === 0) {
        await clasesStore.getFetchClases();
    }
});
</script>

<template>
    <v-select 
        v-model="model"
        label="Clase" 
        :items="clasesStore.clases" 
        item-title="descripcion" 
        item-value="id" 
        v-bind="$attrs"
    ></v-select>
</template>


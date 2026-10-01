<script setup>
import { onMounted, computed } from 'vue';
import { useAllClasesMofStore } from '../../../stores/clases_mof';

defineProps({
  variant: { type: String, default: 'underlined' },
  label: { type: String, default: 'Clase' },
});

const model = defineModel();
const clasesStore = useAllClasesMofStore();

const visibleItems = computed(() => clasesStore.clases.filter(c => c.activo));

onMounted(async () => {
    if (clasesStore.clases.length === 0) {
        await clasesStore.getFetchClases();
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
        :loading="clasesStore.loading"
        class="flex-grow-1"
    >
        <template v-slot:item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps">
                <template v-slot:title>
                    {{ item.title }}
                    <span v-if="item.raw.oficial" class="text-success font-weight-black ml-1" style="font-size: 8px;">OFICIAL</span>
                </template>
                <template v-slot:prepend>
                    <div
                        class="me-2"
                        style="width: 12px; height: 12px; border-radius: 2px; background-color: var(--color)"
                        :style="{ '--color': item.raw.color }"
                    ></div>
                </template>
            </v-list-item>
        </template>
    </v-autocomplete>
</template>

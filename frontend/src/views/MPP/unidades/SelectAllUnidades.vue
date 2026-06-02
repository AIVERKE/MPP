<script setup>
import { computed, onMounted } from 'vue';
import { useAllUnidadesMppStore } from '../../../stores/unidades_mpp';

const props = defineProps({
    modelValue: [Number, String, Array, null],
    type: {
        type: String,
        default: 'select'//valor por defecto para select normal
    },
    excludeId: {
        type: [Number, String, null],
        default: null
    },
    items: {
        type: Array,
        default: null
    }
});

const emit = defineEmits(['update:modelValue']);

const undadesAllUnidadesStore = useAllUnidadesMppStore();

/**
 * Gestiona la selecciÃ³n bidireccional permitiendo que el componente
 * funcione tanto en formularios de creaciÃ³n como de ediciÃ³n.
 */
const value = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  }
});

onMounted(async () => {
    // Solo carga si el store estÃ¡ vacÃ­o para optimizar peticiones
    if (undadesAllUnidadesStore.unidades.length === 0) {
        await undadesAllUnidadesStore.getFetchUnidades();
    }
});

/**
 * Filtra la lista para evitar que una unidad se seleccione a sÃ­ misma
 * (Ãºtil en dependencias funcionales o cambio de padre).
 */
const filteredUnidades = computed(() => {
    const list = props.items || undadesAllUnidadesStore.unidades;
    if (props.excludeId) {
        return list.filter(u => String(u.id) !== String(props.excludeId));
    }
    return list;
});

//Adicionando las nuevas propiedades 
const autocompleteProps = computed(() => {
    if (props.type !== 'autocomplete') return {};
    return {
        clearable: true,
        chips: true,
        multiple: true,
        'closable-chips': true
    }
});
</script>

<template>
    <component 
        :is="props.type === 'autocomplete' ? 'v-autocomplete' : 'v-select'"
        v-model="value"
        label="Unidades" 
        :items="filteredUnidades" 
        item-title="nombre" 
        item-value="id" 
        variant="underlined" 
        v-bind="autocompleteProps"
        :loading="undadesAllUnidadesStore.loading"
    />
</template>


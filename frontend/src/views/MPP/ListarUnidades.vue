<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAllUnidadesMppStore } from '../../stores/unidades_mpp'
// En la instalación de Vuetify v3: si VDataTable está en labs, puede requerir importarlo explícitamente:
// import { VDataTable } from 'vuetify/labs/VDataTable'

const unidadesStore = useAllUnidadesMppStore();

//Le llamo a la API para mostrar mi componente
onMounted(async () => {
    await unidadesStore.getFetchUnidades();
});

const search = ref('')
const headers = [
    { title: 'Codigo', key: 'codigo', align: 'start', sortable: true, value: 'codigo' },
    { title: 'Nombre', key: 'nombre', align: 'start', sortable: true, value: 'nombre' },
    { title: 'Dependencia', key: 'dependencia', align: 'start', sortable: true, value: 'dependencia' },
    { title: 'Nivel', key: 'nivel', align: 'center', sortable: true, value: 'nivel' },
    { title: 'Tipo', key: 'tipo', align: 'start', sortable: true, value: 'tipo' },
    { title: 'Acciones', key: 'actions', align: 'center', sortable: false },
]


// const filteredItems = computed(() => {
//     // if (!search.value) return items.value
//     const term = search.value.toLowerCase()
//     return unidadesStore.unidad.filter(item =>
//         item.codigo.toLowerCase().includes(term) ||
//         item.nombre.toLowerCase().includes(term)
//     )
// })

const filteredItems = computed(() => {
    const unidades = unidadesStore.unidades || []  // Aseguramos que sea un array, si no no muestra el contenido
    const term = search.value.toLowerCase()
    return unidades.filter(u =>
        Object.values(u).some(val =>
            String(val).toLowerCase().includes(term)
        )
    )
})


function editItem(item) {
    console.log('Editando:', item)
    // lógica de edición
}

function deleteItem(item) {
    console.log('Eliminando:', item);
    console.log(item.id);
    unidadesStore.deleteUnidad(item.id);
}
</script>

<template>
    <div>
        <h1 class="text-h4 mb-4">Listado de Unidades UMSA</h1>
        <!-- Efecto CARGANDO -->
        <v-progress-linear v-if="unidadesStore.loading" indeterminate color="primary" class="mb-4" />
        <!-- Mostrado de errores en el fetch -->
        <v-alert v-if="unidadesStore.error" type="error" class="mb-4">{{ unidadesStore.error }}</v-alert>

        <v-card>
            <v-card-title>
                <v-text-field v-model="search" append-icon="mdi-magnify" label="Buscar" single-line hide-details>
                </v-text-field>
                <v-spacer></v-spacer>
            </v-card-title>

            <v-data-table :headers="headers" :items="filteredItems" :items-per-page="5" :search="search"
                class="elevation-1">
                <template #item.actions="{ item }">
                    <v-icon small class="mr-2" @click="editItem(item)">
                        mdi-pencil
                    </v-icon>
                    <v-icon small @click="deleteItem(item)">
                        mdi-delete
                    </v-icon>
                </template>
            </v-data-table>
        </v-card>
    </div>
</template>


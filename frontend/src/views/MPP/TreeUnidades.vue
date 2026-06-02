<!-- 
 Create by: Jesus Reynaldo Perez Benavides 
 phone: +591 73030203
 mail: jperezbenavides@gmail.com
 -->
<script setup>
import { ref, onMounted, computed } from "vue";
import { useAllUnidadesMppStore } from "../../stores/unidades_mpp";
import { useAllTiposMppStore } from "../../stores/tipos_mpp";
import { useAllNivelesMppStore } from "../../stores/niveles_mpp";
import { rules } from "@/utils/rules";
import SelectAllRelaciones from "./relaciones/SelectAllRelaciones.vue";
import SelectAllTipos from "./tipos/SelectAllTipos.vue";
import SelectAllNiveles from "./niveles/SelectAllNiveles.vue";
import SelectAllUnidades from "./unidades/SelectAllUnidades.vue";



const snackbar = ref(false);
const snackbarText = ref('');
const snackbarColor = ref('success');


const unidadesStore = useAllUnidadesMppStore();

const tiposStore = useAllTiposMppStore();

const NivelesStore = useAllNivelesMppStore();
// Estado del modal y del item seleccionado
const addDialog = ref(false);
const selectedItem = ref(null);

const formValid = ref(false);

//para delete item
const deleteDialog = ref(false);
const itemToDelete = ref(null);

//para modificar
const isEditMode = ref(false);

onMounted(async () => {
    await unidadesStore.getFetchUnidades();

    await tiposStore.getFetchTipos();

    await NivelesStore.getFetchNiveles();
});

//Función para convertir el array plano en estructura jerárquica
function buildTree(list) {
    const map = {};
    const roots = [];

    list.forEach((item) => {
        map[item.id] = { ...item, children: [] };
    });

    list.forEach((item) => {
        if (item.parent && map[item.parent]) {
            map[item.parent].children.push(map[item.id]);
        } else {
            roots.push(map[item.id]);
        }
    });

    return roots;
}

// Estructura del árbol
const treeItems = computed(() => buildTree(unidadesStore.unidades));

async function editItem(item) {
    try {
        isEditMode.value = true;
        selectedItem.value = item;

        snackbarText.value = "Cargando datos...";
        snackbarColor.value = 'info';
        snackbar.value = true;

        const unidadData = await unidadesStore.getUnidadById(item.id);

        if (unidadData) {
            // Extraer solo IDs de dependenciasFuncionales
            const dependenciasIds = Array.isArray(unidadData.dependenciasFuncionales)
                ? unidadData.dependenciasFuncionales.map(d => 
                    typeof d === 'object' ? d.id : d
                  )
                : [];

            formData.value.nombre = unidadData.nombre;
            formData.value.codigo = unidadData.codigo;
            formData.value.resCreacion = unidadData.resCreacion;
            formData.value.objetivo = unidadData.objetivo;
            formData.value.tipo = unidadData.tipo;
            formData.value.nivel = unidadData.nivel;
            formData.value.fecCreacion = unidadData.fecCreacion;
            formData.value.relacion = unidadData.relacion;
            formData.value.relInterno = unidadData.relInterno;
            formData.value.relExterno = unidadData.relExterno;
            formData.value.funciones = unidadData.funciones;
            formData.value.oficial = unidadData.oficial;
            formData.value.dependenciasFuncionales = dependenciasIds; //  Solo IDs

            snackbar.value = false;
            formValid.value = true;
            addDialog.value = true;
        } else {
            snackbarText.value = 'Error al cargar los datos';
            snackbarColor.value = 'error';
        }
    } catch (error) {
        snackbarText.value = 'Error al cargar';
        snackbarColor.value = 'error';
        snackbar.value = true;
    }
}
function deleteItem(item) {
    itemToDelete.value = item;
    deleteDialog.value = true;
}
async function confirmDelete() {
    if (unidadesStore.loading) return;
    // console.log('Item a eliminar:', itemToDelete.value);
    // console.log('ID:', itemToDelete.value.id);

    snackbarText.value = "Eliminando ...";
    snackbarColor.value = 'info';
    snackbar.value = true;

    await unidadesStore.deleteUnidad(itemToDelete.value.id);

    if (!unidadesStore.error) {
        snackbarText.value = "Dato Eliminado con exito!";
        snackbarColor.value = 'success';
        snackbar.value = false;

        deleteDialog.value = false;
    } else {
        snackbarText.value = 'Error al eliminar el dato';
        snackbarColor.value = 'error';
    }
}


// function addItem(item) {
//     console.log('Agregando a:', item);
// }

//Guardar el nuevo ítem
async function confirmAddItem() {
    if (!formValid.value) return;

    snackbarText.value = isEditMode.value ? 'Actualizando...' : 'Guardando...';
    snackbarColor.value = 'info';
    snackbar.value = true;

    // Extraer solo IDs de dependenciasFuncionales
    const dependenciasIds = Array.isArray(formData.value.dependenciasFuncionales)
        ? formData.value.dependenciasFuncionales.map(d => 
            typeof d === 'object' ? d.id : d
          )
        : [];

    const dataForm = {
        nombre: formData.value.nombre,
        codigo: formData.value.codigo,
        resCreacion: formData.value.resCreacion,
        objetivo: formData.value.objetivo,
        fecCreacion: formData.value.fecCreacion,
        relacion: formData.value.relacion,
        relInterno: formData.value.relInterno,
        relExterno: formData.value.relExterno,
        funciones: formData.value.funciones,
        dependenciasFuncionales: dependenciasIds, //  Solo IDs
        oficial: formData.value.oficial,
        tipo: formData.value.tipo,
        nivel: formData.value.nivel,
        parentId: selectedItem.value.parent
    };

    if (isEditMode.value) {
        await unidadesStore.updateUnidad(selectedItem.value.id, dataForm);
    } else {
        dataForm.parentId = selectedItem.value.id;
        if (selectedItem.value.oficial === false) {
            dataForm.oficial = false;
        }
        await unidadesStore.createUnidad(dataForm);
    }

    if (!unidadesStore.error) {
        snackbarText.value = isEditMode.value ? '¡Actualizado con éxito!' : '¡Guardado exitoso!';
        snackbarColor.value = 'success';
        addDialog.value = false;
    } else {
        snackbarText.value = 'Error al guardar';
        snackbarColor.value = 'error';
    }
}

// PARA MODAL FORM
// creo las variables para los datos introducidos por el usuario
const formData = ref({
    nombre: "",
    codigo: "",
    resCreacion: "",
    objetivo: "",
    fecCreacion: "",
    relacion: null,
    relInterno: "",
    relExterno: "",
    funciones: "",
    dependenciasFuncionales: null,
    tipo: null,
    nivel: null
});


// limpiamos el formulario desde esta funcion que abre mi MODAL
function openAddDialog(item) {
    isEditMode.value = false;
    selectedItem.value = item;
    // Si el padre no es oficial, deshabilitar el switch y poner en false
    const padreNoOficial = item?.oficial === false;
    //reset a mi formulario
    formData.value.nombre = "";
    formData.value.codigo = "";
    formData.value.resCreacion = "";
    formData.value.objetivo = "";
    formData.value.relExterno = "";
    formData.value.relInterno = "";
    formData.value.funciones = "";
    formData.value.fecCreacion = "";

    formData.value.dependenciasFuncionales = [];
    //nodo oficial - validacion padre no oficial
    formData.value.oficial = padreNoOficial ? false : true;
    formData.value.relacion = null;
    formData.value.tipo = null;
    formData.value.nivel = null;
    addDialog.value = true;
}


</script>

<template>
    <!-- Indicador de carga -->


    <v-container>
        <h1 class="text-h4 mb-4">Estructura jerárquica de Unidades UMSA</h1>


        <!-- Efecto CARGANDO -->
        <v-progress-linear v-if="unidadesStore.loading" indeterminate color="primary" class="mb-4" />
        <!-- Mostrado de errores en el fetch -->
        <v-alert v-if="unidadesStore.error" type="error" class="mb-4">{{ unidadesStore.error }}</v-alert>

        <v-card v-if="treeItems.length">
            <v-card-text>
                <v-treeview :items="treeItems" item-title="nombre" item-value="id" item-children="children" activatable
                    open-all density="comfortable" color="primary">
                    <!-- Aqui se selecciona el icono -->
                    <template #prepend="{ item }">
                        <v-icon color="primary">
                            {{ item.children.length ? 'mdi-folder' : 'mdi-file' }}
                        </v-icon>
                    </template>

                    <!-- Aqui estaran mis acciones -->
                    <template #append="{ item }">
                        <span class="text-caption text-grey-darken-1">
                            {{ item.dependencia ? `(${item.dependencia})` : '' }}
                        </span>
                        <v-icon small class="mr-2 ml-2" @click="openAddDialog(item)">
                            mdi-plus-box
                        </v-icon>
                        <v-icon small @click="editItem(item)">
                            mdi-pencil
                        </v-icon>
                        <v-icon small @click="deleteItem(item)">
                            mdi-delete
                        </v-icon>
                    </template>
                </v-treeview>
            </v-card-text>
        </v-card>
    </v-container>
    <!--Modal agregar nuevo ítem -->
    <v-dialog v-model="addDialog" max-width="900px">
        <v-card>
            <v-card-title class="text-h6">
                {{ isEditMode ? 'Editar' : 'Agregar item a' }}:
                <strong class="text-primary">{{ selectedItem?.nombre }}</strong>
            </v-card-title>
            <v-card-subtitle>
                Manual de Organización de funciones
            </v-card-subtitle>
            <v-divider></v-divider>
            <v-card-text>
                <v-form v-model="formValid">
                    <v-container>
                        <v-row>
                            <v-col cols="12" md="6" sm="6">
                                <v-text-field v-model="formData.nombre" label="Nombre"
                                    :rules="[rules.required, rules.minLength(4)]" variant="underlined"></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6" sm="6">
                                <v-text-field v-model="formData.codigo" label="Código"
                                    :rules="[rules.codigo, rules.minLength(4)]" variant="underlined"></v-text-field>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" md="6" sm="6">
                                <v-text-field v-model="formData.resCreacion" label="Nro de Resolución"
                                    :rules="[rules.required, rules.minLength(6)]" variant="underlined"></v-text-field>
                            </v-col>
                            <v-col cols="12" md="6" sm="6">
                                <!-- <v-date-picker v-model="formData.fecCreacion" label="Fecha de creación"
                                    :rules="[rules.required]" variant="underlined">
                                </v-date-picker> -->
                                <v-date-input v-model="formData.fecCreacion" label="Fecha de Creación"
                                    variant="underlined" :rules="[rules.required]" clearable></v-date-input>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" md="12" sm="12">
                                <v-textarea v-model="formData.objetivo" label="Objetivo"
                                    :rules="[rules.required, rules.minLength(6)]" variant="underlined" rows="2"
                                    auto-grow clearable></v-textarea>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" md="12" sm="12">
                                <v-textarea v-model="formData.funciones" label="Funciones"
                                    :rules="[rules.required, rules.minLength(6)]" variant="underlined" rows="2"
                                    auto-grow clearable>
                                </v-textarea>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" md="12" sm="12">
                                <v-textarea v-model="formData.relExterno" label="Relaciones externas"
                                    :rules="[rules.required, rules.minLength(6)]" variant="underlined" rows="2"
                                    auto-grow clearable>
                                </v-textarea>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" md="12" sm="12">
                                <v-textarea v-model="formData.relInterno" label="Relaciones internas"
                                    :rules="[rules.required, rules.minLength(6)]" variant="underlined" rows="2"
                                    auto-grow clearable>
                                </v-textarea>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" md="12" sm="12">
                                <SelectAllUnidades type="autocomplete" label="Dependencias Funcionales"
                                    v-model="formData.dependenciasFuncionales" :exclude-id="selectedItem?.id" :rules="[rules.required]" />
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12" md="5" sm="5">
                                <!-- <v-select v-model="formData.tipo" label="Tipo" :rules="[rules.required]"
                                    :items="tiposStore.tipos" item-title="description" item-value="value"
                                    variant="underlined"></v-select> -->
                                <SelectAllTipos v-model="formData.tipo" :rules="[rules.required]" />
                            </v-col>
                            <v-col cols="12" md="4" sm="4">
                                <!-- <v-select v-model="formData.nivel" label="Niveles" required :rules="[rules.required]"
                                    :items="NivelesStore.niveles" item-title="description" item-value="value"
                                    variant="underlined"></v-select> -->
                                <SelectAllNiveles v-model="formData.nivel" :rules="[rules.required]" />
                            </v-col>
                            <v-col cols="12" md="3" sm="3">
                                <SelectAllRelaciones v-model="formData.relacion" :rules="[rules.required]" />
                            </v-col>
                        </v-row>
                        <v-row justify="end">
                            <v-col cols="auto" class="d-flex align-center">
                                <span :class="formData.oficial ? '' : 'text-red-lighten-2'" class="me-2">
                                    {{ formData.oficial ? 'UNIDAD OFICIAL' : 'UNIDAD NO OFICIAL' }}
                                </span>
                                <v-switch v-model="formData.oficial" :color="formData.oficial ? 'primary' : ''"
                                    :base-color="formData.oficial ? '' : 'red-lighten-2'"
                                    :disabled="!isEditMode && selectedItem?.oficial === false" hide-details inset />
                            </v-col>
                        </v-row>
                    </v-container>
                    <v-row v-if="!isEditMode && selectedItem?.oficial === false">
                        <v-col cols="12">
                            <v-alert type="info" density="compact">
                                El padre es una unidad NO OFICIAL, por lo tanto este hijo también será NO OFICIAL
                            </v-alert>
                        </v-col>
                    </v-row>
                </v-form>

            </v-card-text>

            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="addDialog = false">Cancelar</v-btn>
                <v-btn color="primary" :disabled="!formValid || unidadesStore.loading" :loading="unidadesStore.loading"
                    @click="confirmAddItem">Guardar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
    <!-- Confirmacion para eliminar dato -->
    <v-dialog v-model="deleteDialog" max-width="400px">
        <v-card>
            <v-card-title class="text-h6">¿Confirma Eliminar?</v-card-title>
            <v-card-text>¿Ud esta seguro de eliminar <strong>{{ itemToDelete?.nombre }}</strong>?</v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn text @click="deleteDialog = false">Cancelar</v-btn>
                <v-btn color="error" @click="confirmDelete" :disabled="unidadesStore.loading"
                    :loading="unidadesStore.loading">Eliminar</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>

    <v-snackbar v-model="snackbar" :color="snackbarColor" :timeout="3000">
        {{ snackbarText }}
    </v-snackbar>
</template>

<style scoped>
.v-treeview-node__root {
    padding: 4px 0;
}
</style>


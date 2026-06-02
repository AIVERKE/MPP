<template>
  <div>
    <h1 class="text-h4 mb-4">Gestión de Usuarios</h1>
    
    <v-card>
      <v-card-title>
        <v-text-field
          v-model="search"
          append-icon="mdi-magnify"
          label="Buscar"
          single-line
          hide-details
        ></v-text-field>
        <v-spacer></v-spacer>
        <v-btn color="primary" prepend-icon="mdi-plus">
          Nuevo Usuario
        </v-btn>
      </v-card-title>

      <v-data-table
        :headers="headers"
        :items="usuarios"
        :search="search"
        class="elevation-1"
      >
        <template v-slot:item.actions="{ item }">
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

<script setup>
import { ref } from 'vue'

const search = ref('')

const headers = [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre' },
  { title: 'Email', key: 'email' },
  { title: 'Rol', key: 'rol' },
  { title: 'Estado', key: 'estado' },
  { title: 'Acciones', key: 'actions', sortable: false }
]

const usuarios = ref([
  { id: 1, nombre: 'Juan Pérez', email: 'juan@example.com', rol: 'Admin', estado: 'Activo' },
  { id: 2, nombre: 'María García', email: 'maria@example.com', rol: 'Usuario', estado: 'Activo' },
  { id: 3, nombre: 'Pedro López', email: 'pedro@example.com', rol: 'Usuario', estado: 'Inactivo' }
])

const editItem = (item) => {
  console.log('Editar:', item)
}

const deleteItem = (item) => {
  console.log('Eliminar:', item)
}
</script>
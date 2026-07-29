<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDisplay } from 'vuetify'
import { useAuthStore } from '@/stores/auth'
import { useUsuariosStore } from '@/stores/usuarios'

const authStore = useAuthStore()
const usuariosStore = useUsuariosStore()
const { smAndDown, xs } = useDisplay()

const search = ref('')
const dialog = ref(false)
const deleteDialog = ref(false)
const selectedUser = ref(null)
const saving = ref(false)
const togglingId = ref(null)
const snackbar = ref({ show: false, text: '', color: 'success' })

const isAdmin = computed(() => authStore.user?.rol === 'Administrador')

const headers = computed(() => {
  if (smAndDown.value) {
    return [
      { title: 'USUARIO', key: 'username', align: 'start' },
      { title: 'ESTADO', key: 'activo' },
      { title: 'ACCIONES', key: 'actions', sortable: false, align: 'center' },
    ]
  }
  return [
    { title: 'USUARIO', key: 'username', align: 'start' },
    { title: 'CORREO ELECTRÓNICO', key: 'correo' },
    { title: 'ROLES', key: 'roles' },
    { title: 'ESTADO', key: 'activo' },
    { title: 'ACCIONES', key: 'actions', sortable: false, align: 'center' },
  ]
})

const dialogMaxWidth = computed(() => (smAndDown.value ? '90vw' : '560px'))

const form = ref({
  username: '',
  correo: '',
  password: '',
  roles: [],
  activo: true,
})

const formValid = computed(() => {
  if (!form.value.username?.trim() || !form.value.correo?.trim()) return false
  if (!form.value.roles?.length) return false
  if (!selectedUser.value && (!form.value.password || form.value.password.length < 6)) {
    return false
  }
  if (selectedUser.value && form.value.password && form.value.password.length < 6) {
    return false
  }
  return true
})

function showMessage(text, color = 'success') {
  snackbar.value = { show: true, text, color }
}

function initials(username) {
  if (!username) return '?'
  return username.slice(0, 2).toUpperCase()
}

function openUserDialog(item = null) {
  if (item) {
    selectedUser.value = item
    form.value = {
      username: item.username,
      correo: item.correo,
      password: '',
      roles: (item.roles || []).map((r) => r.id_rol),
      activo: item.activo !== false,
    }
  } else {
    selectedUser.value = null
    form.value = {
      username: '',
      correo: '',
      password: '',
      roles: [],
      activo: true,
    }
  }
  dialog.value = true
}

function confirmDelete(item) {
  selectedUser.value = item
  deleteDialog.value = true
}

async function handleSave() {
  if (!formValid.value) return
  saving.value = true
  try {
    const payload = {
      username: form.value.username.trim(),
      correo: form.value.correo.trim(),
      roles: form.value.roles,
      activo: form.value.activo,
    }
    if (form.value.password) {
      payload.password = form.value.password
    }

    if (selectedUser.value) {
      await usuariosStore.updateUsuario(selectedUser.value.id_usuario, payload)
      showMessage('Usuario actualizado correctamente')
    } else {
      await usuariosStore.createUsuario(payload)
      showMessage('Usuario creado correctamente')
    }
    dialog.value = false
  } catch (err) {
    const msg =
      err.response?.data?.message ||
      (Array.isArray(err.response?.data?.message)
        ? err.response.data.message.join(', ')
        : null) ||
      'Error al guardar usuario'
    showMessage(Array.isArray(msg) ? msg.join(', ') : msg, 'error')
  } finally {
    saving.value = false
  }
}

async function handleDelete() {
  if (!selectedUser.value) return
  saving.value = true
  try {
    await usuariosStore.deleteUsuario(selectedUser.value.id_usuario)
    showMessage('Usuario dado de baja correctamente')
    deleteDialog.value = false
  } catch (err) {
    showMessage(
      err.response?.data?.message || 'Error al eliminar usuario',
      'error',
    )
  } finally {
    saving.value = false
  }
}

async function handleToggleEstado(item) {
  togglingId.value = item.id_usuario
  try {
    await usuariosStore.updateEstado(item.id_usuario, !item.activo)
    showMessage(
      `Usuario ${!item.activo ? 'activado' : 'desactivado'} correctamente`,
    )
  } catch (err) {
    showMessage(
      err.response?.data?.message || 'Error al cambiar estado',
      'error',
    )
  } finally {
    togglingId.value = null
  }
}

onMounted(async () => {
  if (!isAdmin.value) return
  try {
    await Promise.all([
      usuariosStore.fetchUsuarios(),
      usuariosStore.fetchRoles(),
    ])
  } catch (err) {
    showMessage(
      err.response?.data?.message || 'Error al cargar datos',
      'error',
    )
  }
})
</script>

<template>
  <v-container fluid class="pa-0">
    <!-- Acceso denegado -->
    <v-alert
      v-if="!isAdmin"
      type="warning"
      variant="tonal"
      class="rounded-lg"
      title="Acceso restringido"
      text="Solo el rol Administrador puede gestionar usuarios del sistema."
    />

    <template v-else>
      <!-- Header & Breadcrumb -->
      <div class="mb-6">
        <h1 class="text-h4 font-weight-black mb-1 text-slate-800">
          Gestión de Usuarios
        </h1>
        <div class="text-body-2 d-flex align-center text-slate-500">
          <v-icon size="18" class="mr-2">mdi-account-group</v-icon>
          <span>Seguridad</span>
          <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
          <span class="font-weight-bold text-primary">Usuarios</span>
        </div>
      </div>

      <!-- Main Card -->
      <v-card class="rounded-xl border-0 shadow-sm" elevation="3">
        <v-card-title class="pa-5 d-flex align-center flex-wrap gap-4">
          <v-text-field
            v-model="search"
            prepend-inner-icon="mdi-magnify"
            label="Buscar por usuario, correo o rol..."
            variant="outlined"
            density="compact"
            hide-details
            class="max-width-400"
            clearable
          />

          <v-spacer />

          <v-btn
            color="primary"
            :prepend-icon="xs ? undefined : 'mdi-plus'"
            :icon="xs ? 'mdi-plus' : undefined"
            class="rounded-lg font-weight-bold"
            @click="openUserDialog()"
          >
            <template v-if="!xs">Nuevo Usuario</template>
            <v-tooltip activator="parent" location="top">
              Registrar un nuevo usuario en el sistema
            </v-tooltip>
          </v-btn>
        </v-card-title>

        <v-divider />

        <div class="table-scroll">
          <v-data-table
            :headers="headers"
            :items="usuariosStore.usuarios"
            :search="search"
            :loading="usuariosStore.loading"
            hover
            density="comfortable"
            class="bg-transparent"
          >
            <template #item.username="{ item }">
              <div class="d-flex align-center py-2">
                <v-avatar color="indigo-lighten-4" size="32" class="mr-3">
                  <span class="text-indigo-darken-3 text-caption font-weight-bold">
                    {{ initials(item.username) }}
                  </span>
                </v-avatar>
                <span class="font-weight-bold text-slate-800">{{ item.username }}</span>
              </div>
            </template>

            <template #item.roles="{ item }">
              <div class="d-flex flex-wrap ga-1">
                <v-chip
                  v-for="rol in item.roles || []"
                  :key="rol.id_rol"
                  size="x-small"
                  label
                  variant="tonal"
                  :color="rol.nombre === 'Administrador' ? 'deep-purple' : 'primary'"
                  class="font-weight-black"
                >
                  {{ rol.nombre }}
                </v-chip>
                <span v-if="!(item.roles || []).length" class="text-grey">—</span>
              </div>
            </template>

            <template #item.activo="{ item }">
              <div class="d-flex align-center ga-2">
                <v-switch
                  :model-value="item.activo"
                  color="success"
                  density="compact"
                  hide-details
                  :loading="togglingId === item.id_usuario"
                  :disabled="togglingId === item.id_usuario"
                  @update:model-value="handleToggleEstado(item)"
                />
                <v-chip
                  size="x-small"
                  :color="item.activo ? 'success' : 'grey-darken-1'"
                  variant="flat"
                  class="font-weight-bold"
                >
                  {{ item.activo ? 'ACTIVO' : 'INACTIVO' }}
                </v-chip>
              </div>
            </template>

            <template #item.actions="{ item }">
              <div class="d-flex justify-center gap-1">
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="orange-darken-2"
                  @click="openUserDialog(item)"
                >
                  <v-icon size="20">mdi-pencil</v-icon>
                  <v-tooltip activator="parent" location="top">
                    Editar perfil de usuario
                  </v-tooltip>
                </v-btn>
                <v-btn
                  icon
                  variant="text"
                  size="small"
                  color="error"
                  @click="confirmDelete(item)"
                >
                  <v-icon size="20">mdi-delete</v-icon>
                  <v-tooltip activator="parent" location="top">
                    Dar de baja al usuario
                  </v-tooltip>
                </v-btn>
              </div>
            </template>
          </v-data-table>
        </div>
      </v-card>

      <!-- Modal: Crear/Editar Usuario -->
      <v-dialog v-model="dialog" :max-width="dialogMaxWidth" persistent>
        <v-card class="rounded-xl pa-2">
          <v-card-title class="text-h6 font-weight-black pa-4">
            {{ selectedUser ? 'Actualizar' : 'Registrar' }} Usuario
          </v-card-title>
          <v-divider />
          <v-card-text class="pa-4 pt-6">
            <v-row dense>
              <v-col cols="12">
                <v-text-field
                  v-model="form.username"
                  label="Nombre de usuario"
                  variant="outlined"
                  prepend-inner-icon="mdi-account"
                  class="mb-2"
                  :disabled="!!selectedUser"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.correo"
                  label="Correo institucional"
                  type="email"
                  variant="outlined"
                  prepend-inner-icon="mdi-email"
                  class="mb-2"
                />
              </v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="form.password"
                  :label="selectedUser ? 'Nueva contraseña (opcional)' : 'Contraseña'"
                  type="password"
                  variant="outlined"
                  prepend-inner-icon="mdi-lock"
                  class="mb-2"
                  :hint="selectedUser ? 'Dejar vacío para no cambiar' : 'Mínimo 6 caracteres'"
                  persistent-hint
                />
              </v-col>
              <v-col cols="12" md="8">
                <v-select
                  v-model="form.roles"
                  :items="usuariosStore.roles"
                  item-title="nombre"
                  item-value="id_rol"
                  label="Roles de sistema"
                  variant="outlined"
                  multiple
                  chips
                  closable-chips
                />
              </v-col>
              <v-col cols="12" md="4">
                <v-select
                  v-model="form.activo"
                  :items="[
                    { title: 'Activo', value: true },
                    { title: 'Inactivo', value: false },
                  ]"
                  label="Estado"
                  variant="outlined"
                />
              </v-col>
            </v-row>
          </v-card-text>
          <v-card-actions class="pa-4">
            <v-spacer />
            <v-btn
              variant="text"
              class="font-weight-bold"
              :disabled="saving"
              @click="dialog = false"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="primary"
              variant="elevated"
              class="rounded-lg px-6"
              :loading="saving"
              :disabled="!formValid"
              @click="handleSave"
            >
              {{ selectedUser ? 'Guardar Cambios' : 'Crear Usuario' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>

      <!-- Modal: Confirmar Eliminación -->
      <v-dialog v-model="deleteDialog" :max-width="smAndDown ? '90vw' : '400px'">
        <v-card class="rounded-xl text-center pa-4">
          <v-card-text>
            <v-icon color="error" size="64" class="mb-4">mdi-alert-circle-outline</v-icon>
            <div class="text-h6 font-weight-black mb-2">¿Confirmar baja?</div>
            <p class="text-body-2 text-grey-darken-1">
              Estás a punto de dar de baja al usuario
              <strong>{{ selectedUser?.username }}</strong>.
              Esta acción aplica borrado lógico e impedirá su acceso al sistema.
            </p>
          </v-card-text>
          <v-card-actions class="justify-center gap-2">
            <v-btn
              variant="tonal"
              class="rounded-lg"
              :disabled="saving"
              @click="deleteDialog = false"
            >
              Cancelar
            </v-btn>
            <v-btn
              color="error"
              variant="elevated"
              class="rounded-lg px-6"
              :loading="saving"
              @click="handleDelete"
            >
              Dar de baja
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-dialog>
    </template>

    <v-snackbar v-model="snackbar.show" :color="snackbar.color" timeout="3500">
      {{ snackbar.text }}
    </v-snackbar>
  </v-container>
</template>

<style scoped>
.max-width-400 {
  max-width: 400px;
  width: 100%;
}
.shadow-sm {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05) !important;
}
.table-scroll {
  width: 100%;
  overflow-x: auto;
}
</style>

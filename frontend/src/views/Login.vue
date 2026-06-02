<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { rules } from '../utils/rules'

const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const showPassword = ref(false)
const valid = ref(false)
const loading = ref(false)

const handleLogin = async () => {
  if (!valid.value) return
  
  loading.value = true
  // Simulamos un pequeño delay para que se vea el efecto de carga
  setTimeout(() => {
    authStore.login({ username: username.value })
    loading.value = false
  }, 1000)
}
</script>

<template>
  <v-container fluid class="fill-height login-bg">
    <v-row no-gutters align="center" justify="center">
      <v-col cols="12" sm="8" md="4" lg="3">
        <v-card elevation="12" class="pa-4 rounded-xl">
          <v-card-text class="text-center pt-8">
            <v-icon color="primary" size="64" class="mb-4">mdi-view-dashboard</v-icon>
            <h1 class="text-h4 font-weight-bold mb-2" style="color: #1E293B;">Bienvenido</h1>
            <p class="text-body-1 mb-8" style="color: #64748B;">S-MAU Dashboard Administrativo</p>
            
            <v-form v-model="valid" @submit.prevent="handleLogin">
              <v-text-field
                v-model="username"
                label="Usuario o Email"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                class="mb-2"
                :rules="[rules.required]"
                required
              ></v-text-field>

              <v-text-field
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                label="Contraseña"
                prepend-inner-icon="mdi-lock"
                :append-inner-icon="showPassword ? 'mdi-eye' : 'mdi-eye-off'"
                @click:append-inner="showPassword = !showPassword"
                variant="outlined"
                class="mb-4"
                :rules="[rules.required, rules.minLength(4)]"
                required
              ></v-text-field>

              <v-btn
                type="submit"
                color="primary"
                size="large"
                block
                rounded="lg"
                class="font-weight-bold py-4"
                :loading="loading"
                :disabled="!valid"
                elevation="2"
              >
                Iniciar Sesión
              </v-btn>
            </v-form>

            <div class="mt-8 text-center">
              <a href="#" class="text-decoration-none text-body-2 font-weight-medium" style="color: #6366F1;">
                ¿Olvidaste tu contraseña?
              </a>
            </div>
          </v-card-text>
        </v-card>
        
        <p class="text-center mt-6 text-body-2" style="color: #94A3B8;">
          © 2026 UMSA - S-MAU. Todos los derechos reservados.
        </p>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.login-bg {
  background: linear-gradient(135deg, #6366F1 0%, #4F46E5 100%);
  min-height: 100vh;
}

.rounded-xl {
  border-radius: 24px !important;
}

/* Animación suave para el hover del botón */
.v-btn {
  text-transform: none;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.v-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4) !important;
}
</style>

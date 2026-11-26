<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

function safeRedirectTarget(redirect) {
  if (typeof redirect !== 'string') return null;
  if (!redirect.startsWith('/') || redirect.startsWith('//')) return null;
  return redirect;
}

const username = ref('');
const password = ref('');
const showPassword = ref(false);
const loading = ref(false);
const error = ref('');
const formValid = ref(false);

const handleLogin = async () => {
  if (!username.value || !password.value) {
    error.value = 'Por favor ingrese su usuario y contraseña';
    return;
  }

  loading.value = true;
  error.value = '';

  try {
    await authStore.login(username.value, password.value);
    const destino = safeRedirectTarget(route.query.redirect);
    router.push(destino || '/');
  } catch (err) {
    error.value = err.message || 'Usuario o contraseña incorrectos';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container fluid class="fill-height pa-0 login-wrapper">
    <v-row no-gutters class="fill-height align-center justify-center">
      <v-col cols="12" sm="10" md="10" lg="8" xl="6" class="pa-4 pa-sm-6">
        <v-card elevation="16" class="rounded-xl overflow-hidden login-card">
          <v-row no-gutters>
            <!-- Columna izquierda: branding institucional MPP (desktop) -->
            <v-col
              cols="12"
              md="6"
              class="login-banner d-none d-md-flex flex-column justify-space-between pa-10 text-white"
            >
              <div>
                <div class="d-flex align-center gap-3 mb-6">
                  <v-avatar color="white" size="56" class="elevation-3">
                    <v-icon size="34" color="#1A4756">mdi-file-document-multiple</v-icon>
                  </v-avatar>
                  <div>
                    <h1 class="text-h3 font-weight-black tracking-tight text-white mb-0">
                      MPP
                    </h1>
                    <span class="text-caption font-weight-bold text-teal-lighten-4 text-uppercase tracking-wider">
                      Plataforma Institucional
                    </span>
                  </div>
                </div>

                <h2 class="text-h5 font-weight-bold text-white mb-3 leading-snug">
                  Manual de Procesos y Procedimientos
                </h2>
                <p class="text-body-2 text-blue-grey-lighten-4 mb-6 leading-relaxed">
                  Sistema centralizado para la gestión, estandarización y auditoría de procesos organizacionales de la Universidad Mayor de San Andrés.
                </p>

                <div class="d-flex flex-wrap gap-2 mb-4">
                  <v-chip size="x-small" color="teal-lighten-4" variant="outlined" class="font-weight-medium">
                    <v-icon start size="12">mdi-sitemap</v-icon>Procesos
                  </v-chip>
                  <v-chip size="x-small" color="teal-lighten-4" variant="outlined" class="font-weight-medium">
                    <v-icon start size="12">mdi-file-document-outline</v-icon>Procedimientos
                  </v-chip>
                  <v-chip size="x-small" color="teal-lighten-4" variant="outlined" class="font-weight-medium">
                    <v-icon start size="12">mdi-chart-timeline-variant</v-icon>Flujogramas
                  </v-chip>
                </div>
              </div>

              <div class="pt-6 border-petroleo-light">
                <div class="text-caption text-blue-grey-lighten-3 font-weight-medium">
                  © 2026 Universidad Mayor de San Andrés - UMSA
                </div>
              </div>
            </v-col>

            <!-- Columna derecha: formulario -->
            <v-col
              cols="12"
              md="6"
              class="pa-6 pa-sm-10 d-flex flex-column justify-space-between bg-surface"
            >
              <div class="d-md-none text-center mb-6">
                <v-avatar color="#1A4756" size="64" class="mb-3 elevation-3">
                  <v-icon size="36" color="white">mdi-file-document-multiple</v-icon>
                </v-avatar>
                <h1 class="text-h3 font-weight-black text-petroleo mb-0">MPP</h1>
                <div class="text-subtitle-1 font-weight-bold text-grey-darken-3 mt-1">
                  Manual de Procesos y Procedimientos
                </div>
                <div class="text-caption text-grey font-weight-medium">Universidad Mayor de San Andrés</div>
              </div>

              <div class="d-none d-md-block mb-6">
                <h3 class="text-h5 font-weight-black text-petroleo mb-1">
                  Iniciar Sesión
                </h3>
                <p class="text-body-2 text-grey-darken-1">
                  Ingrese sus credenciales para acceder
                </p>
              </div>

              <div class="my-auto py-2">
                <v-fade-transition>
                  <v-alert
                    v-if="error"
                    type="error"
                    variant="tonal"
                    density="comfortable"
                    closable
                    class="mb-5 rounded-lg text-body-2 font-weight-medium"
                    prepend-icon="mdi-alert-circle"
                    @click:close="error = ''"
                  >
                    {{ error }}
                  </v-alert>
                </v-fade-transition>

                <v-form
                  v-model="formValid"
                  class="w-100"
                  @submit.prevent="handleLogin"
                >
                  <v-text-field
                    v-model="username"
                    label="Usuario"
                    prepend-inner-icon="mdi-account-outline"
                    variant="outlined"
                    density="comfortable"
                    class="mb-4"
                    :disabled="loading"
                    :rules="[v => !!v || 'El usuario es requerido']"
                    autocomplete="username"
                  />

                  <v-text-field
                    v-model="password"
                    label="Contraseña"
                    prepend-inner-icon="mdi-lock-outline"
                    :type="showPassword ? 'text' : 'password'"
                    :append-inner-icon="showPassword ? 'mdi-eye-off-outline' : 'mdi-eye-outline'"
                    variant="outlined"
                    density="comfortable"
                    class="mb-6"
                    :disabled="loading"
                    :rules="[v => !!v || 'La contraseña es requerida']"
                    autocomplete="current-password"
                    @click:append-inner="showPassword = !showPassword"
                  />

                  <v-btn
                    type="submit"
                    size="large"
                    block
                    :loading="loading"
                    :disabled="loading || !formValid"
                    elevation="3"
                    class="login-submit-btn rounded-lg text-button font-weight-bold py-6 text-none"
                  >
                    <template #loader>
                      <v-progress-circular
                        indeterminate
                        color="white"
                        size="24"
                      />
                      <span class="ml-3">Verificando...</span>
                    </template>
                    INGRESAR AL SISTEMA
                  </v-btn>
                </v-form>
              </div>

              <div class="mt-8 text-center border-t pt-4">
                <div class="text-caption font-weight-medium text-grey-darken-1">
                  MPP v1.0.0
                </div>
                <div class="d-md-none text-caption text-grey mt-1 font-weight-medium">
                  © 2026 Universidad Mayor de San Andrés
                </div>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.login-wrapper {
  min-height: 100vh;
  background: radial-gradient(circle at 15% 20%, rgba(2, 129, 145, 0.22) 0%, transparent 45%),
              radial-gradient(circle at 85% 80%, rgba(60, 104, 147, 0.18) 0%, transparent 50%),
              linear-gradient(135deg, #07151c 0%, #0c232b 50%, #102d38 100%);
}

.login-card {
  border: 1px solid rgba(60, 104, 147, 0.25) !important;
  box-shadow: 0 25px 60px -15px rgba(5, 15, 20, 0.6) !important;
  backdrop-filter: blur(8px);
}

.login-banner {
  background: linear-gradient(145deg, #091a21 0%, #0f2d37 40%, #1a4756 100%);
  position: relative;
  overflow: hidden;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.login-banner::before {
  content: '';
  position: absolute;
  top: -40%;
  right: -40%;
  width: 180%;
  height: 180%;
  background: radial-gradient(circle, rgba(2, 129, 145, 0.22) 0%, rgba(60, 104, 147, 0.08) 40%, transparent 70%);
  pointer-events: none;
}

.login-banner::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(2, 129, 145, 0.4), transparent);
  pointer-events: none;
}

.login-banner h1,
.login-banner h2,
.login-banner h3 {
  color: #ffffff !important;
}

.login-banner p {
  color: rgba(255, 255, 255, 0.92) !important;
}

.login-submit-btn {
  background: linear-gradient(135deg, #1a4756 0%, #028191 100%) !important;
  color: #ffffff !important;
  letter-spacing: 0.5px;
  transition: all 0.25s ease-in-out;
}

.login-submit-btn:hover {
  background: linear-gradient(135deg, #0c232b 0%, #028191 100%) !important;
  box-shadow: 0 8px 20px -4px rgba(2, 129, 145, 0.45) !important;
  transform: translateY(-1px);
}

.text-petroleo {
  color: #0c232b !important;
}

.border-petroleo-light {
  border-top: 1px solid rgba(255, 255, 255, 0.15) !important;
}

.gap-2 {
  gap: 8px;
}

.gap-3 {
  gap: 12px;
}
</style>

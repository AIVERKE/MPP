<template>
  <div>
    <!-- Breadcrumb -->
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-2" style="color: #1E293B;">Dashboard</h1>
      <div class="text-body-2" style="color: #64748B;">
        <span>Dashboard</span>
        <v-icon size="16" class="mx-1">mdi-chevron-right</v-icon>
        <span>Correspondencia</span>
      </div>
    </div>
    
    <!-- Tarjetas de estadísticas con estilo moderno -->
    <v-row>
      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div 
                class="icon-wrapper" 
                style="background: linear-gradient(135deg, #667EEA 0%, #764BA2 100%);"
              >
                <v-icon color="white" size="24">mdi-account-multiple</v-icon>
              </div>
              <v-chip size="small" color="success" variant="tonal">
                <v-icon start size="16">mdi-arrow-up</v-icon>
                +23%
              </v-chip>
            </div>
            <div class="text-h4 font-weight-bold mb-1" style="color: #1E293B;">
              1,234
            </div>
            <div class="text-body-2" style="color: #64748B;">
              Total Usuarios
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div 
                class="icon-wrapper" 
                style="background: linear-gradient(135deg, #F093FB 0%, #F5576C 100%);"
              >
                <v-icon color="white" size="24">mdi-currency-usd</v-icon>
              </div>
              <v-chip size="small" color="success" variant="tonal">
                <v-icon start size="16">mdi-arrow-up</v-icon>
                +18%
              </v-chip>
            </div>
            <div class="text-h4 font-weight-bold mb-1" style="color: #1E293B;">
              45678
            </div>
            <div class="text-body-2" style="color: #64748B;">
              Total correspondencia
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div 
                class="icon-wrapper" 
                style="background: linear-gradient(135deg, #4FACFE 0%, #00F2FE 100%);"
              >
                <v-icon color="white" size="24">mdi-package-variant</v-icon>
              </div>
              <v-chip size="small" color="error" variant="tonal">
                <v-icon start size="16">mdi-arrow-down</v-icon>
                -5%
              </v-chip>
            </div>
            <div class="text-h4 font-weight-bold mb-1" style="color: #1E293B;">
              567
            </div>
            <div class="text-body-2" style="color: #64748B;">
              Total tramites
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" sm="6" md="3">
        <v-card class="stat-card" elevation="0">
          <v-card-text class="pa-5">
            <div class="d-flex align-center justify-space-between mb-3">
              <div 
                class="icon-wrapper" 
                style="background: linear-gradient(135deg, #FA709A 0%, #FEE140 100%);"
              >
                <v-icon color="white" size="24">mdi-clock-alert</v-icon>
              </div>
              <v-chip size="small" color="warning" variant="tonal">
                <v-icon start size="16">mdi-arrow-up</v-icon>
                +12
              </v-chip>
            </div>
            <div class="text-h4 font-weight-bold mb-1" style="color: #1E293B;">
              23
            </div>
            <div class="text-body-2" style="color: #64748B;">
              Pendientes
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <!-- Gráfico o tabla reciente -->
    <v-row class="mt-4">
      <v-col cols="12" md="8">
        <v-card class="modern-card" elevation="0">
          <v-card-title class="pa-5 pb-3">
            <span class="text-h6 font-weight-bold" style="color: #1E293B;">
              Actividad Reciente
            </span>
          </v-card-title>
          <v-card-text class="pa-5 pt-0">
            <div class="text-center py-12" style="color: #94A3B8;">
              <v-icon size="64" color="#CBD5E1">mdi-chart-line</v-icon>
              <p class="mt-4">Gráfico de actividad próximamente</p>
            </div>
          </v-card-text>
        </v-card>
      </v-col>

      <v-col cols="12" md="4">
        <v-card class="modern-card" elevation="0">
          <v-card-title class="pa-5 pb-3">
            <span class="text-h6 font-weight-bold" style="color: #1E293B;">
              Trámites
            </span>
          </v-card-title>
          <v-card-text class="pa-5 pt-0">
            <v-list lines="two" density="compact">
              <v-list-item class="px-0">
                <template v-slot:prepend>
                  <v-avatar color="primary" size="40">
                    <v-icon color="white">mdi-check</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  Tarea completada
                </v-list-item-title>
                <v-list-item-subtitle>
                  Hace 2 horas
                </v-list-item-subtitle>
              </v-list-item>
              
              <v-list-item class="px-0">
                <template v-slot:prepend>
                  <v-avatar color="warning" size="40">
                    <v-icon color="white">mdi-clock</v-icon>
                  </v-avatar>
                </template>
                <v-list-item-title class="font-weight-medium">
                  Trámites pendientes
                </v-list-item-title>
                <v-list-item-subtitle>
                  Hace 5 horas
                </v-list-item-subtitle>
              </v-list-item>
            </v-list>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup>
</script>
<script setup>
import { useAuthStore } from './stores/auth';
import AppLayout from './components/layout/AppLayout.vue';

const authStore = useAuthStore();
</script>

<template>
  <v-app v-if="authStore.isAuthenticated">
    <app-layout />
  </v-app>
  <v-app v-else>
    <router-view />
  </v-app>
</template>

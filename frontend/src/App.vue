<script setup>
import { useAuthStore } from './stores/auth';
import AppLayout from './components/layout/AppLayout.vue';

const authStore = useAuthStore();
</script>

<template>
  <app-layout v-if="authStore.isAuthenticated" />
  <v-app v-else>
    <router-view />
  </v-app>
</template>

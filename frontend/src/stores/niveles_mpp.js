import { defineStore } from "pinia";
import { ref } from "vue";

export const useAllNivelesMppStore = defineStore(
  "niveles_mpp",
  () => {
    const niveles = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const API_URL = "https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/mof/niveles";

    const getFetchNiveles = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        niveles.value = data.data;
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    } 
    return {
      niveles,
      error,
      loading,
      getFetchNiveles
    }
  }
)

//Función para limpiar el estado
// function clearNiveles() {
//     niveles.value = []
//     error.value = null
//   }

// Getters computados
// const nivelesOptions = computed(() => {
//   return niveles.value.map(nivel => ({
//     title: nivel.description,
//     value: nivel.value
//   }))
// })

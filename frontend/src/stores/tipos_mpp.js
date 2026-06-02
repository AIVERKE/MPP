import { defineStore } from "pinia";
import { ref } from "vue";

export const useAllTiposMppStore = defineStore(
  "tipos_mpp",
  () => {
    const tipos = ref([]);
    const loading = ref(false);
    const error = ref(null);
    const API_URL = 'https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/mof/tipos';
    const getFetchTipos = async () => {
      loading.value = true;
      error.value = null;
      try {
        const response = await fetch(API_URL);
        const data = await response.json();
        tipos.value = data.data;
      } catch (err) {
        error.value = err.message;
      } finally {
        loading.value = false;
      }
    }
    return{
      tipos,
      loading,
      error,
      getFetchTipos
    }
  }
)


// const tiposOptions = computed(() => {
//     return tipos.value.map(tipo => ({
//       title: tipo.description,
//       value: tipo.value
//     }))
//   })

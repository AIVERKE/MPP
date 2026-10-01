import { defineStore } from "pinia";
import { ref } from "vue";
import { getMof, mofErrorMessage } from "./mof_api";

export const useAllTiposMofStore = defineStore(
  "tipos_mof",
  () => {
    const tipos = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const getFetchTipos = async () => {
      loading.value = true;
      error.value = null;
      try {
        tipos.value = await getMof("/catalogos/tipos");
      } catch (err) {
        error.value = mofErrorMessage(err);
      } finally {
        loading.value = false;
      }
    }

    return {
      tipos,
      loading,
      error,
      getFetchTipos,
    }
  }
)

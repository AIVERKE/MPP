import { defineStore } from "pinia";
import { ref } from "vue";
import { getMof, mofErrorMessage } from "./mof_api";

export const useAllNivelesMofStore = defineStore(
  "niveles_mof",
  () => {
    const niveles = ref([]);
    const loading = ref(false);
    const error = ref(null);

    const getFetchNiveles = async () => {
      loading.value = true;
      error.value = null;
      try {
        niveles.value = await getMof("/catalogos/niveles");
      } catch (err) {
        error.value = mofErrorMessage(err);
      } finally {
        loading.value = false;
      }
    }

    return {
      niveles,
      loading,
      error,
      getFetchNiveles,
    }
  }
)

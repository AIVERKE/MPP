import { defineStore } from "pinia";
import { ref } from "vue";
import { getMof, mofErrorMessage } from "./mof_api";

/**
 * Store de solo lectura de las Clases (Instancias) del MOF
 */
export const useAllClasesMofStore = defineStore(
    "clases_mof",
    () => {
        const clases = ref([]);
        const loading = ref(false);
        const error = ref(null);

        const getFetchClases = async () => {
            loading.value = true;
            error.value = null;
            try {
                clases.value = await getMof("/catalogos/clases");
            } catch (err) {
                error.value = mofErrorMessage(err);
            } finally {
                loading.value = false;
            }
        }

        return {
            clases,
            error,
            loading,
            getFetchClases,
        }
    }
);

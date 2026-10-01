import { defineStore } from "pinia";
import { ref } from "vue";
import { getMof, mofErrorMessage } from "./mof_api";

export const useAllRelacionesMofStore = defineStore(
    "relaciones_mof",
    () => {
        const relaciones = ref([]);
        const loading = ref(false);
        const error = ref(null);

        const getFetchRelaciones = async () => {
            loading.value = true;
            error.value = null;
            try {
                relaciones.value = await getMof("/catalogos/relaciones");
            } catch (err) {
                error.value = mofErrorMessage(err);
            } finally {
                loading.value = false;
            }
        }

        return {
            relaciones,
            loading,
            error,
            getFetchRelaciones,
        }
    }
);

import { defineStore } from "pinia";
import { ref } from "vue";
import { getMof, mofErrorMessage } from "./mof_api";

/**
 * Store de solo lectura del catálogo de cargos del Manual de Organización y Funciones (MOF)
 */
export const useAllCargosMofStore = defineStore(
    "cargos_mof",
    () => {
        const cargos = ref([]);
        const loading = ref(false);
        const error = ref(null);

        const getFetchCargos = async () => {
            loading.value = true;
            error.value = null;
            try {
                cargos.value = await getMof("/cargos-catalogo");
            } catch (err) {
                error.value = mofErrorMessage(err);
            } finally {
                loading.value = false;
            }
        }

        return {
            cargos,
            error,
            loading,
            getFetchCargos,
        }
    }
);

import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import { MOF_URL, getMof, mofErrorMessage } from "./mof_api";

/**
 * Store de solo lectura de las unidades del MOF. Los datos llegan a través del
 * backend de MPP (/mof/...), que los obtiene del MOF con su token de servicio.
 */
export const useAllUnidadesMofStore = defineStore(
    "unidades_mof",
    () => {
        const unidades = ref([]);
        const loading = ref(false);
        const error = ref(null);

        const getFetchUnidades = async () => {
            loading.value = true;
            error.value = null;
            try {
                unidades.value = await getMof("/unidades");
            } catch (err) {
                error.value = mofErrorMessage(err);
            } finally {
                loading.value = false;
            }
        };

        const getUnidadById = async (id) => {
            error.value = null;
            try {
                return await getMof(`/unidades/${id}`);
            } catch (err) {
                error.value = mofErrorMessage(err);
                return null;
            }
        };

        /** Cargos asignados a la unidad: [{ id, descripcion, detalle }] */
        const getPersonalUnidad = async (unidadId) => {
            try {
                return await getMof(`/unidades/${unidadId}/personal`);
            } catch {
                return [];
            }
        };

        const abrirPdfUnidad = async (id) => {
            // La pestaña se abre antes del await para que el navegador no la bloquee como popup.
            const tab = window.open("", "_blank");
            try {
                const response = await axios.get(`${MOF_URL}/unidades/${id}/pdf`, {
                    responseType: "blob",
                });
                const url = URL.createObjectURL(response.data);
                if (tab) tab.location.href = url;
                else window.open(url, "_blank");
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            } catch (err) {
                tab?.close();
                throw new Error(mofErrorMessage(err));
            }
        };

        return {
            unidades,
            loading,
            error,
            getFetchUnidades,
            getUnidadById,
            getPersonalUnidad,
            abrirPdfUnidad,
        }
    }
)

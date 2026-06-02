import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";

export const useAllUnidadesMppStore = defineStore(
    "unidades_mpp",
    () => {
        const unidades = ref([]);
        const loading = ref(false);
        const error = ref(null);

        const API_URL = "https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/mof/unidades";

        /**
         * Obtiene la lista completa de unidades
         */
        const getFetchUnidades = async () => {
            loading.value = true;
            error.value = null;
            try {
                const response = await axios.get(API_URL);
                // Soportar tanto response.data como response.data.data
                unidades.value = response.data.data || response.data;
            } catch (err) {
                error.value = "Error al obtener unidades: " + err.message;
                console.error(err);
            } finally {
                loading.value = false;
            }
        };

        /**
         * Obtiene una unidad específica por su ID
         */
        const getUnidadById = async (id) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await axios.get(`${API_URL}/${id}`);
                return response.data;
            } catch (err) {
                error.value = "Error al obtener la unidad: " + err.message;
                return null;
            } finally {
                loading.value = false;
            }
        };

        /**
         * Crea una nueva unidad
         */
        const createUnidad = async (data) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await axios.post(API_URL, data);
                await getFetchUnidades(); // Recargar la lista
                return response.data;
            } catch (err) {
                error.value = "Error al crear unidad: " + err.message;
                throw err;
            } finally {
                loading.value = false;
            }
        };

        /**
         * Actualiza una unidad existente
         */
        const updateUnidad = async (id, data) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await axios.put(`${API_URL}/${id}`, data);
                await getFetchUnidades(); // Recargar la lista
                return response.data;
            } catch (err) {
                error.value = "Error al actualizar unidad: " + err.message;
                throw err;
            } finally {
                loading.value = false;
            }
        };

        /**
         * Elimina una unidad
         */
        const deleteUnidad = async (id) => {
            loading.value = true;
            error.value = null;
            try {
                await axios.delete(`${API_URL}/${id}`);
                await getFetchUnidades(); // Recargar la lista
            } catch (err) {
                error.value = "Error al eliminar unidad: " + err.message;
                throw err;
            } finally {
                loading.value = false;
            }
        };

        return {
            unidades,
            loading,
            error,
            getFetchUnidades,
            getUnidadById,
            createUnidad,
            updateUnidad,
            deleteUnidad
        };
    }
);

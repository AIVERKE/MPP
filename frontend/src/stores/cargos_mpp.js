import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * Store para la gestión de cargos del Manual de Perfiles de Puestos (MPP)
 */
export const useAllCargosMppStore = defineStore(
    "cargos_mpp",
    () => {
        // --- Estado (State) ---
        const cargos = ref([]);      // Listado de cargos obtenidos de la API
        const loading = ref(false);  // Indicador de carga para procesos asíncronos
        const error = ref(null);    // Almacena mensajes de error en caso de fallos
        
        // URL base para las peticiones de cargos
        const API_URL = "https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/unidades/cargos";

        // --- Acciones (Actions) ---
        
        /**
         * Obtiene la lista completa de cargos desde el servidor
         */
        const getFetchCargos = async () => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error("Error al obtener los cargos");
                
                const data = await response.json();
                // Se asume que la respuesta tiene una estructura { data: [...] }
                cargos.value = data.data;
            } catch (err) {
                error.value = err.message;
                console.error("Error en getFetchCargos:", err);
            } finally {
                loading.value = false;
            }
        }

        /**
         * Crea un nuevo cargo en el catálogo maestro.
         * @param {string} descripcion - Nombre del nuevo cargo.
         * @returns {Promise<boolean>}
         */
        const createCargo = async (descripcion) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descripcion })
                });
                if (!response.ok) throw new Error("Error al crear el cargo");
                await getFetchCargos(); // Refrescar catálogo local
                return true;
            } catch (err) {
                error.value = err.message;
                return false;
            } finally {
                loading.value = false;
            }
        }

        /**
         * Actualiza el nombre de un cargo en el catálogo maestro.
         * Este cambio afecta a todas las unidades que usen este cargo.
         * @param {number|string} id - ID del cargo en el catálogo.
         * @param {string} descripcion - Nuevo nombre del cargo.
         * @returns {Promise<boolean>}
         */
        const updateCargo = async (id, descripcion) => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(`${API_URL}/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ descripcion })
                });
                if (!response.ok) throw new Error("Error al actualizar el cargo");
                await getFetchCargos(); // Refrescar catálogo local
                return true;
            } catch (err) {
                error.value = err.message;
                return false;
            } finally {
                loading.value = false;
            }
        }

        return {
            // Exposición de estado y acciones
            cargos,
            error,
            loading,
            getFetchCargos,
            createCargo,
            updateCargo
        }
    }
);

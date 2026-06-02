import { defineStore } from "pinia";
import { ref } from "vue";

/**
 * Store para la gestión de Clases (Instancias) del MPP
 */
export const useAllClasesMppStore = defineStore(
    "clases_mpp",
    () => {
        const clases = ref([]);
        const loading = ref(false);
        const error = ref(null);
        
        const API_URL = "https://correspondencia.fcpn.edu.bo/umsa-core/api/v1/mof/clases";

        const getFetchClases = async () => {
            loading.value = true;
            error.value = null;
            try {
                const response = await fetch(API_URL);
                if (!response.ok) throw new Error("Error al obtener las clases");
                
                const data = await response.json();
                // Guardamos el objeto tal cual viene del backend (id, descripcion, peso)
                clases.value = data.data;
            } catch (err) {
                error.value = err.message;
                console.error("Error en getFetchClases:", err);
            } finally {
                loading.value = false;
            }
        }

        return {
            clases,
            error,
            loading,
            getFetchClases
        }
    }
);

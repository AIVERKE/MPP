import { defineStore } from "pinia";
import { ref } from "vue";
import axios from "axios";
import { useAuthStore } from "./auth";

const BASE_URL = "http://localhost:3000/seguridad";

export const useUsuariosStore = defineStore("usuarios", () => {
  const usuarios = ref([]);
  const roles = ref([]);
  const loading = ref(false);
  const error = ref(null);

  function authHeaders() {
    const authStore = useAuthStore();
    return authStore.getAuthHeader();
  }

  async function fetchUsuarios(incluirInactivos = false) {
    loading.value = true;
    error.value = null;
    try {
      const response = await axios.get(`${BASE_URL}/usuarios`, {
        params: incluirInactivos ? { incluirInactivos: true } : undefined,
        headers: authHeaders(),
      });
      usuarios.value = response.data || [];
      return usuarios.value;
    } catch (err) {
      error.value =
        err.response?.data?.message || "Error al cargar usuarios";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchRoles() {
    try {
      const response = await axios.get(`${BASE_URL}/roles`, {
        headers: authHeaders(),
      });
      roles.value = response.data || [];
      return roles.value;
    } catch (err) {
      error.value = err.response?.data?.message || "Error al cargar roles";
      throw err;
    }
  }

  async function createUsuario(payload) {
    const response = await axios.post(`${BASE_URL}/usuarios`, payload, {
      headers: authHeaders(),
    });
    await fetchUsuarios();
    return response.data;
  }

  async function updateUsuario(id, payload) {
    const response = await axios.put(`${BASE_URL}/usuarios/${id}`, payload, {
      headers: authHeaders(),
    });
    await fetchUsuarios();
    return response.data;
  }

  async function deleteUsuario(id) {
    const response = await axios.delete(`${BASE_URL}/usuarios/${id}`, {
      headers: authHeaders(),
    });
    await fetchUsuarios();
    return response.data;
  }

  async function updateEstado(id, activo) {
    const response = await axios.patch(
      `${BASE_URL}/usuarios/${id}/estado`,
      { activo },
      { headers: authHeaders() },
    );
    await fetchUsuarios();
    return response.data;
  }

  async function updateRoles(id, rolesIds) {
    const response = await axios.put(
      `${BASE_URL}/usuarios/${id}/roles`,
      { roles: rolesIds },
      { headers: authHeaders() },
    );
    await fetchUsuarios();
    return response.data;
  }

  return {
    usuarios,
    roles,
    loading,
    error,
    fetchUsuarios,
    fetchRoles,
    createUsuario,
    updateUsuario,
    deleteUsuario,
    updateEstado,
    updateRoles,
  };
});

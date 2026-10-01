import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";
import { API_URL } from "@/config/env";

const LOGIN_URL = `${API_URL}/auth/login`;
const AUTH_TIMEOUT_MS = 5000;

const MSG_BAD_CREDENTIALS = "Usuario o contraseña incorrectos";
const MSG_SERVER_DOWN = "El servidor de autenticación no está disponible.";

function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

export const useAuthStore = defineStore("auth", () => {
  localStorage.removeItem("is_local_token");

  const token = ref(localStorage.getItem("token") || null);
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const isAuthenticated = computed(() => !!token.value);

  if (token.value) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
  }

  function applySession(data) {
    token.value = data.access_token;
    localStorage.setItem("token", token.value);

    const roleNames = (data.user.roles || []).map((r) => r.nombre);
    user.value = {
      id: data.user.id,
      username: data.user.username,
      nombre: data.user.username,
      roles: roleNames,
      rol: roleNames[0] || "Usuario",
    };
    localStorage.setItem("user", JSON.stringify(user.value));
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
  }

  async function login(username, password) {
    const { signal, clear } = withTimeout(AUTH_TIMEOUT_MS);
    let response;
    try {
      response = await fetch(LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal,
      });
    } catch {
      throw new Error(MSG_SERVER_DOWN);
    } finally {
      clear();
    }

    if (response.ok) {
      applySession(await response.json());
      return true;
    }
    if (response.status === 401) {
      throw new Error(MSG_BAD_CREDENTIALS);
    }
    throw new Error(MSG_SERVER_DOWN);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    delete axios.defaults.headers.common["Authorization"];
  }

  function getAuthHeader() {
    return token.value ? { Authorization: `Bearer ${token.value}` } : {};
  }

  function hasRole(roleName) {
    const roles = user.value?.roles;
    if (Array.isArray(roles) && roles.length) {
      return roles.includes(roleName);
    }
    return user.value?.rol === roleName;
  }

  const roleList = computed(() => {
    if (Array.isArray(user.value?.roles) && user.value.roles.length) {
      return user.value.roles;
    }
    return user.value?.rol ? [user.value.rol] : [];
  });

  const MPP_WRITE_ROLES = [
    "Elaborador",
    "Validador de Planificación",
    "Validador Técnico",
    "Super admin",
  ];

  const canEditMpp = computed(() =>
    roleList.value.some((r) => MPP_WRITE_ROLES.includes(r)),
  );

  const isSoloConsultor = computed(() => {
    const roles = roleList.value;
    return (
      roles.includes("Consultor") &&
      !roles.some((r) => MPP_WRITE_ROLES.includes(r))
    );
  });

  return {
    token,
    isAuthenticated,
    user,
    login,
    logout,
    getAuthHeader,
    hasRole,
    canEditMpp,
    isSoloConsultor,
  };
});

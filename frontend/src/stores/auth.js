import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

/** VITE_AUTH_MODE=local|umsa|auto (default auto) */
const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || "auto").toLowerCase();
const LOCAL_LOGIN_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/auth/login`
  : "http://localhost:3000/auth/login";
const UMSA_TOKEN_URL =
  import.meta.env.VITE_UMSA_TOKEN_URL ||
  "https://correspondencia.fcpn.edu.bo/umsa-core/oauth/token";
const AUTH_TIMEOUT_MS = 5000;

const MSG_BAD_CREDENTIALS = "Usuario o contraseña incorrectos";
const MSG_SERVER_DOWN = "El servidor de autenticación no está disponible.";
const MSG_REMOTE_AUTH = "Error de autenticación remota (UMSA Core).";
const MSG_REMOTE_5XX = "Error interno en el servidor de autenticación";

function withTimeout(ms) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(id) };
}

function isNetworkFailure(error) {
  return (
    error?.name === "AbortError" ||
    error?.name === "TypeError" ||
    error?.message === "Failed to fetch" ||
    /aborted|network|fetch/i.test(error?.message || "")
  );
}

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem("token") || null);
  const isLocalToken = ref(localStorage.getItem("is_local_token") === "true");
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const isAuthenticated = computed(() => !!token.value);

  if (token.value) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
  }

  function applyLocalSession(data) {
    token.value = data.access_token;
    isLocalToken.value = true;
    localStorage.setItem("token", token.value);
    localStorage.setItem("is_local_token", "true");

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

  function applyUmsaSession(data, username) {
    token.value = data.access_token;
    isLocalToken.value = false;
    localStorage.setItem("token", token.value);
    localStorage.setItem("is_local_token", "false");

    user.value = {
      username,
      nombre: username,
      roles: ["Usuario"],
      rol: "Usuario",
    };
    localStorage.setItem("user", JSON.stringify(user.value));
    axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
  }

  async function loginLocal(username, password) {
    const { signal, clear } = withTimeout(AUTH_TIMEOUT_MS);
    try {
      const response = await fetch(LOCAL_LOGIN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        applyLocalSession(data);
        return { ok: true };
      }

      if (response.status === 401) {
        return { ok: false, kind: "credentials" };
      }

      return { ok: false, kind: "unavailable" };
    } catch (error) {
      if (isNetworkFailure(error)) {
        return { ok: false, kind: "network" };
      }
      return { ok: false, kind: "unavailable" };
    } finally {
      clear();
    }
  }

  async function loginUmsa(username, password) {
    const { signal, clear } = withTimeout(AUTH_TIMEOUT_MS);
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);
    body.append("grant_type", "password");

    try {
      const response = await fetch(UMSA_TOKEN_URL, {
        method: "POST",
        headers: {
          Authorization: `Basic ${btoa("umsacore:umsa2026")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
        signal,
      });

      if (response.ok) {
        const data = await response.json();
        applyUmsaSession(data, username);
        return { ok: true };
      }

      if (response.status === 400) {
        return { ok: false, kind: "remote_400" };
      }
      if (response.status === 401) {
        return { ok: false, kind: "credentials" };
      }
      if (response.status >= 500) {
        return { ok: false, kind: "remote_5xx" };
      }
      return { ok: false, kind: "remote_400" };
    } catch (error) {
      if (isNetworkFailure(error)) {
        return { ok: false, kind: "network" };
      }
      return { ok: false, kind: "remote_400" };
    } finally {
      clear();
    }
  }

  function throwForKind(kind) {
    switch (kind) {
      case "credentials":
        throw new Error(MSG_BAD_CREDENTIALS);
      case "remote_400":
        throw new Error(MSG_REMOTE_AUTH);
      case "remote_5xx":
        throw new Error(MSG_REMOTE_5XX);
      case "network":
      case "unavailable":
      default:
        throw new Error(MSG_SERVER_DOWN);
    }
  }

  /**
   * Login según VITE_AUTH_MODE=local|umsa|auto (default auto).
   * - local 401 → nunca llama a UMSA
   * - local caído (red) en auto → intenta UMSA
   */
  async function login(username, password) {
    const mode = ["local", "umsa", "auto"].includes(AUTH_MODE)
      ? AUTH_MODE
      : "auto";

    if (mode === "umsa") {
      const result = await loginUmsa(username, password);
      if (result.ok) return true;
      throwForKind(result.kind);
    }

    const localResult = await loginLocal(username, password);
    if (localResult.ok) return true;

    if (localResult.kind === "credentials") {
      throw new Error(MSG_BAD_CREDENTIALS);
    }

    // 5xx u otros status locales: no fallback a UMSA
    if (localResult.kind === "unavailable" && mode === "auto") {
      throw new Error(MSG_SERVER_DOWN);
    }

    if (mode === "local") {
      throwForKind(localResult.kind);
    }

    // auto + network: intentar UMSA
    const umsaResult = await loginUmsa(username, password);
    if (umsaResult.ok) return true;
    throwForKind(umsaResult.kind);
  }

  function logout() {
    token.value = null;
    user.value = null;
    isLocalToken.value = false;
    localStorage.removeItem("token");
    localStorage.removeItem("is_local_token");
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
    isLocalToken,
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

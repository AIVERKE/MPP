import { defineStore } from "pinia";
import { ref, computed } from "vue";
import axios from "axios";

export const useAuthStore = defineStore("auth", () => {
  // Iniciamos el token recuperándolo del almacenamiento local si existe
  const token = ref(localStorage.getItem("token") || null);
  const isLocalToken = ref(localStorage.getItem("is_local_token") === "true");
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const isAuthenticated = computed(() => !!token.value);

  // Si ya tenemos token, lo configuramos en axios por defecto
  if (token.value) {
    axios.defaults.headers.common["Authorization"] = `Bearer ${token.value}`;
  }

  async function login(username, password) {
    // 1. Intentar primero con el Backend Local
    try {
      const localResponse = await fetch("http://localhost:3000/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (localResponse.ok) {
        const data = await localResponse.json();
        token.value = data.access_token;
        isLocalToken.value = true;
        localStorage.setItem("token", token.value);
        localStorage.setItem("is_local_token", "true");

        user.value = {
          id: data.user.id,
          username: data.user.username,
          nombre: data.user.username,
          rol: data.user.roles?.[0]?.nombre || "Usuario"
        };
        localStorage.setItem("user", JSON.stringify(user.value));

        // Configurar token en axios por defecto
        axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;
        return true;
      }
    } catch (localError) {
      console.warn("Fallo login en backend local, intentando UMSA Core:", localError);
    }

    // 2. Si falla o no está disponible, intentar con UMSA Core
    const clientCredentials = btoa("umsacore:umsa2026");
    const body = new URLSearchParams();
    body.append("username", username);
    body.append("password", password);
    body.append("grant_type", "password");

    try {
      const response = await fetch("https://correspondencia.fcpn.edu.bo/umsa-core/oauth/token", {
        method: "POST",
        headers: {
          "Authorization": `Basic ${clientCredentials}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });

      if (!response.ok) {
        throw new Error("Credenciales inválidas o error de conexión");
      }

      const data = await response.json();

      // Guardamos el access_token recibido
      token.value = data.access_token;
      isLocalToken.value = false;
      localStorage.setItem("token", token.value);
      localStorage.setItem("is_local_token", "false");

      // Guardamos información del usuario
      user.value = {
        username: username,
        nombre: username,
        rol: "Usuario"
      };
      localStorage.setItem("user", JSON.stringify(user.value));

      // Configurar token en axios por defecto para autorizar peticiones al backend local
      axios.defaults.headers.common["Authorization"] = `Bearer ${data.access_token}`;

      return true;
    } catch (error) {
      console.error("Error en login UMSA Core:", error);
      throw error;
    }
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
    return token.value ? { "Authorization": `Bearer ${token.value}` } : {};
  }

  return { token, isLocalToken, isAuthenticated, user, login, logout, getAuthHeader };
});

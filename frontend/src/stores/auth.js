import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useAuthStore = defineStore("auth", () => {
  // Iniciamos el token recuperándolo del almacenamiento local si existe
  const token = ref(localStorage.getItem("token") || null);
  const user = ref(JSON.parse(localStorage.getItem("user") || "null"));
  const isAuthenticated = computed(() => !!token.value);

  async function login(username, password) {
    // 1. Preparamos las credenciales de la aplicación (Basic Auth) como dice el PDF
    const clientCredentials = btoa("umsacore:umsa2026");

    // 2. Preparamos los datos del usuario en formato URL encoded
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

      // 3. Guardamos el access_token recibido
      token.value = data.access_token;
      localStorage.setItem("token", token.value);

      // 4. Guardamos información del usuario
      user.value = {
        username: username,
        nombre: username,
        rol: "Usuario"
      };
      localStorage.setItem("user", JSON.stringify(user.value));

      return true;
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  function getAuthHeader() {
    return token.value ? { "Authorization": `Bearer ${token.value}` } : {};
  }

  return { token, isAuthenticated, user, login, logout, getAuthHeader };
});

const trimSlash = (url) => url.replace(/\/+$/, "");

export const API_URL = trimSlash(
  import.meta.env.VITE_API_URL || "http://localhost:3000"
);

export const UMSA_CORE_URL = trimSlash(
  import.meta.env.VITE_UMSA_CORE_URL ||
    "https://correspondencia.fcpn.edu.bo/umsa-core"
);

export const UMSA_TOKEN_URL =
  import.meta.env.VITE_UMSA_TOKEN_URL || `${UMSA_CORE_URL}/oauth/token`;

/** local | umsa | auto (default auto) */
export const AUTH_MODE = (import.meta.env.VITE_AUTH_MODE || "auto").toLowerCase();

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL no está definido; se usa http://localhost:3000");
}

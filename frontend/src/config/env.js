const trimSlash = (url) => url.replace(/\/+$/, "");

export const API_URL = trimSlash(
  import.meta.env.VITE_API_URL || "http://localhost:3000"
);

if (import.meta.env.PROD && !import.meta.env.VITE_API_URL) {
  console.warn("VITE_API_URL no está definido; se usa http://localhost:3000");
}

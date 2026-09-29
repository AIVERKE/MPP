const UMSA_CORE_REMOTE = "https://correspondencia.fcpn.edu.bo/umsa-core";

/**
 * En `npm run dev` el navegador llama a Vite (`/umsa-core/...`) y Vite
 * reenvía a correspondencia. Así el preflight no sale a otro origen.
 * El build de producción sigue usando la URL pública.
 */
export const UMSA_CORE = import.meta.env.DEV ? "/umsa-core" : UMSA_CORE_REMOTE;

import axios from "axios";
import { API_URL } from "@/config/env";

export const MOF_URL = `${API_URL}/mof`;

export async function getMof(path) {
  const response = await axios.get(`${MOF_URL}${path}`);
  return response.data;
}

export function mofErrorMessage(err) {
  if (!err.response) {
    return "No se puede conectar al servidor. Comuníquese con el administrador del sistema.";
  }
  return err.response.data?.message || err.message;
}

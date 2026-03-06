import { useMemo } from "react";
import { getPreferenceValues } from "@raycast/api";

interface Credentials {
  apiKey: string;
  apiSecret: string;
}

interface CredentialsState {
  credentials: Credentials | null;
  isValid: boolean;
}

/**
 * Hook para obtener y validar las credenciales de Phemex API
 * desde las preferencias de la extensión
 */
export function useCredentials(): CredentialsState {
  const credentials = useMemo(() => {
    try {
      return getPreferenceValues<Credentials>();
    } catch {
      return null;
    }
  }, []);

  const isValid = useMemo(() => {
    if (!credentials) return false;
    return Boolean(credentials.apiKey) && Boolean(credentials.apiSecret);
  }, [credentials]);

  return {
    credentials,
    isValid,
  };
}

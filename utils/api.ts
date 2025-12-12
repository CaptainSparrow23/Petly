import Constants from "expo-constants";

/**
 * Get the API base URL from Expo config.
 * Falls back to the default backend URL if not configured.
 */
export const getApiBaseUrl = (): string => {
  const url = Constants.expoConfig?.extra?.backendUrl as string | undefined;
  return url || "https://petly-gsxb.onrender.com";
};


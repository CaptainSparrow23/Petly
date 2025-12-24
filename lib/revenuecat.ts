import Constants from "expo-constants";
import { Platform } from "react-native";
import Purchases, { LOG_LEVEL } from "react-native-purchases";

export const ENTITLEMENT_ID = "Petly Pro";

const getRevenueCatApiKey = () => {
  const extra = Constants.expoConfig?.extra ?? {};
  const iosKey = extra.revenuecatIosApiKey as string | undefined;
  const androidKey = extra.revenuecatAndroidApiKey as string | undefined;

  return Platform.select({
    ios: iosKey,
    android: androidKey,
    default: iosKey ?? androidKey,
  });
};

let isConfigured = false;
let configurePromise: Promise<boolean> | null = null;

export const configureRevenueCat = async () => {
  if (isConfigured) return true;
  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    const apiKey = getRevenueCatApiKey();
    if (!apiKey) {
      console.warn("RevenueCat API key missing. Add it to app.json extra.");
      configurePromise = null;
      return false;
    }

    if (__DEV__) {
      await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    Purchases.configure({ apiKey });
    isConfigured = true;
    return true;
  })();

  return configurePromise;
};

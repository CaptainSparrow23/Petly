import { useCallback, useEffect, useState } from "react";
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  PURCHASES_ERROR_CODE,
  PurchasesError,
} from "react-native-purchases";
import { configureRevenueCat, ENTITLEMENT_ID } from "@/lib/revenuecat";

type PurchaseResult = {
  customerInfo: CustomerInfo | null;
  cancelled: boolean;
};

export const useRevenueCat = () => {
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offerings, setOfferings] = useState<PurchasesOfferings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const ensureConfigured = useCallback(async () => {
    const configured = await configureRevenueCat();
    if (!configured) {
      const configError = new Error("RevenueCat is not configured.");
      setError(configError);
      setLoading(false);
      return false;
    }
    return true;
  }, []);

  const refresh = useCallback(async () => {
    setError(null);
    if (!(await ensureConfigured())) return;

    try {
      const [info, currentOfferings] = await Promise.all([
        Purchases.getCustomerInfo(),
        Purchases.getOfferings(),
      ]);
      setCustomerInfo(info);
      setOfferings(currentOfferings);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [ensureConfigured]);

  useEffect(() => {
    let listener: ((info: CustomerInfo) => void) | null = null;
    let cancelled = false;

    const setup = async () => {
      const ok = await ensureConfigured();
      if (!ok || cancelled) return;

      listener = (info: CustomerInfo) => setCustomerInfo(info);
      Purchases.addCustomerInfoUpdateListener(listener);
      await refresh();
    };

    void setup();

    return () => {
      cancelled = true;
      if (listener) {
        Purchases.removeCustomerInfoUpdateListener(listener);
      }
    };
  }, [ensureConfigured, refresh]);

  const isPro = !!customerInfo?.entitlements.active[ENTITLEMENT_ID];

  const purchasePackage = useCallback(async (pkg: PurchasesPackage): Promise<PurchaseResult> => {
    if (!(await ensureConfigured())) {
      return { customerInfo: null, cancelled: true };
    }

    try {
      const { customerInfo: info } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(info);
      return { customerInfo: info, cancelled: false };
    } catch (err) {
      const error = err as PurchasesError;
      if (error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
        return { customerInfo: null, cancelled: true };
      }
      throw error;
    }
  }, [ensureConfigured]);

  const restorePurchases = useCallback(async () => {
    if (!(await ensureConfigured())) return null;
    const info = await Purchases.restorePurchases();
    setCustomerInfo(info);
    return info;
  }, [ensureConfigured]);

  return {
    customerInfo,
    offerings,
    loading,
    error,
    isPro,
    purchasePackage,
    restorePurchases,
    refresh,
  };
};

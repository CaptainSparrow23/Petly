import { createContext, useContext, useEffect, useState } from "react";
import Purchases, { PURCHASES_ERROR_CODE, PurchasesError } from "react-native-purchases";
import { configureRevenueCat } from "@/lib/revenuecat";
import { useAuth } from "@/providers/AuthProvider";

type SubscriptionContextType = {
  ready: boolean;
};

const SubscriptionContext =
  createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { authUser } = useAuth();
  const [ready, setReady] = useState(false);
  const [configured, setConfigured] = useState(false);

  // 1️⃣ Configure RevenueCat ONCE
  useEffect(() => {
    const init = async () => {
      const ok = await configureRevenueCat();
      setConfigured(ok);
    };

    void init();
  }, []);

  // 2️⃣ Link Firebase → RevenueCat
  useEffect(() => {
    let cancelled = false;

    const syncUser = async () => {
      if (!configured) return;

      try {
        if (authUser?.uid) {
          await Purchases.logIn(authUser.uid);
        } else {
          await Purchases.logOut();
        }
      } catch (error) {
        const err = error as PurchasesError;
        if (err?.code !== PURCHASES_ERROR_CODE.LOG_OUT_ANONYMOUS_USER_ERROR) {
          console.warn("RevenueCat auth sync failed", err);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    };

    void syncUser();

    return () => {
      cancelled = true;
    };
  }, [configured, authUser?.uid]);

  return (
    <SubscriptionContext.Provider value={{ ready }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error("useSubscription must be used within SubscriptionProvider");
  }
  return context;
};

import Purchases, {
  PURCHASES_ERROR_CODE,
  PurchasesError,
  PurchasesPackage,
} from "react-native-purchases";
import {
  doc,
  runTransaction,
  serverTimestamp,
} from "firebase/firestore";
import { configureRevenueCat } from "@/lib/revenuecat";
import { auth, db } from "@/lib/firebase";
import {
  isTransactionProcessedLocally,
  markTransactionProcessedLocally,
} from "@/lib/coins";

const COIN_PRODUCT_TO_AMOUNT: Record<string, number> = {
  coins_500: 500,
  coins_1200: 1200,
  coins_2000: 2000,
  coins_4500: 4500,
};

const resolveCoinAmount = (productIdentifier?: string | null): number | null => {
  if (!productIdentifier) return null;
  if (COIN_PRODUCT_TO_AMOUNT[productIdentifier]) {
    return COIN_PRODUCT_TO_AMOUNT[productIdentifier];
  }

  const matchedKey = Object.keys(COIN_PRODUCT_TO_AMOUNT).find((key) =>
    productIdentifier.includes(key)
  );
  return matchedKey ? COIN_PRODUCT_TO_AMOUNT[matchedKey] : null;
};

export type CoinPurchaseResult = {
  success: boolean;
  cancelled: boolean;
  message: string;
  coinsGranted: number;
  balance?: number;
  transactionIdentifier?: string;
  productIdentifier?: string;
  alreadyProcessed?: boolean;
};

export const purchaseCoinPackage = async (
  pkg: PurchasesPackage
): Promise<CoinPurchaseResult> => {
  const configured = await configureRevenueCat();
  if (!configured) {
    return {
      success: false,
      cancelled: false,
      message: "RevenueCat is not configured.",
      coinsGranted: 0,
    };
  }

  const uid = auth.currentUser?.uid;
  if (!uid) {
    return {
      success: false,
      cancelled: false,
      message: "User not authenticated.",
      coinsGranted: 0,
    };
  }

  try {
    const result = await Purchases.purchasePackage(pkg);
    const transactionId = result?.transaction?.transactionIdentifier;
    const productIdentifier =
      result?.productIdentifier ??
      result?.transaction?.productIdentifier ??
      pkg.product?.identifier ??
      pkg.identifier;

    if (!transactionId) {
      return {
        success: false,
        cancelled: false,
        message: "Missing transaction identifier.",
        coinsGranted: 0,
        productIdentifier,
      };
    }

    if (await isTransactionProcessedLocally(transactionId)) {
      return {
        success: true,
        cancelled: false,
        message: "Purchase already processed.",
        coinsGranted: 0,
        transactionIdentifier: transactionId,
        productIdentifier,
        alreadyProcessed: true,
      };
    }

    const coins = resolveCoinAmount(productIdentifier);
    if (!coins) {
      return {
        success: false,
        cancelled: false,
        message: `Unknown coin product: ${productIdentifier ?? "unknown"}`,
        coinsGranted: 0,
        transactionIdentifier: transactionId,
        productIdentifier,
      };
    }

    let updatedBalance = 0;
    let alreadyProcessed = false;

    const userRef = doc(db, "users", uid);
    const txRef = doc(db, "users", uid, "coinTransactions", transactionId);

    try {
      await runTransaction(db, async (tx) => {
        const [userSnap, txSnap] = await Promise.all([tx.get(userRef), tx.get(txRef)]);
        const currentCoins =
          userSnap.exists() && typeof userSnap.data()?.coins === "number"
            ? (userSnap.data()!.coins as number)
            : 0;

        if (txSnap.exists()) {
          alreadyProcessed = true;
          updatedBalance = currentCoins;
          return;
        }

        updatedBalance = currentCoins + coins;
        tx.set(
          txRef,
          {
            productIdentifier: productIdentifier ?? "unknown",
            coins,
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );
        tx.set(userRef, { coins: updatedBalance }, { merge: true });
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to grant coins.";
      return {
        success: false,
        cancelled: false,
        message,
        coinsGranted: 0,
        transactionIdentifier: transactionId,
        productIdentifier,
      };
    }

    await markTransactionProcessedLocally(transactionId, productIdentifier ?? "unknown");

    return {
      success: true,
      cancelled: false,
      message: alreadyProcessed
        ? "Purchase already processed."
        : `Added ${coins.toLocaleString()} coins.`,
      coinsGranted: alreadyProcessed ? 0 : coins,
      balance: updatedBalance,
      transactionIdentifier: transactionId,
      productIdentifier,
      alreadyProcessed,
    };
  } catch (err) {
    const error = err as PurchasesError;
    if (error?.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR) {
      return {
        success: false,
        cancelled: true,
        message: "Purchase cancelled.",
        coinsGranted: 0,
      };
    }

    if (
      error?.code === PURCHASES_ERROR_CODE.NETWORK_ERROR ||
      error?.code === PURCHASES_ERROR_CODE.OFFLINE_CONNECTION_ERROR
    ) {
      return {
        success: false,
        cancelled: false,
        message: "Network error. Please try again.",
        coinsGranted: 0,
      };
    }

    return {
      success: false,
      cancelled: false,
      message: error?.message || "Purchase failed. Please try again.",
      coinsGranted: 0,
    };
  }
};

export const restorePurchases = async (): Promise<{ success: boolean; message: string }> => {
  const configured = await configureRevenueCat();
  if (!configured) {
    return {
      success: false,
      message: "RevenueCat is not configured.",
    };
  }

  try {
    await Purchases.restorePurchases();
    return {
      success: true,
      message: "Purchases restored. Consumable coins are not re-granted.",
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to restore purchases.";
    return { success: false, message };
  }
};


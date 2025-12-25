import AsyncStorage from "@react-native-async-storage/async-storage";

const COIN_TX_KEY = "petly.coin_processed_transactions";

type ProcessedTransaction = {
  productId: string;
  processedAt: string;
};

type ProcessedTransactionMap = Record<string, ProcessedTransaction>;

const parseProcessedTransactions = (raw: string | null): ProcessedTransactionMap => {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as ProcessedTransactionMap;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

export async function isTransactionProcessedLocally(transactionId: string): Promise<boolean> {
  if (!transactionId) return false;
  const raw = await AsyncStorage.getItem(COIN_TX_KEY);
  const processed = parseProcessedTransactions(raw);
  return !!processed[transactionId];
}

export async function markTransactionProcessedLocally(
  transactionId: string,
  productId: string
): Promise<void> {
  if (!transactionId) return;
  const raw = await AsyncStorage.getItem(COIN_TX_KEY);
  const processed = parseProcessedTransactions(raw);

  processed[transactionId] = {
    productId,
    processedAt: new Date().toISOString(),
  };

  await AsyncStorage.setItem(COIN_TX_KEY, JSON.stringify(processed));
}


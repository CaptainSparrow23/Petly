import React, { useMemo, useState } from "react";
import { Text, View } from "react-native";
import ActionSheet, {
  SheetProps,
  registerSheet,
  useSheetRef,
  SheetDefinition,
} from "react-native-actions-sheet";
import {
  InsufficientCoinsCard,
  PetPreviewCard,
  PurchaseConfirmationCard,
  PurchaseSuccessCard,
} from "./Sheets";
import type { StoreItem } from "./Tiles";
import { useGlobalContext } from "@/providers/GlobalProvider";

type PreviewPayload = {
  pet: StoreItem | null;
  onPurchase?: (pet: StoreItem) => void;
  onClosed?: () => void;
};

// Sheet rendering the large pet preview with purchase button.
const PreviewSheet = ({
  sheetId,
  payload,
}: SheetProps<"store-preview">) => {
  const sheetRef = useSheetRef(sheetId);
  const { userProfile, appSettings } = useGlobalContext();
  const handlePurchase = useMemo(() => {
    if (!payload?.pet) {
      return undefined;
    }
    return () => payload?.onPurchase?.(payload.pet!);
  }, [payload]);

  return (
    <ActionSheet
      id={sheetId}
      ref={sheetRef}
      gestureEnabled
      closeOnPressBack
      onClose={payload?.onClosed}
      indicatorStyle={{ width: 48, backgroundColor: "#e5e7eb" }}
    >
      <View style={{ width: "100%", paddingHorizontal: 20 }}>
        <PetPreviewCard
          pet={payload?.pet ?? null}
          selectedPet={userProfile?.selectedPet}
          selectedBackground={appSettings.selectedBackground}
          onPurchase={handlePurchase ?? (() => undefined)}
          isPurchasing={false}
          purchaseError={null}
        />
      </View>
    </ActionSheet>
  );
};

registerSheet("store-preview", PreviewSheet);

type ConfirmationPayload = {
  petName?: string | null;
  petPrice?: number | null;
  onConfirm?: () => Promise<void>;
  onCancel?: () => void;
  onClosed?: () => void;
};

// Sheet prompting the user to confirm the coin spend.
const ConfirmationSheet = ({
  sheetId,
  payload,
}: SheetProps<"store-confirmation">) => {
  const sheetRef = useSheetRef(sheetId);
  const [isConfirming, setIsConfirming] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleCancel = () => {
    setErrorMessage(null);
    payload?.onCancel?.();
  };

  const handleConfirm = async () => {
    if (!payload?.onConfirm) {
      return;
    }
    setErrorMessage(null);
    setIsConfirming(true);
    try {
      await payload.onConfirm();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "We could not complete your purchase. Please try again.";
      setErrorMessage(message);
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <ActionSheet
      id={sheetId}
      ref={sheetRef}
      gestureEnabled
      closeOnPressBack
      onClose={() => {
        setErrorMessage(null);
        payload?.onClosed?.();
      }}
      indicatorStyle={{ width: 48, backgroundColor: "#e5e7eb" }}
    >
      <PurchaseConfirmationCard
        petName={payload?.petName}
        petPrice={payload?.petPrice}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
        isConfirming={isConfirming}
      />
      {!!errorMessage && (
        <Text
          style={{
            marginTop: 8,
            textAlign: "center",
            color: "#ef4444",
            fontSize: 12,
          }}
        >
          {errorMessage}
        </Text>
      )}
    </ActionSheet>
  );
};

registerSheet("store-confirmation", ConfirmationSheet);

type InsufficientPayload = {
  petName?: string | null;
  onCloseRequest?: () => void;
  onGetMoreCoins?: () => void;
  onClosed?: () => void;
};

// Sheet shown when the user lacks enough coins.
const InsufficientSheet = ({
  sheetId,
  payload,
}: SheetProps<"store-insufficient">) => {
  const sheetRef = useSheetRef(sheetId);

  return (
    <ActionSheet
      id={sheetId}
      ref={sheetRef}
      gestureEnabled
      closeOnPressBack
      onClose={payload?.onClosed}
      indicatorStyle={{ width: 48, backgroundColor: "#e5e7eb" }}
    >
      <InsufficientCoinsCard
        petName={payload?.petName}
        onClose={() => payload?.onCloseRequest?.()}
        onGetMoreCoins={() => payload?.onGetMoreCoins?.()}
      />
    </ActionSheet>
  );
};

registerSheet("store-insufficient", InsufficientSheet);

type SuccessPayload = {
  petName?: string | null;
  onCloseRequest?: () => void;
  onClosed?: () => void;
};

// Sheet celebrating a successful purchase.
const SuccessSheet = ({
  sheetId,
  payload,
}: SheetProps<"store-success">) => {
  const sheetRef = useSheetRef(sheetId);

  return (
    <ActionSheet
     id={sheetId}
     ref={sheetRef}
      gestureEnabled
      closeOnTouchBackdrop={false}
      closeOnPressBack={false}
      closable={false}
      onClose={payload?.onClosed}
      indicatorStyle={{ width: 48, backgroundColor: "#e5e7eb" }}
    >
      <PurchaseSuccessCard
        petName={payload?.petName}
        onClose={() => payload?.onCloseRequest?.()}
      />
    </ActionSheet>
  );
};

registerSheet("store-success", SuccessSheet);

// Extend the library's sheet registry with our payload types.
declare module "react-native-actions-sheet" {
  interface Sheets {
    "store-preview": SheetDefinition<{ payload: PreviewPayload }>;
    "store-confirmation": SheetDefinition<{ payload: ConfirmationPayload }>;
    "store-insufficient": SheetDefinition<{ payload: InsufficientPayload }>;
    "store-success": SheetDefinition<{ payload: SuccessPayload }>;
  }
}

export {};

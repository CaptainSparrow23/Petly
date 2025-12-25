import React from "react";
import { Text, TouchableOpacity, View, Image, ImageBackground, ImageSourcePropType } from "react-native";
import { StoreItem } from "./Tiles";
import { CoralPalette } from "@/constants/colors";
import images from "@/constants/images";
import PetAnimation from "@/components/focus/PetAnimation";
import { getPetAnimationConfig } from "@/constants/animations";

// Background configuration for sheets with individual styling
type SheetBackgroundConfig = {
  source: ImageSourcePropType;
  translateY: number;           // For pet preview (taller container)
  scale: number;                // Scale for pet preview
  accessoryTranslateY: number;  // For accessory preview (shorter container)
  accessoryScale: number;       // Scale for accessory preview
};

const SHEET_BACKGROUNDS: Record<string, SheetBackgroundConfig> = {
  background_room: {
    source: images.background_room,
    translateY: -80,
    scale: 1,
    accessoryTranslateY: 15,
    accessoryScale: 1,
  },
  background_beach: {
    source: images.background_beach,
    translateY: -120,
    scale: 1,
    accessoryTranslateY: -20,
    accessoryScale: 1,
  },
  background_park: {
    source: images.background_park,
    translateY: -100,
    scale: 1,
    accessoryTranslateY: -90,
    accessoryScale: 1,
  },
  background_winter: {
    source: images.background_winter,
    translateY: -90,
    scale: 1,
    accessoryTranslateY: -10,
    accessoryScale: 1,
  },
  background_kitchen: {
    source: images.background_kitchen,
    translateY: -150,
    scale: 1,
    accessoryTranslateY: -75,
    accessoryScale: 1.8,
  },
};

const DEFAULT_BACKGROUND_CONFIG: SheetBackgroundConfig = {
  source: images.background_winter,
  translateY: -90,
  scale: 1,
  accessoryTranslateY: -60,
  accessoryScale: 1,
};

const FONT = { fontFamily: "Nunito" };

const CARD_SHADOW = {
  shadowColor: "#000",
  shadowOpacity: 0.1,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 4 },
  elevation: 6,
};

type PetPreviewCardProps = {
  pet: StoreItem | null;
  selectedPet?: string | null;
  selectedBackground?: string;
  onPurchase: () => void;
  isPurchasing: boolean;
  purchaseError?: string | null;
};

export const PetPreviewCard = ({
  pet,
  selectedPet,
  selectedBackground = "background_winter",
  onPurchase,
  isPurchasing,
  purchaseError,
}: PetPreviewCardProps) => {
  const bgConfig = SHEET_BACKGROUNDS[selectedBackground] ?? DEFAULT_BACKGROUND_CONFIG;
  const isPet = pet?.category === "Pet";

  const getAccessoryProps = () => {
    if (!pet) return { selectedHat: null, selectedCollar: null };
    switch (pet.category) {
      case 'Hat':
        return { selectedHat: pet.id, selectedCollar: null };
      case 'Collar':
        return { selectedHat: null, selectedCollar: pet.id };
      default:
        return { selectedHat: null, selectedCollar: null };
    }
  };

  const accessoryProps = getAccessoryProps();
  const isAccessory = pet?.category === 'Hat' || pet?.category === 'Collar';
  const petAnimConfig = isAccessory ? getPetAnimationConfig(selectedPet) : getPetAnimationConfig(pet?.id);

  return (
    <View style={{ width: "100%", paddingBottom: 8 }}>
      {pet && (
        <>
          {/* Preview Image Container */}
          <View style={[{ borderRadius: 12, overflow: "hidden", marginBottom: 16 }, CARD_SHADOW]}>
            {pet.category === 'Pet' ? (
              <ImageBackground
                source={bgConfig.source}
                resizeMode="cover"
                style={{ width: "100%", height: 320 }}
                imageStyle={{ transform: [{ scale: bgConfig.scale }, { translateY: bgConfig.translateY }] }}
              >
                {(() => {
                  const animConfig = getPetAnimationConfig(pet.id);
                  if (animConfig) {
                    return (
                      <PetAnimation
                        source={animConfig.source}
                        stateMachineName={animConfig.stateMachineName}
                        focusInputName={animConfig.focusInputName}
                        focusValue={0}
                        containerStyle={{ flex: 1, position: "absolute", top: 30, left: 0, right: 0, bottom: 0 }}
                        animationStyle={{ width: "55%", height: "55%" }}
                      />
                    );
                  }
                  return (
                    <Image
                      source={images[pet.id as keyof typeof images] ?? images.lighting}
                      resizeMode="contain"
                      style={{ width: "100%", height: "100%" }}
                    />
                  );
                })()}
              </ImageBackground>
            ) : isAccessory && petAnimConfig ? (
              <ImageBackground
                source={bgConfig.source}
                resizeMode="cover"
                style={{ width: "100%", height: 280 }}
                imageStyle={{ width: "100%", height: "150%", transform: [{ scale: bgConfig.accessoryScale }, { translateY: bgConfig.accessoryTranslateY }] }}
              >
                <PetAnimation
                  source={petAnimConfig.source}
                  stateMachineName={petAnimConfig.stateMachineName}
                  focusInputName={petAnimConfig.focusInputName}
                  focusValue={0}
                  selectedHat={accessoryProps.selectedHat}
                  selectedCollar={accessoryProps.selectedCollar}
                  containerStyle={{ flex: 1, position: "absolute", top: 15, left: 0, right: 0, bottom: 0 }}
                  animationStyle={{ width: "65%", height: "65%" }}
                />
              </ImageBackground>
            ) : (
              <View style={{ width: "100%", height: 280, backgroundColor: CoralPalette.greyVeryLight, alignItems: "center", justifyContent: "center" }}>
                <Image
                  source={images[pet.id as keyof typeof images] ?? images.lighting}
                  resizeMode="contain"
                  style={{ width: "60%", height: "60%" }}
                />
              </View>
            )}
          </View>

          {/* Item Details */}
          <View style={{ paddingHorizontal: 4 }}>
            <Text style={[FONT, { fontSize: 24, fontWeight: "800", color: CoralPalette.dark }]} numberOfLines={1}>
              {pet.name}
            </Text>
            
            {!!pet.description && (
              <Text style={[FONT, { fontSize: 14, color: CoralPalette.mutedDark, marginTop: 6, lineHeight: 20 }]}>
                {pet.description}
              </Text>
            )}

            {/* Purchase Button or Lock Status */}
            {isPet ? (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPurchase}
                disabled={!pet || isPurchasing || pet.owned}
                style={{
                  marginTop: 20,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: pet.owned ? CoralPalette.greyLight : CoralPalette.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pet && !isPurchasing ? 1 : 0.6,
                }}
              >
                {pet.owned ? (
                  <Text style={[FONT, { fontSize: 16, fontWeight: "700", color: CoralPalette.mutedDark }]}>
                    ✓ Owned
                  </Text>
                ) : (
                  <>
                    <Image source={images.key} style={{ width: 18, height: 18, marginRight: 8 }} resizeMode="contain" />
                    <Text style={[FONT, { fontSize: 16, fontWeight: "800", color: CoralPalette.white }]}>
                      {isPurchasing ? "Loading..." : "View in Pet Store"}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={onPurchase}
                disabled={!pet || isPurchasing || pet.owned}
                style={{
                  marginTop: 20,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: pet.owned ? CoralPalette.greyLight : CoralPalette.primary,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pet && !isPurchasing ? 1 : 0.6,
                }}
              >
                {pet.owned ? (
                  <Text style={[FONT, { fontSize: 16, fontWeight: "700", color: CoralPalette.mutedDark }]}>
                    ✓ Owned
                  </Text>
                ) : (
                  <>
                    <Image source={images.token} style={{ width: 22, height: 22, marginRight: 8 }} resizeMode="contain" />
                    <Text style={[FONT, { fontSize: 18, fontWeight: "800", color: CoralPalette.white }]}>
                      {isPurchasing ? "Purchasing..." : pet.priceCoins.toLocaleString()}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {!!purchaseError && (
              <Text style={[FONT, { fontSize: 12, color: CoralPalette.primary, marginTop: 8, textAlign: "center" }]}>
                {purchaseError}
              </Text>
            )}
          </View>
        </>
      )}
    </View>
  );
};

type InsufficientCoinsCardProps = {
  petName?: string | null;
  onClose: () => void;
  onGetMoreCoins: () => void;
};

export const InsufficientCoinsCard = ({
  petName,
  onClose,
  onGetMoreCoins,
}: InsufficientCoinsCardProps) => (
  <View style={{ width: "100%", padding: 24 }}>
    {/* Icon */}
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: CoralPalette.primaryLight, alignItems: "center", justifyContent: "center" }}>
        <Image source={images.token} style={{ width: 32, height: 32 }} resizeMode="contain" />
      </View>
    </View>

    <Text style={[FONT, { fontSize: 20, fontWeight: "800", color: CoralPalette.dark, textAlign: "center" }]}>
      Not enough coins
    </Text>
    <Text style={[FONT, { fontSize: 14, color: CoralPalette.mutedDark, textAlign: "center", marginTop: 8, lineHeight: 20 }]}>
      You need more coins to purchase {petName ?? "this item"}.
    </Text>

    <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onClose}
        style={{
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: CoralPalette.greyLight,
          alignItems: "center",
        }}
      >
        <Text style={[FONT, { fontSize: 15, fontWeight: "600", color: CoralPalette.mutedDark }]}>
          Back
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onGetMoreCoins}
        style={{
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: CoralPalette.primary,
          alignItems: "center",
        }}
      >
        <Text style={[FONT, { fontSize: 15, fontWeight: "600", color: CoralPalette.white }]}>
          Get more coins
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

type PurchaseConfirmationCardProps = {
  petName?: string | null;
  petPrice?: number | null;
  onConfirm: () => void;
  onCancel: () => void;
  isConfirming: boolean;
};

export const PurchaseConfirmationCard = ({
  petName,
  petPrice,
  onConfirm,
  onCancel,
  isConfirming,
}: PurchaseConfirmationCardProps) => (
  <View style={{ width: "100%", padding: 24 }}>
    {/* Icon */}
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: CoralPalette.primaryLight, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 28 }}>🛒</Text>
      </View>
    </View>

    <Text style={[FONT, { fontSize: 20, fontWeight: "800", color: CoralPalette.dark, textAlign: "center" }]}>
      Confirm Purchase
    </Text>
    <Text style={[FONT, { fontSize: 14, color: CoralPalette.mutedDark, textAlign: "center", marginTop: 8, lineHeight: 20 }]}>
      Purchase <Text style={{ fontWeight: "700", color: CoralPalette.dark }}>{petName ?? "this item"}</Text> for{" "}
      <Text style={{ fontWeight: "700", color: CoralPalette.primary }}>{petPrice?.toLocaleString() ?? ""} coins</Text>?
    </Text>

    <View style={{ flexDirection: "row", marginTop: 24, gap: 12 }}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onCancel}
        disabled={isConfirming}
        style={{
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: CoralPalette.greyLight,
          alignItems: "center",
          opacity: isConfirming ? 0.6 : 1,
        }}
      >
        <Text style={[FONT, { fontSize: 15, fontWeight: "600", color: CoralPalette.mutedDark }]}>
          Cancel
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onConfirm}
        disabled={isConfirming}
        style={{
          flex: 1,
          paddingVertical: 14,
          borderRadius: 12,
          backgroundColor: CoralPalette.primary,
          alignItems: "center",
          opacity: isConfirming ? 0.6 : 1,
        }}
      >
        <Text style={[FONT, { fontSize: 15, fontWeight: "600", color: CoralPalette.white }]}>
          {isConfirming ? "Confirming..." : "Confirm"}
        </Text>
      </TouchableOpacity>
    </View>
  </View>
);

type PurchaseSuccessCardProps = {
  petName?: string | null;
  onClose: () => void;
};

export const PurchaseSuccessCard = ({
  petName,
  onClose,
}: PurchaseSuccessCardProps) => (
  <View style={{ width: "100%", padding: 24 }}>
    {/* Icon */}
    <View style={{ alignItems: "center", marginBottom: 16 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: CoralPalette.greenLight, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ fontSize: 28 }}>🎉</Text>
      </View>
    </View>

    <Text style={[FONT, { fontSize: 20, fontWeight: "800", color: CoralPalette.dark, textAlign: "center" }]}>
      Purchase Successful!
    </Text>
    <Text style={[FONT, { fontSize: 14, color: CoralPalette.mutedDark, textAlign: "center", marginTop: 8, lineHeight: 20 }]}>
      <Text style={{ fontWeight: "700", color: CoralPalette.dark }}>{petName ?? "Your new item"}</Text> has been added to your collection.
    </Text>

    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onClose}
      style={{
        marginTop: 24,
        paddingVertical: 14,
        borderRadius: 12,
        backgroundColor: CoralPalette.primary,
        alignItems: "center",
      }}
    >
      <Text style={[FONT, { fontSize: 15, fontWeight: "600", color: CoralPalette.white }]}>
        Back to Store
      </Text>
    </TouchableOpacity>
  </View>
);
